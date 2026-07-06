import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Item, Sale, AppSettings } from '@/types';
import { createClient } from '@supabase/supabase-js';

interface StoreState {
  items: Item[];
  sales: Sale[];
  settings: AppSettings;
  loading: boolean;
  dbConnected: boolean;

  // Lifecycle
  loadData: () => Promise<void>;

  // Item actions
  addItem: (item: Item) => Promise<void>;
  updateItem: (id: string, patch: Partial<Item>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;

  // Sale actions
  addSale: (sale: Sale) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;

  // Settings
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;

  // Reset
  resetData: () => Promise<void>;
}

const DEFAULT_SETTINGS: AppSettings = {
  defaultMargin: 50,
  storeName: 'Minha Loja',
  userName: 'Francisco',
};

// Connect to Supabase if environment variables are available
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      items: [],
      sales: [],
      settings: DEFAULT_SETTINGS,
      loading: false,
      dbConnected: !!supabase,

      loadData: async () => {
        if (!supabase) {
          console.log('Supabase credentials não configuradas no arquivo .env. Usando armazenamento local.');
          return;
        }

        set({ loading: true });
        try {
          // Fetch settings, items, and sales from Supabase
          const [settingsRes, itemsRes, salesRes] = await Promise.all([
            supabase.from('settings').select('key, value'),
            supabase.from('items').select('*').order('created_at', { ascending: false }),
            supabase.from('sales').select('*').order('created_at', { ascending: false }),
          ]);

          // Handle possible errors
          if (settingsRes.error) console.error('Erro settings:', settingsRes.error);
          if (itemsRes.error) console.error('Erro items:', itemsRes.error);
          if (salesRes.error) console.error('Erro sales:', salesRes.error);

          // Map settings
          const settingsObj = { ...DEFAULT_SETTINGS };
          if (settingsRes.data) {
            settingsRes.data.forEach((row: any) => {
              if (row.key === 'defaultMargin') settingsObj.defaultMargin = parseFloat(row.value) || 50;
              if (row.key === 'storeName') settingsObj.storeName = row.value;
              if (row.key === 'userName') settingsObj.userName = row.value;
            });
          }

          // Map items
          const items: Item[] = (itemsRes.data || []).map((item: any) => ({
            id: item.id,
            name: item.name,
            description: item.description || '',
            category: item.category,
            photoUrl: item.photo_url || '',
            purchaseDate: item.purchase_date,
            purchasePrice: parseFloat(item.purchase_price) || 0,
            condition: item.condition,
            supplier: item.supplier || '',
            status: item.status,
            suggestedPrice: parseFloat(item.suggested_price) || 0,
            createdAt: item.created_at,
          }));

          // Map sales
          const sales: Sale[] = (salesRes.data || []).map((sale: any) => ({
            id: sale.id,
            itemId: sale.item_id,
            itemName: sale.item_name,
            itemCategory: sale.item_category,
            salePrice: parseFloat(sale.sale_price) || 0,
            purchasePrice: parseFloat(sale.purchase_price) || 0,
            deliveryMethod: sale.delivery_method,
            deliveryCost: parseFloat(sale.delivery_cost) || 0,
            profit: parseFloat(sale.profit) || 0,
            marginPercent: parseFloat(sale.margin_percent) || 0,
            paymentMethod: sale.payment_method,
            buyer: sale.buyer || '',
            saleDate: sale.sale_date,
            createdAt: sale.created_at,
            photoUrl: sale.photo_url || '',
          }));

          set({ items, sales, settings: settingsObj, loading: false });
          console.log('✅ Dados carregados com sucesso do Supabase!');
        } catch (error) {
          console.error('Erro geral ao sincronizar com Supabase:', error);
          set({ loading: false });
        }
      },

      addItem: async (item) => {
        set((state) => ({ items: [item, ...state.items] }));
        if (supabase) {
          try {
            await supabase.from('items').insert([{
              id: item.id,
              name: item.name,
              description: item.description || '',
              category: item.category,
              photo_url: item.photoUrl || '',
              purchase_date: item.purchaseDate,
              purchase_price: item.purchasePrice,
              condition: item.condition,
              supplier: item.supplier || '',
              status: item.status,
              suggested_price: item.suggestedPrice,
              created_at: item.createdAt,
            }]);
          } catch (e) {
            console.error('Erro ao salvar item no Supabase:', e);
          }
        }
      },

