import { ItemStatus, ItemCondition } from '@/types';
import { cn } from '@/lib/utils';

// ─── Status Badge ─────────────────────────────────────────────────────────────
interface StatusBadgeProps {
  status: ItemStatus;
  className?: string;
}

const statusConfig: Record<ItemStatus, { label: string; className: string }> = {
  available: {
    label: 'Disponível',
    className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  },
  reserved: {
    label: 'Reservado',
    className: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  sold: {
    label: 'Vendido',
    className: 'bg-zinc-700/60 text-zinc-400 border-zinc-600/30',
  },
  awaiting: {
    label: 'Aguardando entrega',
    className: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border',
        config.className,
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  );
}

// ─── Condition Badge ──────────────────────────────────────────────────────────
interface ConditionBadgeProps {
  condition: ItemCondition;
  className?: string;
}

const conditionConfig: Record<ItemCondition, { label: string; className: string }> = {
  new: {
    label: 'Novo',
    className: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  'like-new': {
    label: 'Seminovo',
    className: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  },
  used: {
    label: 'Usado',
    className: 'bg-zinc-700/60 text-zinc-400 border-zinc-600/30',
  },
};

export function ConditionBadge({ condition, className }: ConditionBadgeProps) {
  const config = conditionConfig[condition];
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}

// ─── Category Badge ───────────────────────────────────────────────────────────
interface CategoryBadgeProps {
  category: string;
  className?: string;
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700',
        className
      )}
    >
      {category}
    </span>
  );
}
