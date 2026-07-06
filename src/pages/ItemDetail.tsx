import { useNavigate, useParams } from 'react-router-dom';
import { ShoppingBag, Calendar, Tag, Package, TrendingUp, Edit3, DollarSign } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { TopBar } from '@/components/layout/TopBar';
import { StatusBadge, ConditionBadge, CategoryBadge } from '@/components/shared/Badge';
import { formatBRL, formatDate } from '@/lib/utils';
import { CONDITION_LABELS, DELIVERY_LABELS } from '@/types';

const categoryEmoji: Record<string, string> = {
  'Eletrônicos': '📱', 'Roupas': '👕', 'Móveis': '🪑',
  'Acessórios': '⌚', 'Calçados': '👟', 'Eletrodomésticos': '🔌',
  'Livros': '📚', 'Esportes': '⚽', 'Brinquedos': '🧸', 'Outros': '📦',
};

export function ItemDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const item = useStore((s) => s.items.find((i) => i.id === id));
  const sale = useStore((s) => s.sales.find((s) => s.itemId === id));

  if (!item) {
    return (
      <div className="flex flex-col min-h-full">
        <TopBar title="Item" showBack />
        <div className="flex items-center justify-center flex-1">
          <p className="text-zinc-500">Item não encontrado</p>
        </div>
      </div>
    );
  }

  const emoji = categoryEmoji[item.category] ?? '📦';
  const margin = item.purchasePrice > 0
    ? ((item.suggestedPrice - item.purchasePrice) / item.purchasePrice) * 100
    : 0;

  return (
    <div className="flex flex-col min-h-full pb-24 md:pb-6">
      <TopBar
        title={item.name}
        showBack
        right={
          item.status !== 'sold' && (
            <button
              onClick={() => navigate(`/estoque/${id}/editar`)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors"
            >
              <Edit3 size={16} />
            </button>
          )
        }
      />

      {/* Photo / Hero */}
      <div className="w-full aspect-video bg-zinc-900 flex items-center justify-center overflow-hidden">
        {item.photoUrl ? (
          <img src={item.photoUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-7xl">{emoji}</span>
        )}
      </div>

      <div className="px-4 md:px-0 py-5 md:py-8 space-y-5 md:max-w-xl md:mx-auto w-full">
        {/* Name + badges */}
        <div>
          <div className="flex items-start gap-2 mb-3">
            <h1 className="text-xl font-bold text-white flex-1 leading-tight">{item.name}</h1>
            <StatusBadge status={item.status} />
          </div>
          <div className="flex gap-2 flex-wrap">
            <CategoryBadge category={item.category} />
            <ConditionBadge condition={item.condition} />
          </div>
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-sm text-zinc-400 leading-relaxed">{item.description}</p>
        )}

        {/* Price info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={14} className="text-zinc-500" />
              <p className="text-xs text-zinc-500 font-medium">Comprado por</p>
            </div>
            <p className="text-xl font-bold text-white tabular-nums">{formatBRL(item.purchasePrice)}</p>
          </div>
          <div className="rounded-2xl bg-zinc-900 border border-emerald-500/20 p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={14} className="text-emerald-400" />
              <p className="text-xs text-emerald-400/70 font-medium">Vender por</p>
            </div>
            <p className="text-xl font-bold text-emerald-400 tabular-nums">{formatBRL(item.suggestedPrice)}</p>
            <p className="text-[10px] text-zinc-500">Margem {margin.toFixed(0)}%</p>
          </div>
        </div>

        {/* Details */}
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 divide-y divide-zinc-800">
          <DetailRow icon={<Calendar size={14} />} label="Data de compra" value={formatDate(item.purchaseDate)} />
          <DetailRow icon={<Tag size={14} />} label="Categoria" value={item.category} />
          <DetailRow icon={<Package size={14} />} label="Condição" value={CONDITION_LABELS[item.condition]} />
          {item.supplier && (
            <DetailRow icon={<ShoppingBag size={14} />} label="Fornecedor" value={item.supplier} />
          )}
        </div>

        {/* Sale info if sold */}
        {item.status === 'sold' && sale && (
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 space-y-3">
            <p className="text-sm font-semibold text-emerald-400">✅ Vendido</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-[10px] text-zinc-500">Vendido por</p>
                <p className="text-sm font-bold text-white tabular-nums">{formatBRL(sale.salePrice)}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500">Lucro líquido</p>
                <p className="text-sm font-bold text-emerald-400 tabular-nums">+{formatBRL(sale.profit)}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500">Margem</p>
                <p className="text-sm font-bold text-emerald-400 tabular-nums">{sale.marginPercent.toFixed(0)}%</p>
              </div>
            </div>
            
            {/* Delivery Details */}
            <div className="pt-2 border-t border-emerald-500/10 text-xs text-zinc-400 space-y-1">
              <p>Vendido em {formatDate(sale.saleDate)}{sale.buyer ? ` para ${sale.buyer}` : ''}</p>
              {sale.deliveryMethod && (
                <p>
                  Entrega: <span className="text-zinc-200">{DELIVERY_LABELS[sale.deliveryMethod]}</span>
                  {sale.deliveryCost > 0 && (
                    <span className="text-rose-400 font-medium ml-1">
                      (-{formatBRL(sale.deliveryCost)})
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        {item.status !== 'sold' && (
          <div className="space-y-3">
            <button
              onClick={() => navigate(`/vendas/nova?itemId=${item.id}`)}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] transition-all text-white font-bold text-sm"
            >
              Registrar Venda
            </button>
            <button
              onClick={() => navigate(`/estoque/${id}/editar`)}
              className="w-full py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 active:scale-[0.98] transition-all text-zinc-300 font-medium text-sm"
            >
              Editar item
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="text-zinc-500">{icon}</div>
      <p className="text-xs text-zinc-500 flex-1">{label}</p>
      <p className="text-sm text-white font-medium">{value}</p>
    </div>
  );
}
