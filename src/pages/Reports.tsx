import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { BarChart2, TrendingUp, Clock, Download, Trophy } from 'lucide-react';
import { useReports } from '@/hooks/useDashboard';
import { useStore } from '@/store/useStore';
import { TopBar } from '@/components/layout/TopBar';
import { formatBRL, exportToCSV, formatDate } from '@/lib/utils';
import { PAYMENT_LABELS } from '@/types';
import { cn } from '@/lib/utils';

type Period = 'day' | 'week' | 'month' | 'year';

const PERIODS: { label: string; value: Period }[] = [
  { label: 'Hoje', value: 'day' },
  { label: 'Semana', value: 'week' },
  { label: 'Mês', value: 'month' },
  { label: 'Ano', value: 'year' },
];

function ChartTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs shadow-xl">
        <p className="text-zinc-400 mb-1 font-medium">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.fill }} className="font-bold">
            {p.name}: {formatBRL(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export function Reports() {
  const [period, setPeriod] = useState<Period>('month');
  const sales = useStore((s) => s.sales);
  const {
    filtered, totalRevenue, totalProfit, totalCost,
    avgMargin, categoryStats, avgGiroDays, barData,
  } = useReports(period);

  function handleExport() {
    const data = filtered.map((s) => ({
      Data: formatDate(s.saleDate),
      Item: s.itemName,
      Categoria: s.itemCategory,
      'Compra (R$)': s.purchasePrice.toFixed(2),
      'Venda (R$)': s.salePrice.toFixed(2),
      'Lucro (R$)': s.profit.toFixed(2),
      'Margem (%)': s.marginPercent.toFixed(2),
      Pagamento: PAYMENT_LABELS[s.paymentMethod],
      Comprador: s.buyer || '',
    }));
    exportToCSV(data, `giro-relatorio-${period}-${new Date().toISOString().split('T')[0]}.csv`);
  }

  const maxProfit = Math.max(...categoryStats.map((c) => c.profit), 1);

  const kpis = [
    { label: 'Lucro', value: formatBRL(totalProfit), color: 'text-emerald-400', border: 'border-emerald-500/20' },
    { label: 'Faturamento', value: formatBRL(totalRevenue), color: 'text-white', border: 'border-zinc-800' },
    { label: 'Custo total', value: formatBRL(totalCost), color: 'text-rose-400', border: 'border-rose-500/20' },
    { label: 'Margem média', value: `${avgMargin.toFixed(1)}%`, color: 'text-amber-400', border: 'border-amber-500/20' },
  ];

  return (
    <div className="flex flex-col min-h-full pb-24 md:pb-6">
      <TopBar
        title="Relatórios"
        right={
          <button onClick={handleExport} disabled={filtered.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-xs text-zinc-300 font-medium transition-colors">
            <Download size={14} /> CSV
          </button>
        }
      />

      {/* Period filter */}
      <div className="px-4 md:px-8 pt-3 pb-4">
        <div className="flex gap-2 bg-zinc-900 rounded-2xl p-1 border border-zinc-800 md:max-w-xs">
          {PERIODS.map(({ label, value }) => (
            <button key={value} onClick={() => setPeriod(value)}
              className={cn('flex-1 py-2 rounded-xl text-xs font-semibold transition-all duration-200',
                period === value
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'text-zinc-500 hover:text-zinc-300')}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Summary — 2 cols mobile, 4 cols desktop */}
      <div className="px-4 md:px-8 grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {kpis.map((item, i) => (
          <div key={i} className={cn('rounded-2xl bg-zinc-900 border p-4', item.border)}>
            <p className="text-xs text-zinc-500 mb-1 font-medium">{item.label}</p>
            <p className={cn('text-xl font-bold tabular-nums', item.color)}>{item.value}</p>
            <p className="text-[10px] text-zinc-600 mt-0.5">{filtered.length} vendas</p>
          </div>
        ))}
      </div>

      {/* Desktop: Chart + Category side by side */}
      <div className="px-4 md:px-8 flex flex-col md:flex-row gap-5 mb-5">
        {/* Bar chart */}
        <div className="md:flex-1 rounded-2xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={16} className="text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Lucro por período</h2>
          </div>
          {filtered.length === 0 ? (
            <div className="h-40 flex items-center justify-center">
              <p className="text-sm text-zinc-600">Sem dados para o período</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={barData} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#71717a', fontSize: 10 }}
                  axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis hide />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="profit" name="Lucro" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={entry.profit > 0 ? '#10b981' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category ranking */}
        {categoryStats.length > 0 && (
          <div className="md:w-80 lg:w-96 rounded-2xl bg-zinc-900 border border-zinc-800 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={16} className="text-amber-400" />
              <h2 className="text-sm font-semibold text-white">Categorias mais lucrativas</h2>
            </div>
            <div className="space-y-3">
              {categoryStats.map((cat, i) => (
                <div key={cat.category}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {i === 0 && <span className="text-xs">🥇</span>}
                      {i === 1 && <span className="text-xs">🥈</span>}
                      {i === 2 && <span className="text-xs">🥉</span>}
                      {i >= 3 && <span className="text-xs text-zinc-500 w-4 text-center">{i + 1}</span>}
                      <span className="text-sm text-white">{cat.category}</span>
                      <span className="text-[10px] text-zinc-600">{cat.count} venda{cat.count !== 1 ? 's' : ''}</span>
                    </div>
                    <span className="text-sm font-bold text-emerald-400 tabular-nums">{formatBRL(cat.profit)}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-700"
                      style={{ width: `${(cat.profit / maxProfit) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Giro stats */}
      <div className="px-4 md:px-8 mb-5">
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 md:max-w-sm">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-blue-400" />
            <h2 className="text-sm font-semibold text-white">Tempo de Giro</h2>
          </div>
          {categoryStats.length === 0 ? (
            <p className="text-sm text-zinc-600 text-center py-4">Sem dados suficientes</p>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/50">
                <span className="text-sm text-zinc-300">Média geral</span>
                <span className="text-sm font-bold text-blue-400">{avgGiroDays} dias</span>
              </div>
              {categoryStats.filter(c => c.avgDays > 0).map((cat) => (
                <div key={cat.category} className="flex items-center justify-between px-3 py-2">
                  <span className="text-xs text-zinc-500">{cat.category}</span>
                  <span className="text-xs font-semibold text-zinc-300">{cat.avgDays} dias</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
