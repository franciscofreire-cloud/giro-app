import { useNavigate } from 'react-router-dom';
import { Package, Tag, Calendar } from 'lucide-react';
import { Item } from '@/types';
import { formatBRL, formatDate } from '@/lib/utils';
import { StatusBadge } from './Badge';
import { cn } from '@/lib/utils';

interface ItemCardProps {
  item: Item;
  className?: string;
}

const categoryEmoji: Record<string, string> = {
  'Eletrônicos': '📱',
  'Roupas': '👕',
  'Móveis': '🪑',
  'Acessórios': '⌚',
  'Calçados': '👟',
  'Eletrodomésticos': '🔌',
  'Livros': '📚',
  'Esportes': '⚽',
  'Brinquedos': '🧸',
  'Outros': '📦',
};

export function ItemCard({ item, className }: ItemCardProps) {
  const navigate = useNavigate();
  const emoji = categoryEmoji[item.category] ?? '📦';

  return (
    <div
      onClick={() => navigate(`/estoque/${item.id}`)}
      className={cn(
        'rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden cursor-pointer',
        'hover:border-zinc-700 hover:bg-zinc-800/80 active:scale-[0.98]',
        'transition-all duration-200 animate-fade-in-up stagger-item',
        className
      )}
    >
      {/* Image or placeholder */}
      <div className="relative w-full aspect-[4/3] bg-zinc-800 flex items-center justify-center overflow-hidden">
        {item.photoUrl ? (
          <img
            src={item.photoUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-4xl">{emoji}</span>
        )}
        <div className="absolute top-2 right-2">
          <StatusBadge status={item.status} />
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <h3 className="text-sm font-semibold text-white leading-tight line-clamp-2">{item.name}</h3>

        <div className="flex items-center gap-1 text-xs text-zinc-500">
          <Tag size={11} />
          <span>{item.category}</span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="text-xs text-zinc-500">Compra</p>
            <p className="text-sm font-semibold text-white tabular-nums">{formatBRL(item.purchasePrice)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500">Sugerido</p>
            <p className="text-sm font-semibold text-emerald-400 tabular-nums">{formatBRL(item.suggestedPrice)}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[10px] text-zinc-600 pt-0.5">
          <Calendar size={10} />
          <span>{formatDate(item.purchaseDate)}</span>
        </div>
      </div>
    </div>
  );
}
