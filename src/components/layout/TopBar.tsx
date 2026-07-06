import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TopBarProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  right?: ReactNode;
  className?: string;
}

export function TopBar({ title, subtitle, showBack, right, className }: TopBarProps) {
  const navigate = useNavigate();

  return (
    <header className={cn('sticky top-0 z-40 glass border-b border-zinc-800', className)}>
      <div className="flex items-center gap-3 px-4 md:px-8 py-3">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors shrink-0"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold text-white truncate leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-zinc-500 truncate">{subtitle}</p>}
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
    </header>
  );
}
