import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon?: ReactNode;
  variant?: 'default' | 'profit' | 'loss' | 'amber' | 'blue';
  className?: string;
  delay?: number;
}

const variantStyles = {
  default: {
    border: 'border-zinc-800',
    icon: 'bg-zinc-800 text-zinc-400',
    value: 'text-white',
    glow: '',
  },
  profit: {
    border: 'border-emerald-500/20',
    icon: 'bg-emerald-500/15 text-emerald-400',
    value: 'text-emerald-400',
    glow: 'shadow-[0_0_20px_rgba(16,185,129,0.08)]',
  },
  loss: {
    border: 'border-rose-500/20',
    icon: 'bg-rose-500/15 text-rose-400',
    value: 'text-rose-400',
    glow: 'shadow-[0_0_20px_rgba(244,63,94,0.08)]',
  },
  amber: {
    border: 'border-amber-500/20',
    icon: 'bg-amber-500/15 text-amber-400',
    value: 'text-amber-400',
    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.08)]',
  },
  blue: {
    border: 'border-blue-500/20',
    icon: 'bg-blue-500/15 text-blue-400',
    value: 'text-blue-400',
    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.08)]',
  },
};

export function StatCard({
  label,
  value,
  sub,
  icon,
  variant = 'default',
  className,
  delay = 0,
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        'relative rounded-2xl bg-zinc-900/90 border p-3.5 sm:p-5 flex flex-col justify-between gap-2.5 transition-all min-w-0',
        styles.border,
        styles.glow,
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-wider truncate">
          {label}
        </span>
        {icon && (
          <div className={cn('w-7 h-7 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0', styles.icon)}>
            {icon}
          </div>
        )}
      </div>

      <div className="min-w-0">
        <p className={cn('text-lg sm:text-2xl font-extrabold leading-tight tabular-nums truncate', styles.value)}>
          {value}
        </p>
        {sub && <p className="text-[10px] sm:text-xs text-zinc-500 mt-1 truncate">{sub}</p>}
      </div>
    </div>
  );
}
