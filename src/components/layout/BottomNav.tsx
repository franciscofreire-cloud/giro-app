import { NavLink, useLocation } from 'react-router-dom';
import { Home, Package, ShoppingBag, BarChart2, CreditCard, User, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';

const tabs = [
  { to: '/', label: 'Início', icon: Home },
  { to: '/estoque', label: 'Estoque', icon: Package },
  { to: '/vendas', label: 'Vendas', icon: ShoppingBag },
  { to: '/parcelados', label: 'Parcelados', icon: CreditCard },
  { to: '/relatorios', label: 'Relatórios', icon: BarChart2 },
  { to: '/perfil', label: 'Perfil', icon: User },
];


// ─── Sidebar (Desktop) ────────────────────────────────────────────────────────
export function SideNav() {
  const location = useLocation();
  const settings = useStore((s) => s.settings);

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-60 bg-zinc-900 border-r border-zinc-800 z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-zinc-800">
        <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
          <Zap size={18} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-tight">Giro App</p>
          <p className="text-[10px] text-zinc-500 truncate max-w-[110px]">{settings.storeName}</p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {tabs.map(({ to, label, icon: Icon }) => {
          const active =
            to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              )}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 2} />
              {label}
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-zinc-800">
        <p className="text-[10px] text-zinc-600">Giro App v1.0.0</p>
        <p className="text-[10px] text-zinc-700">Dados salvos localmente</p>
      </div>
    </aside>
  );
}

// ─── Bottom Nav (Mobile) ──────────────────────────────────────────────────────
export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-zinc-800 bottom-nav-safe">
      <div className="flex items-stretch justify-around">
        {tabs.map(({ to, label, icon: Icon }) => {
          const active =
            to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-2 py-3 flex-1 transition-all duration-200',
                active ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              <div className={cn(
                'relative flex items-center justify-center w-6 h-6 transition-transform duration-200',
                active && 'scale-110'
              )}>
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                {active && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400" />
                )}
              </div>
              <span className={cn('text-[10px] font-medium tracking-wide', active ? 'text-emerald-400' : 'text-zinc-500')}>
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
