import { useState } from 'react';
import { User, Store, Percent, Trash2, ChevronRight, TrendingUp, Package, ShoppingBag, AlertTriangle } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { TopBar } from '@/components/layout/TopBar';
import { formatBRL } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function Profile() {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const resetData = useStore((s) => s.resetData);
  const items = useStore((s) => s.items);
  const sales = useStore((s) => s.sales);

  const [editingMargin, setEditingMargin] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editingUser, setEditingUser] = useState(false);

  const [marginVal, setMarginVal] = useState(String(settings.defaultMargin));
  const [nameVal, setNameVal] = useState(settings.storeName);
  const [userVal, setUserVal] = useState(settings.userName);

  const totalProfit = sales.reduce((acc, s) => acc + s.profit, 0);
  const totalRevenue = sales.reduce((acc, s) => acc + s.salePrice, 0);
  const investedCapital = items
    .filter((i) => i.status === 'available' || i.status === 'reserved')
    .reduce((acc, i) => acc + i.purchasePrice, 0);

  function handleReset() {
    if (confirm('Resetar todos os dados para o estado inicial? Esta ação não pode ser desfeita.')) {
      resetData();
    }
  }

  return (
    <div className="flex flex-col min-h-full pb-24 md:pb-6">
      <TopBar title="Perfil" subtitle="Configurações da loja" />

      <div className="px-4 md:px-0 py-4 md:py-8 space-y-5 md:max-w-2xl md:mx-auto w-full">
        {/* Avatar / header */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-2xl">
            🏪
          </div>
          <div>
            <p className="text-base font-bold text-white">{settings.storeName}</p>
            <p className="text-sm text-zinc-500">{settings.userName}</p>
            <p className="text-xs text-zinc-600 mt-0.5">{items.length} itens · {sales.length} vendas</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Lucro total', value: formatBRL(totalProfit), icon: <TrendingUp size={14} />, color: 'text-emerald-400' },
            { label: 'Faturamento', value: formatBRL(totalRevenue), icon: <ShoppingBag size={14} />, color: 'text-white' },
            { label: 'Em estoque', value: String(items.filter(i => i.status !== 'sold').length), icon: <Package size={14} />, color: 'text-blue-400' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-zinc-900 border border-zinc-800 p-3 text-center">
              <div className={cn('flex justify-center mb-1', stat.color)}>{stat.icon}</div>
              <p className={cn('text-sm font-bold tabular-nums leading-tight', stat.color)}>{stat.value}</p>
              <p className="text-[10px] text-zinc-600 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Settings */}
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden divide-y divide-zinc-800">
          <p className="px-4 pt-3 pb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Configurações</p>

          {/* Store name */}
          <SettingRow
            icon={<Store size={16} className="text-zinc-400" />}
            label="Nome da loja"
            value={settings.storeName}
            editing={editingName}
            onEdit={() => { setEditingName(true); setNameVal(settings.storeName); }}
            onSave={() => { updateSettings({ storeName: nameVal }); setEditingName(false); }}
            onCancel={() => setEditingName(false)}
          >
            <input
              type="text"
              value={nameVal}
              onChange={(e) => setNameVal(e.target.value)}
              autoFocus
              className="w-full bg-zinc-800 border border-emerald-500/50 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
            />
          </SettingRow>

          {/* User name */}
          <SettingRow
            icon={<User size={16} className="text-zinc-400" />}
            label="Seu nome"
            value={settings.userName}
            editing={editingUser}
            onEdit={() => { setEditingUser(true); setUserVal(settings.userName); }}
            onSave={() => { updateSettings({ userName: userVal }); setEditingUser(false); }}
            onCancel={() => setEditingUser(false)}
          >
            <input
              type="text"
              value={userVal}
              onChange={(e) => setUserVal(e.target.value)}
              autoFocus
              className="w-full bg-zinc-800 border border-emerald-500/50 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
            />
          </SettingRow>

          {/* Margin */}
          <SettingRow
            icon={<Percent size={16} className="text-zinc-400" />}
            label="Margem padrão"
            value={`${settings.defaultMargin}%`}
            editing={editingMargin}
            onEdit={() => { setEditingMargin(true); setMarginVal(String(settings.defaultMargin)); }}
            onSave={() => {
              const v = Math.max(1, Math.min(1000, parseFloat(marginVal) || 50));
              updateSettings({ defaultMargin: v });
              setEditingMargin(false);
            }}
            onCancel={() => setEditingMargin(false)}
          >
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={marginVal}
                onChange={(e) => setMarginVal(e.target.value)}
                autoFocus
                min="1"
                max="1000"
                className="w-24 bg-zinc-800 border border-emerald-500/50 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
              />
              <span className="text-sm text-zinc-400">%</span>
            </div>
          </SettingRow>
        </div>

        {/* Danger zone */}
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 overflow-hidden">
          <div className="flex items-center gap-2 px-4 pt-3 pb-2">
            <AlertTriangle size={14} className="text-rose-400" />
            <p className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Zona de perigo</p>
          </div>
          <button
            onClick={handleReset}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-rose-500/10 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <Trash2 size={16} className="text-rose-400" />
              <div>
                <p className="text-sm font-medium text-rose-400">Resetar dados</p>
                <p className="text-xs text-zinc-600">Restaura os dados de demonstração</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-rose-400/50" />
          </button>
        </div>

        {/* Version */}
        <p className="text-center text-xs text-zinc-700">Giro App v1.0.0 · Dados salvos localmente</p>
      </div>
    </div>
  );
}

function SettingRow({
  icon, label, value, editing, onEdit, onSave, onCancel, children,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  editing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="px-4 py-3">
      {!editing ? (
        <button onClick={onEdit} className="w-full flex items-center gap-3 group">
          <div className="text-zinc-500">{icon}</div>
          <div className="flex-1 text-left">
            <p className="text-xs text-zinc-500">{label}</p>
            <p className="text-sm font-medium text-white">{value}</p>
          </div>
          <ChevronRight size={16} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-zinc-500 font-medium">{label}</p>
          {children}
          <div className="flex gap-2">
            <button
              onClick={onSave}
              className="flex-1 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-400 transition-colors"
            >
              Salvar
            </button>
            <button
              onClick={onCancel}
              className="flex-1 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 text-xs font-medium hover:bg-zinc-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
