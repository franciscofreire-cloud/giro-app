import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronDown, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { TopBar } from '@/components/layout/TopBar';
import { Sale, PAYMENT_LABELS, PaymentMethod, DeliveryMethod, DELIVERY_LABELS } from '@/types';
import { generateId, todayISO, calcProfit, formatBRL } from '@/lib/utils';
import { cn } from '@/lib/utils';

const PAYMENT_METHODS: { label: string; value: PaymentMethod }[] = [
  { label: 'PIX', value: 'pix' },
  { label: 'Dinheiro', value: 'cash' },
  { label: 'Cartão', value: 'card' },
  { label: 'Transferência', value: 'transfer' },
  { label: 'Outro', value: 'other' },
];

const DELIVERY_METHODS: { label: string; value: DeliveryMethod }[] = [
  { label: 'Retirada', value: 'pickup' },
  { label: 'Entrega por mim', value: 'delivery_self' },
  { label: 'Entrega por Uber Moto', value: 'delivery_uber' },
  { label: 'Retirada por Uber Moto', value: 'pickup_uber' },
];

export function SaleForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preItemId = searchParams.get('itemId') ?? '';

  const items = useStore((s) => s.items);
  const addSale = useStore((s) => s.addSale);

  const availableItems = useMemo(
    () => items.filter((i) => i.status === 'available' || i.status === 'reserved'),
    [items]
  );

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    itemId: preItemId,
    salePrice: '',
    paymentMethod: 'pix' as PaymentMethod,
    deliveryMethod: 'pickup' as DeliveryMethod,
    deliveryCost: '',
    buyer: '',
    saleDate: todayISO(),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedItem = useMemo(
    () => items.find((i) => i.id === form.itemId),
    [items, form.itemId]
  );

  const salePriceNum = parseFloat(form.salePrice.replace(',', '.')) || 0;
  const deliveryCostNum = parseFloat(form.deliveryCost.replace(',', '.')) || 0;
  
  const { profit, margin } = selectedItem
    ? calcProfit(salePriceNum, selectedItem.purchasePrice, deliveryCostNum)
    : { profit: 0, margin: 0 };

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  }

  // Pre-fill suggested price when item is selected
  useEffect(() => {
    if (selectedItem && !form.salePrice) {
      setForm((prev) => ({
        ...prev,
        salePrice: selectedItem.suggestedPrice.toFixed(2),
      }));
    }
  }, [selectedItem?.id]);

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.itemId) errs.itemId = 'Selecione um item';
    if (!form.salePrice || salePriceNum <= 0) errs.salePrice = 'Informe o valor de venda';
    if (form.deliveryCost && deliveryCostNum < 0) errs.deliveryCost = 'Custo inválido';
    if (!form.saleDate) errs.saleDate = 'Informe a data';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate() || !selectedItem) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));

    const sale: Sale = {
      id: generateId(),
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      itemCategory: selectedItem.category,
      salePrice: salePriceNum,
      purchasePrice: selectedItem.purchasePrice,
      deliveryMethod: form.deliveryMethod,
      deliveryCost: deliveryCostNum,
      profit,
      marginPercent: margin,
      paymentMethod: form.paymentMethod,
      buyer: form.buyer.trim(),
      saleDate: form.saleDate,
      createdAt: new Date().toISOString(),
      photoUrl: selectedItem.photoUrl,
    };

    addSale(sale);
    setSaving(false);
    navigate('/vendas');
  }

  const isProfitable = profit > 0;

  return (
    <div className="flex flex-col min-h-full pb-24 md:pb-6">
      <TopBar title="Registrar Venda" showBack />

      <div className="px-4 md:px-0 py-4 md:py-8 space-y-4 md:max-w-xl md:mx-auto w-full">
        {/* Item select */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
            Item <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <select
              value={form.itemId}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, itemId: e.target.value, salePrice: '' }));
              }}
              className={cn(
                'w-full bg-zinc-900 border rounded-xl px-3.5 py-2.5 text-sm text-white appearance-none pr-9',
                'focus:outline-none transition-all',
                errors.itemId
                  ? 'border-rose-500/60 focus:border-rose-500'
                  : 'border-zinc-800 focus:border-emerald-500/50'
              )}
            >
              <option value="">Selecione um item...</option>
              {availableItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} — {formatBRL(item.purchasePrice)}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          </div>
          {errors.itemId && <p className="text-xs text-rose-400 mt-1">{errors.itemId}</p>}
          {availableItems.length === 0 && (
            <p className="text-xs text-zinc-500 mt-1">
              Nenhum item disponível. <button onClick={() => navigate('/estoque/novo')} className="text-emerald-400 underline">Adicionar item</button>
            </p>
          )}
        </div>

        {/* Selected item preview */}
        {selectedItem && (
          <div className="rounded-xl bg-zinc-800/60 border border-zinc-700 p-3 flex items-center gap-3 animate-fade-in">
            <div className="w-12 h-12 rounded-xl bg-zinc-700 overflow-hidden flex items-center justify-center text-2xl shrink-0">
              {selectedItem.photoUrl ? (
                <img src={selectedItem.photoUrl} alt={selectedItem.name} className="w-full h-full object-cover" />
              ) : '📦'}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{selectedItem.name}</p>
              <p className="text-xs text-zinc-500">{selectedItem.category} · Compra: {formatBRL(selectedItem.purchasePrice)}</p>
            </div>
          </div>
        )}

        {/* Sale price */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
            Valor de venda (R$) <span className="text-rose-400">*</span>
          </label>
          <input
            type="number"
            value={form.salePrice}
            onChange={(e) => set('salePrice', e.target.value)}
            placeholder="0,00"
            min="0"
            step="0.01"
            className={cn(
              'w-full bg-zinc-900 border rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500',
              'focus:outline-none transition-all',
              errors.salePrice
                ? 'border-rose-500/60 focus:border-rose-500'
                : 'border-zinc-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20'
            )}
          />
          {errors.salePrice && <p className="text-xs text-rose-400 mt-1">{errors.salePrice}</p>}
        </div>

        {/* Profit preview */}
        {selectedItem && salePriceNum > 0 && (
          <div className={cn(
            'rounded-xl border p-4 flex items-center justify-between animate-fade-in',
            isProfitable
              ? 'bg-emerald-500/10 border-emerald-500/20'
              : 'bg-rose-500/10 border-rose-500/20'
          )}>
            <div className="flex items-center gap-2">
              {isProfitable
                ? <TrendingUp size={18} className="text-emerald-400" />
                : <TrendingDown size={18} className="text-rose-400" />
              }
              <div>
                <p className={cn('text-sm font-semibold', isProfitable ? 'text-emerald-400' : 'text-rose-400')}>
                  {isProfitable ? 'Lucro' : 'Prejuízo'}
                </p>
                <p className="text-xs text-zinc-500">Margem de {Math.abs(margin).toFixed(1)}%</p>
              </div>
            </div>
            <p className={cn('text-2xl font-bold tabular-nums', isProfitable ? 'text-emerald-400' : 'text-rose-400')}>
              {isProfitable ? '+' : ''}{formatBRL(profit)}
            </p>
          </div>
        )}

        {/* Delivery Method */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-2">Tipo de entrega</label>
          <div className="flex gap-2 flex-wrap mb-3">
            {DELIVERY_METHODS.map(({ label, value }) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setForm((prev) => ({
                    ...prev,
                    deliveryMethod: value,
                    // If pickup is selected, clear deliveryCost automatically
                    deliveryCost: value === 'pickup' ? '' : prev.deliveryCost,
                  }));
                }}
                className={cn(
                  'px-3 py-2 rounded-xl text-xs font-medium border transition-all',
                  form.deliveryMethod === value
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Delivery Cost input (visible when not Retirada, or just always shown when needed) */}
          {form.deliveryMethod !== 'pickup' && (
            <div className="animate-fade-in space-y-1">
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Custo de entrega / taxa (R$)
              </label>
              <input
                type="number"
                value={form.deliveryCost}
                onChange={(e) => set('deliveryCost', e.target.value)}
                placeholder="0,00"
                min="0"
                step="0.01"
                className={cn(
                  'w-full bg-zinc-900 border rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500',
                  'focus:outline-none transition-all',
                  errors.deliveryCost
                    ? 'border-rose-500/60 focus:border-rose-500'
                    : 'border-zinc-800 focus:border-emerald-500/50'
                )}
              />
              {errors.deliveryCost && <p className="text-xs text-rose-400 mt-1">{errors.deliveryCost}</p>}
              <p className="text-[11px] text-zinc-500">
                Este valor será descontado diretamente do lucro final da venda.
              </p>
            </div>
          )}
        </div>

        {/* Payment method */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-2">Forma de pagamento</label>
          <div className="flex gap-2 flex-wrap">
            {PAYMENT_METHODS.map(({ label, value }) => (
              <button
                key={value}
                type="button"
                onClick={() => set('paymentMethod', value)}
                className={cn(
                  'px-3 py-2 rounded-xl text-xs font-medium border transition-all',
                  form.paymentMethod === value
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Buyer + Date */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Comprador</label>
            <input
              type="text"
              value={form.buyer}
              onChange={(e) => set('buyer', e.target.value)}
              placeholder="Nome (opcional)"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Data <span className="text-rose-400">*</span>
            </label>
            <input
              type="date"
              value={form.saleDate}
              onChange={(e) => set('saleDate', e.target.value)}
              className={cn(
                'w-full bg-zinc-900 border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none transition-all',
                errors.saleDate ? 'border-rose-500/60' : 'border-zinc-800 focus:border-emerald-500/50'
              )}
              style={{ colorScheme: 'dark' }}
            />
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={saving || !form.itemId}
          className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 active:scale-[0.98] transition-all duration-200 text-white font-bold text-sm flex items-center justify-center gap-2"
        >
          {saving ? (
            <><Loader2 size={18} className="animate-spin" /> Registrando...</>
          ) : (
            'Confirmar Venda'
          )}
        </button>

        <p className="text-xs text-zinc-600 text-center">
          O item será marcado como "Vendido" automaticamente
        </p>
      </div>
    </div>
  );
}
