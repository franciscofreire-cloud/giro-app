import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Package } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { ItemCard } from '@/components/shared/ItemCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { TopBar } from '@/components/layout/TopBar';
import { CATEGORIES, ItemStatus } from '@/types';
import { cn } from '@/lib/utils';

const STATUS_FILTERS: { label: string; value: ItemStatus | 'all' }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Disponível', value: 'available' },
  { label: 'Reservado', value: 'reserved' },
  { label: 'Aguardando', value: 'awaiting' },
];

export function Inventory() {
  const navigate = useNavigate();
  const items = useStore((s) => s.items);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ItemStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      // Hide sold items from active inventory
      if (item.status === 'sold') return false;

      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchCategory = categoryFilter === 'all' || item.category === categoryFilter;
      return matchSearch && matchStatus && matchCategory;
    });
  }, [items, search, statusFilter, categoryFilter]);

  const availableCount = items.filter(i => i.status === 'available').length;
  const reservedCount = items.filter(i => i.status === 'reserved').length;
  const awaitingCount = items.filter(i => i.status === 'awaiting').length;

  return (
    <div className="flex flex-col min-h-full pb-24 md:pb-6">
      <TopBar
        title="Estoque"
        subtitle={`${availableCount} disponível · ${reservedCount} reservado · ${awaitingCount} aguardando`}
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'flex items-center justify-center w-8 h-8 rounded-full transition-colors',
                showFilters ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
              )}
            >
              <Filter size={16} />
            </button>
            {/* Desktop add button */}
            <button
              onClick={() => navigate('/estoque/novo')}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold transition-colors"
            >
              <Plus size={14} /> Novo item
            </button>
          </div>
        }
      />

      {/* Search + Filters */}
      <div className="px-4 md:px-8 pt-3 pb-2 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
          />
        </div>

        {showFilters && (
          <div className="space-y-3 animate-fade-in">
            <div>
              <p className="text-xs text-zinc-500 mb-2 font-medium">Status</p>
              <div className="flex gap-2 flex-wrap">
                {STATUS_FILTERS.map((f) => (
                  <button key={f.value} onClick={() => setStatusFilter(f.value)}
                    className={cn('px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                      statusFilter === f.value
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600')}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-2 font-medium">Categoria</p>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => setCategoryFilter('all')}
                  className={cn('px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                    categoryFilter === 'all'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600')}>
                  Todas
                </button>
                {CATEGORIES.map((cat) => (
                  <button key={cat} onClick={() => setCategoryFilter(cat)}
                    className={cn('px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                      categoryFilter === cat
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600')}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <p className="text-xs text-zinc-600">
          {filtered.length} {filtered.length === 1 ? 'item encontrado' : 'itens encontrados'}
        </p>
      </div>

      {/* Grid — 2 cols mobile, 3 cols md, 4 cols lg, 5 cols xl */}
      <div className="px-4 md:px-8 flex-1">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Package size={28} />}
            title="Nenhum item encontrado"
            description="Tente ajustar os filtros ou adicione um novo item ao estoque."
            action={
              <button onClick={() => navigate('/estoque/novo')}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-400 active:scale-95 transition-all">
                Adicionar item
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filtered.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* FAB — mobile only */}
      <button
        onClick={() => navigate('/estoque/novo')}
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 shadow-lg shadow-emerald-500/30 flex items-center justify-center transition-all duration-200 z-40"
      >
        <Plus size={24} className="text-white" />
      </button>
    </div>
  );
}