      updateItem: async (id, patch) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...patch } : item
          ),
        }));
        if (supabase) {
          try {
            const currentItem = get().items.find((i) => i.id === id);
            if (currentItem) {
              await supabase.from('items').update({
                name: currentItem.name,
                description: currentItem.description || '',
                category: currentItem.category,
                photo_url: currentItem.photoUrl || '',
                purchase_date: currentItem.purchaseDate,
                purchase_price: currentItem.purchasePrice,
                condition: currentItem.condition,
                supplier: currentItem.supplier || '',
                status: currentItem.status,
                suggested_price: currentItem.suggestedPrice,
              }).eq('id', id);
            }
          } catch (e) {
            console.error('Erro ao atualizar item no Supabase:', e);
          }
        }
      },

      deleteItem: async (id) => {
        set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
        if (supabase) {
          try {
            await supabase.from('items').delete().eq('id', id);
          } catch (e) {
            console.error('Erro ao deletar item no Supabase:', e);
          }
        }
      },

      addSale: async (sale) => {
        set((state) => ({
          sales: [sale, ...state.sales],
          items: state.items.map((item) =>
            item.id === sale.itemId ? { ...item, status: 'sold' } : item
          ),
        }));
        if (supabase) {
          try {
            await Promise.all([
              supabase.from('sales').insert([{
                id: sale.id,
                item_id: sale.itemId,
                item_name: sale.itemName,
                item_category: sale.itemCategory,
                sale_price: sale.salePrice,
                purchase_price: sale.purchasePrice,
                delivery_method: sale.deliveryMethod,
                delivery_cost: sale.deliveryCost,
                profit: sale.profit,
                margin_percent: sale.marginPercent,
                payment_method: sale.paymentMethod,
                buyer: sale.buyer || '',
                sale_date: sale.saleDate,
                created_at: sale.createdAt,
                photo_url: sale.photoUrl || '',
              }]),
              supabase.from('items').update({ status: 'sold' }).eq('id', sale.itemId),
            ]);
          } catch (e) {
            console.error('Erro ao registrar venda no Supabase:', e);
          }
        }
      },

      deleteSale: async (id) => {
        const sale = get().sales.find((s) => s.id === id);
        set((state) => ({
          sales: state.sales.filter((s) => s.id !== id),
          items: sale
            ? state.items.map((item) =>
                item.id === sale.itemId ? { ...item, status: 'available' } : item
              )
            : state.items,
        }));
        if (supabase && sale) {
          try {
            await Promise.all([
              supabase.from('sales').delete().eq('id', id),
              supabase.from('items').update({ status: 'available' }).eq('id', sale.itemId),
            ]);
          } catch (e) {
            console.error('Erro ao deletar venda no Supabase:', e);
          }
        }
      },

      updateSettings: async (patch) => {
        set((state) => ({ settings: { ...state.settings, ...patch } }));
        if (supabase) {
          try {
            const keys = Object.keys(patch) as Array<keyof AppSettings>;
            for (const key of keys) {
              const value = String(patch[key]);
              await supabase.from('settings').upsert({ key, value });
            }
          } catch (e) {
            console.error('Erro ao atualizar configurações no Supabase:', e);
          }
        }
      },

      resetData: async () => {
        set({ items: [], sales: [], settings: DEFAULT_SETTINGS });
        if (supabase) {
          try {
            await Promise.all([
              supabase.from('items').delete().neq('id', ''),
              supabase.from('sales').delete().neq('id', ''),
              supabase.from('settings').upsert([
                { key: 'defaultMargin', value: '50' },
                { key: 'storeName', value: 'Minha Loja' },
                { key: 'userName', value: 'Francisco' },
              ]),
            ]);
            console.log('✅ Banco de dados Supabase limpo com sucesso.');
          } catch (e) {
            console.error('Erro ao resetar dados no Supabase:', e);
          }
        }
      },
    }),
    {
      name: 'giro-app-storage',
      version: 4, // Bump storage version to isolate from Neon configurations
    }
  )
);
