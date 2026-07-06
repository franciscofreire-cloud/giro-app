import { useStore } from '@/store/useStore';
import { MonthlyProfit, CategoryStat } from '@/types';
import { MONTH_SHORT } from '@/lib/utils';

export function useDashboard() {
  const items = useStore((s) => s.items);
  const sales = useStore((s) => s.sales);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // ─── KPIs ─────────────────────────────────────────────────────────────────
  const investedCapital = items
    .filter((i) => i.status === 'available' || i.status === 'reserved')
    .reduce((acc, i) => acc + i.purchasePrice, 0);

  const stockCount = items.filter(
    (i) => i.status === 'available' || i.status === 'reserved' || i.status === 'awaiting'
  ).length;

  const monthlySales = sales.filter((s) => {
    const d = new Date(s.saleDate);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const monthlyRevenue = monthlySales.reduce((acc, s) => acc + s.salePrice, 0);
  const monthlyProfit = monthlySales.reduce((acc, s) => acc + s.profit, 0);

  // ─── Last 5 sales ─────────────────────────────────────────────────────────
  const recentSales = [...sales]
    .sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime())
    .slice(0, 5);

  // ─── Monthly profit chart (last 6 months) ─────────────────────────────────
  const monthlyProfitChart: MonthlyProfit[] = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(currentYear, currentMonth - (5 - i), 1);
    const m = d.getMonth();
    const y = d.getFullYear();
    const filtered = sales.filter((s) => {
      const sd = new Date(s.saleDate);
      return sd.getMonth() === m && sd.getFullYear() === y;
    });
    return {
      month: MONTH_SHORT[m],
      profit: filtered.reduce((acc, s) => acc + s.profit, 0),
      revenue: filtered.reduce((acc, s) => acc + s.salePrice, 0),
    };
  });

  return {
    investedCapital,
    stockCount,
    monthlyRevenue,
    monthlyProfit,
    recentSales,
    monthlyProfitChart,
  };
}

export function useReports(period: 'day' | 'week' | 'month' | 'year' = 'month') {
  const items = useStore((s) => s.items);
  const sales = useStore((s) => s.sales);

  const now = new Date();

  function inPeriod(dateStr: string): boolean {
    const d = new Date(dateStr);
    if (period === 'day') {
      return d.toDateString() === now.toDateString();
    }
    if (period === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return d >= weekAgo;
    }
    if (period === 'month') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    // year
    return d.getFullYear() === now.getFullYear();
  }

  const filtered = sales.filter((s) => inPeriod(s.saleDate));

  const totalRevenue = filtered.reduce((acc, s) => acc + s.salePrice, 0);
  const totalProfit = filtered.reduce((acc, s) => acc + s.profit, 0);
  const totalCost = filtered.reduce((acc, s) => acc + s.purchasePrice, 0);
  const avgMargin =
    filtered.length > 0
      ? filtered.reduce((acc, s) => acc + s.marginPercent, 0) / filtered.length
      : 0;

  // Category stats
  const catMap = new Map<string, { profit: number; count: number; totalDays: number }>();
  filtered.forEach((s) => {
    const item = items.find((i) => i.id === s.itemId);
    const days = item ? Math.abs(
      (new Date(s.saleDate).getTime() - new Date(item.purchaseDate).getTime()) / 86400000
    ) : 0;
    const cur = catMap.get(s.itemCategory) ?? { profit: 0, count: 0, totalDays: 0 };
    catMap.set(s.itemCategory, {
      profit: cur.profit + s.profit,
      count: cur.count + 1,
      totalDays: cur.totalDays + days,
    });
  });

  const categoryStats: CategoryStat[] = Array.from(catMap.entries())
    .map(([category, { profit, count, totalDays }]) => ({
      category,
      profit,
      count,
      avgDays: count > 0 ? Math.round(totalDays / count) : 0,
    }))
    .sort((a, b) => b.profit - a.profit);

  // Overall avg giro
  const allSoldItems = sales.map((s) => {
    const item = items.find((i) => i.id === s.itemId);
    if (!item) return null;
    return Math.abs(
      (new Date(s.saleDate).getTime() - new Date(item.purchaseDate).getTime()) / 86400000
    );
  }).filter((d): d is number => d !== null);

  const avgGiroDays =
    allSoldItems.length > 0
      ? Math.round(allSoldItems.reduce((a, b) => a + b, 0) / allSoldItems.length)
      : 0;

  // Bar chart data (last 12 months for year, 4 weeks for week, etc.)
  let barData: { label: string; profit: number; revenue: number }[] = [];
  if (period === 'year') {
    const m = now.getMonth();
    const y = now.getFullYear();
    barData = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(y, m - (11 - i), 1);
      const mo = d.getMonth();
      const yr = d.getFullYear();
      const f = sales.filter((s) => {
        const sd = new Date(s.saleDate);
        return sd.getMonth() === mo && sd.getFullYear() === yr;
      });
      return {
        label: MONTH_SHORT[mo],
        profit: f.reduce((acc, s) => acc + s.profit, 0),
        revenue: f.reduce((acc, s) => acc + s.salePrice, 0),
      };
    });
  } else if (period === 'month') {
    // Days of current month
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    barData = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const f = sales.filter((s) => {
        const sd = new Date(s.saleDate);
        return (
          sd.getDate() === day &&
          sd.getMonth() === now.getMonth() &&
          sd.getFullYear() === now.getFullYear()
        );
      });
      return {
        label: String(day),
        profit: f.reduce((acc, s) => acc + s.profit, 0),
        revenue: f.reduce((acc, s) => acc + s.salePrice, 0),
      };
    }).filter((d) => d.profit > 0 || d.revenue > 0);
    if (barData.length === 0) {
      barData = [{ label: 'Sem dados', profit: 0, revenue: 0 }];
    }
  } else if (period === 'week') {
    barData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      const f = sales.filter((s) => new Date(s.saleDate).toDateString() === d.toDateString());
      return {
        label: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
        profit: f.reduce((acc, s) => acc + s.profit, 0),
        revenue: f.reduce((acc, s) => acc + s.salePrice, 0),
      };
    });
  } else {
    // day — hourly not practical with current data, just show today's sales
    barData = filtered.map((s) => ({
      label: s.itemName.split(' ').slice(0, 2).join(' '),
      profit: s.profit,
      revenue: s.salePrice,
    }));
    if (barData.length === 0) barData = [{ label: 'Sem vendas hoje', profit: 0, revenue: 0 }];
  }

  return {
    filtered,
    totalRevenue,
    totalProfit,
    totalCost,
    avgMargin,
    categoryStats,
    avgGiroDays,
    barData,
  };
}
