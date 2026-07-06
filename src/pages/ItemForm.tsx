import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Camera, X, ChevronDown, Loader2, Trash2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { TopBar } from '@/components/layout/TopBar';
import { Item, CATEGORIES, ItemStatus, ItemCondition } from '@/types';
import { generateId, todayISO, calcSuggestedPrice, formatBRL } from '@/lib/utils';
import { cn } from '@/lib/utils';

const CONDITIONS: { label: string; value: ItemCondition }[] = [
  { label: 'Novo', value: 'new' },
  { label: 'Seminovo', value: 'like-new' },
  { label: 'Usado', value: 'used' },
];

const STATUSES: { label: string; value: ItemStatus }[] = [
  { label: 'Disponível', value: 'available' },
  { label: 'Reservado', value: 'reserved' },
  { label: 'Aguardando entrega', value: 'awaiting' },
];

export function ItemForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = id && id !== 'novo';

  const addItem = useStore((s) => s.addItem);
  const updateItem = useStore((s) => s.updateItem);
  const deleteItem = useStore((s) => s.deleteItem);
  const existingItem = useStore((s) => s.items.find((i) => i.id === id));
  const settings = useStore((s) => s.settings);

  const [saving, setSaving] = useState(false);
  const [photo, setPhoto] = useState<string>(existingItem?.photoUrl ?? '');
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: existingItem?.name ?? '',
    description: existingItem?.description ?? '',
    category: existingItem?.category ?? CATEGORIES[0],
    purchaseDate: existingItem?.purchaseDate ?? todayISO(),
    purchasePrice: existingItem?.purchasePrice ? String(existingItem.purchasePrice) : '',
    condition: existingItem?.condition ?? 'used' as ItemCondition,
    supplier: existingItem?.supplier ?? '',
    status: (existingItem?.status === 'sold' ? 'available' : existingItem?.status) ?? 'available' as ItemStatus,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const purchaseNum = parseFloat(form.purchasePrice.replace(',', '.')) || 0;
  const suggestedPrice = calcSuggestedPrice(purchaseNum, settings.defaultMargin);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Nome é obrigatório';
    if (!form.purchasePrice || purchaseNum <= 0) errs.purchasePrice = 'Informe um valor válido';
    if (!form.purchaseDate) errs.purchaseDate = 'Informe a data de compra';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));

    const item: Item = {
      id: isEditing ? id! : generateId(),
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      photoUrl: photo,
      purchaseDate: form.purchaseDate,
      purchasePrice: purchaseNum,
      condition: form.condition,
      supplier: form.supplier.trim(),
      status: form.status,
      suggestedPrice,
      createdAt: existingItem?.createdAt ?? new Date().toISOString(),
    };

    if (isEditing) {
      updateItem(id!, item);
    } else {
      addItem(item);
    }
    setSaving(false);
    navigate('/estoque');
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleDelete() {
    if (confirm(`Excluir "${existingItem?.name}"? Esta ação não pode ser desfeita.`)) {
      deleteItem(id!);
      navigate('/estoque');
    }
  }

  return (
    <div className="flex flex-col min-h-full pb-24 md:pb-6">
      <TopBar
        title={isEditing ? 'Editar Item' : 'Novo Item'}
        showBack
        right={
          isEditing && (
            <button
              onClick={handleDelete}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          )
        }
      />

      <div className="px-4 md:px-0 py-4 md:py-8 space-y-4 md:max-w-xl md:mx-auto w-full">
        {/* Photo */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-2">Foto</label>
          <div
            onClick={() => fileRef.current?.click()}
            className="relative w-full aspect-video rounded-2xl bg-zinc-900 border-2 border-dashed border-zinc-700 flex items-center justify-center cursor-pointer hover:border-emerald-500/50 hover:bg-zinc-800/50 transition-all overflow-hidden group"
          >
            {photo ? (
              <>
                <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                <button
                  onClick={(e) => { e.stopPropagation(); setPhoto(''); }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                >
                  <X size={14} className="text-white" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-zinc-500 group-hover:text-zinc-400 transition-colors">
                <Camera size={28} />
                <p className="text-xs font-medium">Toque para adicionar foto</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        </div>

        {/* Name */}
        <Field label="Nome / Descrição" error={errors.name} required>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Ex: iPhone 12 64GB"
            className={inputClass(!!errors.name)}
          />
        </Field>

        {/* Description */}
        <Field label="Detalhes adicionais">
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Condições, acessórios inclusos, observações..."
            rows={3}
            className={cn(inputClass(false), 'resize-none')}
          />
        </Field>

        {/* Category */}
        <Field label="Categoria">
          <div className="relative">
            <select
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              className={cn(inputClass(false), 'appearance-none pr-9')}
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          </div>
        </Field>

        {/* Condition */}
        <Field label="Condição">
          <div className="flex gap-2">
            {CONDITIONS.map(({ label, value }) => (
              <button
                key={value}
                type="button"
                onClick={() => set('condition', value)}
                className={cn(
                  'flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all',
                  form.condition === value
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </Field>

        {/* Purchase Date + Price */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Data de compra" error={errors.purchaseDate} required>
            <input
              type="date"
              value={form.purchaseDate}
              onChange={(e) => set('purchaseDate', e.target.value)}
              className={cn(inputClass(!!errors.purchaseDate), 'text-white')}
              style={{ colorScheme: 'dark' }}
            />
          </Field>
          <Field label="Valor de compra (R$)" error={errors.purchasePrice} required>
            <input
              type="number"
              value={form.purchasePrice}
              onChange={(e) => set('purchasePrice', e.target.value)}
              placeholder="0,00"
              min="0"
              step="0.01"
              className={inputClass(!!errors.purchasePrice)}
            />
          </Field>
        </div>

        {/* Suggested price preview */}
        {purchaseNum > 0 && (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 flex items-center justify-between animate-fade-in">
            <div>
              <p className="text-xs text-emerald-400/70 font-medium">Preço sugerido</p>
              <p className="text-xs text-zinc-500">Margem de {settings.defaultMargin}%</p>
            </div>
            <p className="text-lg font-bold text-emerald-400 tabular-nums">{formatBRL(suggestedPrice)}</p>
          </div>
        )}

        {/* Supplier */}
        <Field label="Fornecedor / Origem">
          <input
            type="text"
            value={form.supplier}
            onChange={(e) => set('supplier', e.target.value)}
            placeholder="OLX, Marketplace, Amigo..."
            className={inputClass(false)}
          />
        </Field>

        {/* Status */}
        <Field label="Status">
          <div className="flex gap-2 flex-wrap">
            {STATUSES.map(({ label, value }) => (
              <button
                key={value}
                type="button"
                onClick={() => set('status', value)}
                className={cn(
                  'flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all min-w-[100px]',
                  form.status === value
                    ? value === 'available'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : value === 'awaiting'
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </Field>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 active:scale-[0.98] transition-all duration-200 text-white font-bold text-sm flex items-center justify-center gap-2"
        >
          {saving ? (
            <><Loader2 size={18} className="animate-spin" /> Salvando...</>
          ) : (
            isEditing ? 'Salvar alterações' : 'Adicionar ao estoque'
          )}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children, error, required }: {
  label: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-1.5">
        {label} {required && <span className="text-rose-400">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
    </div>
  );
}

function inputClass(hasError: boolean) {
  return cn(
    'w-full bg-zinc-900 border rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500',
    'focus:outline-none transition-all',
    hasError
      ? 'border-rose-500/60 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
      : 'border-zinc-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20'
  );
}
