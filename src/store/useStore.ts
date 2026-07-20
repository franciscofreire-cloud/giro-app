import { create } from 'zustand';
import { Item, Sale, AppSettings, User, UserSession, InstallmentPurchase } from '@/types';
import { createClient } from '@supabase/supabase-js';
import { hashSHA256 } from '@/lib/utils';

interface StoreState {
  items: Item[];
  sales: Sale[];
  settings: AppSettings;
  loading: boolean;
  dbConnected: boolean;

  // Auth State
  currentUser: UserSession | null;
  users: Record<string, User>;

  // Installments State
  installmentPurchases: InstallmentPurchase[];

  // Lifecycle
  loadData: () => Promise<void>;

  // Auth actions
  login: (email: string, passwordPlain: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updatePassword: (email: string, newPasswordPlain: string) => Promise<boolean>;

  // Installment actions
  addInstallmentPurchase: (purchase: InstallmentPurchase) => Promise<void>;
  deleteInstallmentPurchase: (id: string) => Promise<void>;
  toggleInstallmentPayment: (purchaseId: string, paymentId: string) => Promise<void>;

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

// Connect to Supabase with hardcoded fallbacks so it works out-of-the-box anywhere
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cybzhdxvpknpvemwpals.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5YnpoZHh2cGtucHZlbXdwYWxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzMTE2MzIsImV4cCI6MjA5ODg4NzYzMn0.OT8lvzQXdhfL8QRpHec0fCzJjozI9_fYYRjfOl3f8Ng';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Clean up any legacy localStorage cache to avoid state confusion
try {
  localStorage.removeItem('giro-app-storage');
} catch (e) {
  // Ignored in SSR
}

export const useStore = create<StoreState>()((set, get) => ({
  items: [],
  sales: [],
  settings: DEFAULT_SETTINGS,
  loading: false,
  dbConnected: !!supabase,
  currentUser: (() => {
    try {
      const cached = localStorage.getItem('giro_user_session');
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  })(),
  users: {},
  installmentPurchases: [],

  loadData: async () => {
    if (!supabase) {
      console.warn('Supabase não está configurado. Cadastre as chaves no seu .env.');
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

      // Check for errors (like tables not existing)
      if (settingsRes.error || itemsRes.error || salesRes.error) {
        if (settingsRes.error) console.error('Erro settings:', settingsRes.error);
        if (itemsRes.error) console.error('Erro items:', itemsRes.error);
        if (salesRes.error) console.error('Erro sales:', salesRes.error);
        set({ loading: false });
        return;
      }

      // Map settings & users & installments
      const settingsObj = { ...DEFAULT_SETTINGS };
      const users: Record<string, User> = {};
      let installmentPurchases: InstallmentPurchase[] = [];

      if (settingsRes.data) {
        settingsRes.data.forEach((row: any) => {
          if (row.key === 'defaultMargin') settingsObj.defaultMargin = parseFloat(row.value) || 50;
          if (row.key === 'storeName') settingsObj.storeName = row.value;
          if (row.key === 'userName') settingsObj.userName = row.value;
          
          if (row.key === 'installment_purchases') {
            try {
              installmentPurchases = JSON.parse(row.value);
            } catch (e) {
              console.error('Erro ao ler parcelamentos:', e);
            }
          }

          if (row.key.startsWith('user_')) {
            try {
              const uData = JSON.parse(row.value);
              users[uData.email] = uData;
            } catch (e) {
              console.error('Erro parse user:', e);
            }
          }
        });
      }

      // Garantir existência do administrador padrão
      const adminEmail = 'gilbertofreire624@gmail.com';
      if (!users[adminEmail]) {
        const adminUser: User = {
          email: adminEmail,
          role: 'admin',
          passwordHash: '953503f8e02d99d3e8ad4a6ff417038e3e4a29a4a7541ef4177d6ad8565a9e33', // giro123
        };
        users[adminEmail] = adminUser;
        await supabase.from('settings').upsert({
          key: `user_${adminEmail}`,
          value: JSON.stringify(adminUser),
        });
        console.log('✅ Usuário administrador padrão inicializado.');
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

      // Recarregar sessão do localStorage e verificar se o usuário ainda existe
      let currentUser = get().currentUser;
      const cachedSession = localStorage.getItem('giro_user_session');
      if (cachedSession) {
        try {
          const session = JSON.parse(cachedSession);
          if (users[session.email]) {
            currentUser = session;
          } else {
            currentUser = null;
            localStorage.removeItem('giro_user_session');
          }
        } catch (e) {
          currentUser = null;
          localStorage.removeItem('giro_user_session');
        }
      }

      set({ items, sales, settings: settingsObj, users, currentUser, installmentPurchases, loading: false });
      console.log('✅ Dados carregados com sucesso do Supabase!');
    } catch (error) {
      console.error('Erro ao conectar com Supabase:', error);
      set({ loading: false });
    }
  },

  addItem: async (item) => {
    if (!supabase) return;
    
    // Optimistic UI update
    set((state) => ({ items: [item, ...state.items] }));

    try {
      const { error } = await supabase.from('items').insert([{
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

      if (error) throw error;
    } catch (e) {
      console.error('Erro ao salvar item no Supabase:', e);
      // Rollback on failure
      set((state) => ({ items: state.items.filter((i) => i.id !== item.id) }));
      alert('Erro ao salvar o item no banco de dados. Certifique-se de que a tabela foi criada.');
    }
  },

  updateItem: async (id, patch) => {
    if (!supabase) return;

    const previousItems = get().items;

    // Optimistic UI update
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
    }));

    try {
      const currentItem = get().items.find((i) => i.id === id);
      if (currentItem) {
        const { error } = await supabase.from('items').update({
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

        if (error) throw error;
      }
    } catch (e) {
      console.error('Erro ao atualizar item no Supabase:', e);
      // Rollback
      set({ items: previousItems });
      alert('Erro ao atualizar o item no banco de dados.');
    }
  },

  deleteItem: async (id) => {
    if (!supabase) return;

    const previousItems = get().items;

    // Optimistic UI update
    set((state) => ({ items: state.items.filter((i) => i.id !== id) }));

    try {
      const { error } = await supabase.from('items').delete().eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.error('Erro ao deletar item no Supabase:', e);
      // Rollback
      set({ items: previousItems });
      alert('Erro ao excluir o item no banco de dados.');
    }
  },

  addSale: async (sale) => {
    if (!supabase) return;

    const previousSales = get().sales;
    const previousItems = get().items;

    // Optimistic UI update
    set((state) => ({
      sales: [sale, ...state.sales],
      items: state.items.map((item) =>
        item.id === sale.itemId ? { ...item, status: 'sold' } : item
      ),
    }));

    try {
      const [salesRes, itemsRes] = await Promise.all([
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

      if (salesRes.error) throw salesRes.error;
      if (itemsRes.error) throw itemsRes.error;
    } catch (e) {
      console.error('Erro ao registrar venda no Supabase:', e);
      // Rollback
      set({ sales: previousSales, items: previousItems });
      alert('Erro ao registrar a venda no banco de dados.');
    }
  },

  deleteSale: async (id) => {
    if (!supabase) return;

    const sale = get().sales.find((s) => s.id === id);
    if (!sale) return;

    const previousSales = get().sales;
    const previousItems = get().items;

    // Optimistic UI update
    set((state) => ({
      sales: state.sales.filter((s) => s.id !== id),
      items: state.items.map((item) =>
        item.id === sale.itemId ? { ...item, status: 'available' } : item
      ),
    }));

    try {
      const [salesRes, itemsRes] = await Promise.all([
        supabase.from('sales').delete().eq('id', id),
        supabase.from('items').update({ status: 'available' }).eq('id', sale.itemId),
      ]);

      if (salesRes.error) throw salesRes.error;
      if (itemsRes.error) throw itemsRes.error;
    } catch (e) {
      console.error('Erro ao deletar venda no Supabase:', e);
      // Rollback
      set({ sales: previousSales, items: previousItems });
      alert('Erro ao cancelar a venda no banco de dados.');
    }
  },

  updateSettings: async (patch) => {
    if (!supabase) return;

    const previousSettings = get().settings;

    // Optimistic UI update
    set((state) => ({ settings: { ...state.settings, ...patch } }));

    try {
      const keys = Object.keys(patch) as Array<keyof AppSettings>;
      for (const key of keys) {
        const value = String(patch[key]);
        const { error } = await supabase.from('settings').upsert({ key, value });
        if (error) throw error;
      }
    } catch (e) {
      console.error('Erro ao atualizar configurações no Supabase:', e);
      // Rollback
      set({ settings: previousSettings });
      alert('Erro ao salvar as configurações no banco de dados.');
    }
  },

  resetData: async () => {
    if (!supabase) return;

    const previousItems = get().items;
    const previousSales = get().sales;
    const previousSettings = get().settings;

    // Optimistic UI update
    set({ items: [], sales: [], settings: DEFAULT_SETTINGS });

    try {
      const [itemsRes, salesRes, settingsRes] = await Promise.all([
        supabase.from('items').delete().neq('id', ''),
        supabase.from('sales').delete().neq('id', ''),
        supabase.from('settings').upsert([
          { key: 'defaultMargin', value: '50' },
          { key: 'storeName', value: 'Minha Loja' },
          { key: 'userName', value: 'Francisco' },
        ]),
      ]);

      if (itemsRes.error) throw itemsRes.error;
      if (salesRes.error) throw salesRes.error;
      if (settingsRes.error) throw settingsRes.error;
      console.log('✅ Banco de dados Supabase limpo com sucesso.');
    } catch (e) {
      console.error('Erro ao resetar dados no Supabase:', e);
      // Rollback
      set({ items: previousItems, sales: previousSales, settings: previousSettings });
      alert('Erro ao limpar os dados no banco de dados.');
    }
  },

  login: async (email, passwordPlain) => {
    const users = get().users;
    const user = users[email];
    if (!user) return false;

    const hash = await hashSHA256(passwordPlain);
    if (user.passwordHash === hash) {
      const session: UserSession = { email: user.email, role: user.role };
      set({ currentUser: session });
      localStorage.setItem('giro_user_session', JSON.stringify(session));
      return true;
    }
    return false;
  },

  logout: async () => {
    set({ currentUser: null });
    localStorage.removeItem('giro_user_session');
  },

  updatePassword: async (email, newPasswordPlain) => {
    const users = { ...get().users };
    const user = users[email];
    if (!user) return false;

    const newHash = await hashSHA256(newPasswordPlain);
    const updatedUser: User = { ...user, passwordHash: newHash };
    
    users[email] = updatedUser;
    
    try {
      if (supabase) {
        const { error } = await supabase.from('settings').upsert({
          key: `user_${email}`,
          value: JSON.stringify(updatedUser),
        });
        if (error) throw error;
      }
      set({ users });
      return true;
    } catch (e) {
      console.error('Erro ao atualizar senha no Supabase:', e);
      return false;
    }
  },

  addInstallmentPurchase: async (purchase) => {
    const previous = get().installmentPurchases;
    const updated = [purchase, ...previous];
    set({ installmentPurchases: updated });
    try {
      if (supabase) {
        await supabase.from('settings').upsert({
          key: 'installment_purchases',
          value: JSON.stringify(updated),
        });
      }
    } catch (e) {
      console.error('Erro ao salvar parcelamento:', e);
      set({ installmentPurchases: previous });
    }
  },

  deleteInstallmentPurchase: async (id) => {
    const previous = get().installmentPurchases;
    const updated = previous.filter((p) => p.id !== id);
    set({ installmentPurchases: updated });
    try {
      if (supabase) {
        await supabase.from('settings').upsert({
          key: 'installment_purchases',
          value: JSON.stringify(updated),
        });
      }
    } catch (e) {
      console.error('Erro ao deletar parcelamento:', e);
      set({ installmentPurchases: previous });
    }
  },

  toggleInstallmentPayment: async (purchaseId, paymentId) => {
    const previous = get().installmentPurchases;
    const updated = previous.map((p) => {
      if (p.id !== purchaseId) return p;
      const updatedPayments = p.payments.map((pmt) => {
        if (pmt.id !== paymentId) return pmt;
        const newPaid = !pmt.paid;
        return {
          ...pmt,
          paid: newPaid,
          paidDate: newPaid ? new Date().toISOString().split('T')[0] : undefined,
        };
      });
      return { ...p, payments: updatedPayments };
    });

    set({ installmentPurchases: updated });
    try {
      if (supabase) {
        await supabase.from('settings').upsert({
          key: 'installment_purchases',
          value: JSON.stringify(updated),
        });
      }
    } catch (e) {
      console.error('Erro ao atualizar parcela:', e);
      set({ installmentPurchases: previous });
    }
  },
}));
