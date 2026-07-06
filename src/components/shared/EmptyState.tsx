import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in', className)}>
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mb-4 text-zinc-500">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-zinc-300 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-zinc-500 mb-6 max-w-xs">{description}</p>
      )}
      {action}
    </div>
  );
}
