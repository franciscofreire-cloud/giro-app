import { useNavigate } from 'react-router-dom';
import { Plus, ShoppingBag, TrendingUp, Calendar } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { TopBar } from '@/components/layout/TopBar';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatBRL, formatDate } from '@/lib/utils';
import { PAYMENT_LABELS, DELIVERY_LABELS } from '@/types';

const categoryEmoji: Record<string, string> = {
  'Eletrônicos': '📱', 'Roupas': '👕', 'Móveis': '🪑',
  'Acessórios': '⌚', 'Calçados': '👟', 'Eletrodomésticos': '🔌',
  'Livros': '📚', 'Esportes': '⚽', 'Brinquedos': '🧸', 'Outros': '📦',
};

export function Sales() {
  const navigate = useNavigate();
  const sales = useStore((s) => s.sales);

  const sorted = [...sales].sort(
    (a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()
  );

  const totalProfit = sales.reduce((acc, s) => acc + s.profit, 0);
  const totalRevenue = sales.reduce((acc, s) => acc + s.salePrice, 0);

  return (
    <div className="flex flex-col min-h-full pb-24 md:pb-6">
      <TopBar
        title="Vendas"
        subtitle={`${sales.length} vendas registradas`}
        right={
          <button
            onClick={() => navigate('/vendas/nova')}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold transition-colors"
          >
            <Plus size={14} /> Nova venda
          </button>
        }
      />

      {/* Summary */}
      {sales.length > 0 && (
        <div className="px-4 md:px-8 pt-3 pb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-2xl bg-zinc-900 border border-emerald-500/20 p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={14} className="text-emerald-400" />
              <p className="text-xs text-emerald-400/70">Lucro total</p>
            </div>
            <p className="text-xl font-bold text-emerald-400 tabular-nums">{formatBRL(totalProfit)}</p>
          </div>
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingBag size={14} className="text-zinc-400" />
              <p className="text-xs text-zinc-500">Faturamento</p>
            </div>
            <p className="text-xl font-bold text-white tabular-nums">{formatBRL(totalRevenue)}</p>
          </div>
          <div className="hidden md:block rounded-2xl bg-zinc-900 border border-zinc-800 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={14} className="text-zinc-400" />
              <p className="text-xs text-zinc-500">Vendas</p>
            </div>
            <p className="text-xl font-bold text-white tabular-nums">{sales.length}</p>
          </div>
          <div className="hidden md:block rounded-2xl bg-zinc-900 border border-zinc-800 p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={14} className="text-zinc-400" />
              <p className="text-xs text-zinc-500">Margem média</p>
            </div>
            <p className="text-xl font-bold text-white tabular-nums">
              {sales.length > 0
                ? (sales.reduce((a, s) => a + s.marginPercent, 0) / sales.length).toFixed(0)
                : 0}%
            </p>
          </div>
        </div>
      )}

      {/* Sales list — 1 col mobile, 2 cols desktop */}
      <div className="px-4 md:px-8 flex-1">
        {sorted.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag size={28} />}
            title="Nenhuma venda ainda"
            description="Registre sua primeira venda selecionando um item do estoque."
            action={
              <button onClick={() => navigate('/vendas/nova')}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-400 active:scale-95 transition-all">
                Registrar venda
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {sorted.map((sale, i) => (
              <div key={sale.id}
                className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 animate-fade-in-up stagger-item"
                style={{ animationDelay: `${i * 40}ms`, opacity: 0 }}>
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-zinc-800 flex items-center justify-center text-xl shrink-0 overflow-hidden">
                    {sale.photoUrl ? (
                      <img
                        src={sale.photoUrl}
                        alt={sale.itemName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      categoryEmoji[sale.itemCategory] ?? '📦'
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{sale.itemName}</p>
                    <p className="text-xs text-zinc-500">{sale.itemCategory}</p>
                     <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                        {PAYMENT_LABELS[sale.paymentMethod]}
                      </span>
                      {sale.deliveryMethod && sale.deliveryMethod !== 'pickup' && (
                        <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                          {DELIVERY_LABELS[sale.deliveryMethod]}
                        </span>
                      )}
                      {sale.buyer && (
                        <span className="text-[10px] text-zinc-500">→ {sale.buyer}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base font-bold text-emerald-400 tabular-nums">+{formatBRL(sale.profit)}</p>
                    <p className="text-xs text-zinc-400 tabular-nums">{formatBRL(sale.salePrice)}</p>
                    <p className="text-[10px] text-zinc-600">{sale.marginPercent.toFixed(0)}% margem</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800 text-[11px] text-zinc-600">
                  <div className="flex items-center gap-1">
                    <Calendar size={11} className="text-zinc-600" />
                    <span>{formatDate(sale.saleDate)}</span>
                    <span className="mx-1 text-zinc-700">·</span>
                    <span>Comp.: {formatBRL(sale.purchasePrice)}</span>
                  </div>
                  {sale.deliveryCost > 0 && (
                    <span className="text-rose-400 font-medium">
                      Entrega: -{formatBRL(sale.deliveryCost)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB — mobile only */}
      <button
        onClick={() => navigate('/vendas/nova')}
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 shadow-lg shadow-emerald-500/30 flex items-center justify-center transition-all duration-200 z-40"
      >
        <Plus size={24} className="text-white" />
      </button>
    </div>
  );
}
