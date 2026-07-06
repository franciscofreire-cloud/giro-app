import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import {
  Wallet, TrendingUp, Package, ShoppingBag, ChevronRight, Zap,
} from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';
import { useStore } from '@/store/useStore';
import { StatCard } from '@/components/shared/StatCard';
import { formatBRL, formatDate } from '@/lib/utils';
import { PAYMENT_LABELS } from '@/types';

function ChartTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs shadow-xl">
        <p className="text-zinc-400 mb-1 font-medium">{label}</p>
        <p className="text-emerald-400 font-bold">Lucro: {formatBRL(payload[0]?.value ?? 0)}</p>
        <p className="text-zinc-300">Fat: {formatBRL(payload[1]?.value ?? 0)}</p>
      </div>
    );
  }
  return null;
}

export function Dashboard() {
  const navigate = useNavigate();
  const settings = useStore((s) => s.settings);
  const {
    investedCapital, stockCount, monthlyRevenue,
    monthlyProfit, recentSales, monthlyProfitChart,
  } = useDashboard();

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div className="flex flex-col min-h-full pb-24 md:pb-6">
      {/* Header */}
      <div className="px-4 md:px-8 pt-6 pb-4 flex items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm text-zinc-500">{greeting},</p>
          <h1 className="text-xl md:text-2xl font-bold text-white truncate">{settings.storeName} 👋</h1>
          <p className="text-xs text-zinc-600">
            {now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      {/* KPI Cards — 3 cols mobile & desktop */}
      <div className="px-4 md:px-8 grid grid-cols-3 gap-2 md:gap-4 mb-6">
        <StatCard label="Lucro do Mês" value={formatBRL(monthlyProfit)} sub="Mês atual"
          icon={<TrendingUp size={18} />} variant={monthlyProfit >= 0 ? 'profit' : 'loss'} delay={0} />
        <StatCard label="Itens em Estoque" value={String(stockCount)} sub="Total em estoque"
          icon={<Package size={18} />} variant="blue" delay={60} />
        <StatCard label="Faturamento" value={formatBRL(monthlyRevenue)} sub="Mês atual"
          icon={<ShoppingBag size={18} />} variant="default" delay={120} />
      </div>

      {/* Desktop: side by side — Chart + Recent Sales */}
      <div className="px-4 md:px-8 flex flex-col md:flex-row gap-5 mb-6">
        {/* Profit Chart */}
        <div className="md:flex-1 rounded-2xl bg-zinc-900 border border-zinc-800 p-4 animate-fade-in-up"
          style={{ animationDelay: '200ms', opacity: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Lucro Mensal</h2>
              <p className="text-xs text-zinc-500">Últimos 6 meses</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <Zap size={16} className="text-emerald-400" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyProfitChart} barSize={24} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="profit" radius={[6, 6, 0, 0]} name="Lucro">
                {monthlyProfitChart.map((entry, i) => (
                  <Cell key={i} fill={entry.profit > 0 ? '#10b981' : '#f43f5e'}
                    opacity={i === monthlyProfitChart.length - 1 ? 1 : 0.6} />
                ))}
              </Bar>
              <Bar dataKey="revenue" radius={[6, 6, 0, 0]} fill="#3b82f6" opacity={0.3} name="Faturamento" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Sales */}
        <div className="md:w-80 lg:w-96">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white">Últimas Vendas</h2>
            <button onClick={() => navigate('/vendas')}
              className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
              Ver todas <ChevronRight size={14} />
            </button>
          </div>
          {recentSales.length === 0 ? (
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 text-center">
              <p className="text-sm text-zinc-500">Nenhuma venda registrada ainda</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentSales.map((sale, i) => (
                <div key={sale.id}
                  className="rounded-2xl bg-zinc-900 border border-zinc-800 p-3 flex items-center gap-3 animate-fade-in-up stagger-item"
                  style={{ animationDelay: `${250 + i * 60}ms`, opacity: 0 }}>
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-lg shrink-0 overflow-hidden">
                    {sale.photoUrl ? (
                      <img
                        src={sale.photoUrl}
                        alt={sale.itemName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getCategoryEmoji(sale.itemCategory)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{sale.itemName}</p>
                    <p className="text-xs text-zinc-500">
                      {formatDate(sale.saleDate)} · {PAYMENT_LABELS[sale.paymentMethod]}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-emerald-400 tabular-nums">+{formatBRL(sale.profit)}</p>
                    <p className="text-[10px] text-zinc-500 tabular-nums">{sale.marginPercent.toFixed(0)}% margem</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    'Eletrônicos': '📱', 'Roupas': '👕', 'Móveis': '🪑',
    'Acessórios': '⌚', 'Calçados': '👟', 'Eletrodomésticos': '🔌',
    'Livros': '📚', 'Esportes': '⚽', 'Brinquedos': '🧸',
    'Ferramentas': '🛠️', 'Outros': '📦',
  };
  return map[category] ?? '📦';
}
