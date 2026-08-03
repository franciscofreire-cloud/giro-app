import { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { FinancialGoal, GoalCategory } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Target,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  Edit2,
  DollarSign,
  Shield,
  Zap,
  Award,
  HeartHandshake,
  Flame,
  X,
  Sparkles,
} from 'lucide-react';

const GOAL_CATEGORY_CONFIG: Record<GoalCategory, { label: string; icon: any; color: string; bg: string; border: string }> = {
  emergencia: {
    label: 'Segurança & Emergência',
    icon: Shield,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  dividas: {
    label: 'Liberdade de Dívidas',
    icon: Zap,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  trabalho: {
    label: 'Crescimento & Trabalho',
    icon: Award,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  sonhos: {
    label: 'Sonhos & Família',
    icon: HeartHandshake,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
  },
};

export function GoalsManagement() {
  const financialGoals = useStore((s) => s.financialGoals || []);
  const addFinancialGoal = useStore((s) => s.addFinancialGoal);
  const updateFinancialGoal = useStore((s) => s.updateFinancialGoal);
  const addAmountToGoal = useStore((s) => s.addAmountToGoal);
  const deleteFinancialGoal = useStore((s) => s.deleteFinancialGoal);

  // Modals state
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  // Modal Deposit Goal
  const [depositGoal, setDepositGoal] = useState<FinancialGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState('');

  // Modal Edit Goal
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [editGoalTitle, setEditGoalTitle] = useState('');
  const [editGoalTarget, setEditGoalTarget] = useState('');
  const [editGoalCurrent, setEditGoalCurrent] = useState('');
  const [editGoalDate, setEditGoalDate] = useState('');
  const [editGoalCategory, setEditGoalCategory] = useState<GoalCategory>('emergencia');
  const [editGoalMotivation, setEditGoalMotivation] = useState('');

  // Form State: Nova Meta
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTargetAmount, setGoalTargetAmount] = useState('');
  const [goalCurrentAmount, setGoalCurrentAmount] = useState('');
  const [goalTargetDate, setGoalTargetDate] = useState('');
  const [goalCategory, setGoalCategory] = useState<GoalCategory>('emergencia');
  const [goalMotivation, setGoalMotivation] = useState('');

  // Totais
  const totalGoalsTarget = useMemo(() => {
    return financialGoals.reduce((acc: number, g: FinancialGoal) => acc + g.targetAmount, 0);
  }, [financialGoals]);

  const totalGoalsSaved = useMemo(() => {
    return financialGoals.reduce((acc: number, g: FinancialGoal) => acc + g.currentAmount, 0);
  }, [financialGoals]);

  const overallGoalsProgress = totalGoalsTarget > 0 ? (totalGoalsSaved / totalGoalsTarget) * 100 : 0;

  // Handler para Salvar Nova Meta
  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(goalTargetAmount) || 0;
    const current = parseFloat(goalCurrentAmount) || 0;

    if (!goalTitle.trim() || target <= 0) return;

    const newGoal: FinancialGoal = {
      id: 'goal_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: goalTitle.trim(),
      targetAmount: target,
      currentAmount: current,
      targetDate: goalTargetDate || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      category: goalCategory,
      motivation: goalMotivation.trim() || undefined,
      status: current >= target ? 'concluida' : 'em_andamento',
      createdAt: new Date().toISOString(),
    };

    addFinancialGoal(newGoal);
    setIsGoalModalOpen(false);

    setGoalTitle('');
    setGoalTargetAmount('');
    setGoalCurrentAmount('');
    setGoalTargetDate('');
    setGoalMotivation('');
  };

  // Handler para Depositar/Guardar Dinheiro em uma Meta
  const handleDepositGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositGoal) return;
    const val = parseFloat(depositAmount) || 0;
    if (val <= 0) return;

    addAmountToGoal(depositGoal.id, val);
    setDepositGoal(null);
    setDepositAmount('');
  };

  // Handler para Abrir Modal de Edição de Meta
  const openEditGoal = (goal: FinancialGoal) => {
    setEditingGoal(goal);
    setEditGoalTitle(goal.title);
    setEditGoalTarget(String(goal.targetAmount));
    setEditGoalCurrent(String(goal.currentAmount));
    setEditGoalDate(goal.targetDate);
    setEditGoalCategory(goal.category);
    setEditGoalMotivation(goal.motivation || '');
  };

  // Handler para Salvar Alterações na Meta
  const handleSaveGoalEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal) return;

    const target = parseFloat(editGoalTarget) || editingGoal.targetAmount;
    const current = parseFloat(editGoalCurrent) || 0;

    updateFinancialGoal(editingGoal.id, {
      title: editGoalTitle.trim() || editingGoal.title,
      targetAmount: target,
      currentAmount: current,
      targetDate: editGoalDate || editingGoal.targetDate,
      category: editGoalCategory,
      motivation: editGoalMotivation.trim() || undefined,
    });

    setEditingGoal(null);
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-6 pt-3 px-3 sm:px-6 max-w-7xl mx-auto overflow-x-hidden">
      {/* ─── Header Principal ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-teal-950/40 p-4 sm:p-5 rounded-2xl border border-emerald-500/30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
            <Target className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Metas de Recomeço
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/20">
                Virada de Chave 🔑
              </span>
            </h1>
            <p className="text-xs text-zinc-300 mt-0.5">
              "Cada real economizado e cada meta conquistada é um passo firme para você se reerguer e construir a vida que merece."
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsGoalModalOpen(true)}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20 shrink-0 transition-all"
        >
          <Plus size={15} /> Criar Nova Meta
        </button>
      </div>

      {/* ─── Cards de Resumo Geral ────────────────────────────────────────────── */}
      {financialGoals.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 space-y-1">
            <span className="text-zinc-400 text-[10px] uppercase font-semibold block">Total Guardado</span>
            <span className="text-xl font-extrabold text-emerald-400">{formatCurrency(totalGoalsSaved)}</span>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 space-y-1">
            <span className="text-zinc-400 text-[10px] uppercase font-semibold block">Meta Total Planejada</span>
            <span className="text-xl font-extrabold text-white">{formatCurrency(totalGoalsTarget)}</span>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 space-y-1">
            <span className="text-zinc-400 text-[10px] uppercase font-semibold block">Progresso Geral</span>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-zinc-700/50">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, overallGoalsProgress)}%` }}
                />
              </div>
              <span className="font-extrabold text-emerald-400 shrink-0">
                {overallGoalsProgress.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ─── LISTA DE METAS ───────────────────────────────────────────────────── */}
      {financialGoals.length === 0 ? (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-8 text-center space-y-4">
          <Target size={48} className="mx-auto text-emerald-400/60 animate-bounce" />
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-white">Pronto para dar a virada na sua vida?</h3>
            <p className="text-xs text-zinc-400">
              Defina metas claras como Reserva de Emergência, Quitar Dívidas ou Comprar Equipamentos para alavancar seu negócio!
            </p>
          </div>

          {/* Sugestões Rápidas */}
          <div className="pt-2 flex flex-wrap justify-center gap-2">
            <button
              onClick={() => {
                setGoalTitle('Reserva de Recomeço / Emergência');
                setGoalTargetAmount('1000');
                setGoalCurrentAmount('0');
                setGoalCategory('emergencia');
                setGoalMotivation('Garantir minha paz e segurança financeira');
                setIsGoalModalOpen(true);
              }}
              className="px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <Shield size={14} /> Criar Reserva R$ 1.000
            </button>

            <button
              onClick={() => {
                setGoalTitle('Quitar Dívidas Cerasa / Bancos');
                setGoalTargetAmount('3000');
                setGoalCurrentAmount('0');
                setGoalCategory('dividas');
                setGoalMotivation('Limpar meu nome e viver sem cobranças');
                setIsGoalModalOpen(true);
              }}
              className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <Zap size={14} /> Quitar Dívidas
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {financialGoals.map((goal: FinancialGoal) => {
            const config = GOAL_CATEGORY_CONFIG[goal.category] || GOAL_CATEGORY_CONFIG.emergencia;
            const IconComponent = config.icon;
            const pct = Math.min(100, Math.max(0, (goal.currentAmount / goal.targetAmount) * 100));
            const isConcluida = goal.currentAmount >= goal.targetAmount;

            return (
              <div
                key={goal.id}
                className={`bg-zinc-900/90 border rounded-2xl p-4 space-y-3 flex flex-col justify-between transition-all shadow-md ${
                  isConcluida
                    ? 'border-emerald-500/40 bg-emerald-950/20 shadow-emerald-500/10'
                    : 'border-zinc-800 hover:border-emerald-500/30'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${config.bg} ${config.color} border ${config.border}`}>
                      <IconComponent size={12} />
                      {config.label}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditGoal(goal)}
                        className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-all"
                        title="Editar Meta"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => deleteFinancialGoal(goal.id)}
                        className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-all"
                        title="Excluir Meta"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-extrabold text-white tracking-tight">{goal.title}</h3>

                  {goal.motivation && (
                    <p className="text-[11px] text-emerald-300/90 italic bg-zinc-800/60 p-2 rounded-xl border border-zinc-800">
                      "{goal.motivation}"
                    </p>
                  )}
                </div>

                <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                  {/* Barra de Progresso */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-zinc-400 text-[10px] uppercase">Progresso</span>
                      <span className={isConcluida ? 'text-emerald-400 font-bold' : 'text-zinc-200'}>
                        {pct.toFixed(0)}%
                      </span>
                    </div>

                    <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-zinc-700/50">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isConcluida ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Valores */}
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase font-medium">Guardado</span>
                      <span className="text-sm font-extrabold text-emerald-400">
                        {formatCurrency(goal.currentAmount)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-500 block uppercase font-medium">Alvo</span>
                      <span className="text-sm font-bold text-white">
                        {formatCurrency(goal.targetAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Data Alvo & Botão Guardar Dinheiro */}
                  <div className="flex items-center justify-between gap-2 pt-2">
                    <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                      <Calendar size={11} className="text-emerald-400" />
                      Alvo: {formatDate(goal.targetDate)}
                    </span>

                    <button
                      onClick={() => {
                        setDepositGoal(goal);
                        setDepositAmount('');
                      }}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                        isConcluida
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
                      }`}
                    >
                      {isConcluida ? (
                        <>
                          <CheckCircle2 size={13} /> CONCLUÍDA!
                        </>
                      ) : (
                        <>
                          <Plus size={13} /> Guardar +
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── MODAL: NOVA META DE RECOMEÇO ───────────────────────────────────────── */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-4 sm:p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsGoalModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Target className="text-emerald-400" size={20} />
              Nova Meta de Recomeço / Virada de Chave
            </h2>

            <form onSubmit={handleSaveGoal} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Título da Meta</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Reserva de Emergência R$ 1.000, Moto Própria, Curso"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Valor Alvo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="1000.00"
                    value={goalTargetAmount}
                    onChange={(e) => setGoalTargetAmount(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Já Guardado (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={goalCurrentAmount}
                    onChange={(e) => setGoalCurrentAmount(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Categoria</label>
                  <select
                    value={goalCategory}
                    onChange={(e) => setGoalCategory(e.target.value as GoalCategory)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-2 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="emergencia">🛡️ Segurança / Emergência</option>
                    <option value="dividas">🧹 Liberdade de Dívidas</option>
                    <option value="trabalho">🚀 Crescimento / Trabalho</option>
                    <option value="sonhos">🏠 Sonhos & Família</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Data Alvo</label>
                  <input
                    type="date"
                    value={goalTargetDate}
                    onChange={(e) => setGoalTargetDate(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Sua Motivação Pessoal (Por que essa meta importa?)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Dar paz à minha família e mostrar que é possível vencer."
                  value={goalMotivation}
                  onChange={(e) => setGoalMotivation(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGoalModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                >
                  Salvar Meta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: GUARDAR / APORTAR VALOR NA META ───────────────────────────── */}
      {depositGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-4 sm:p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setDepositGoal(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <DollarSign className="text-emerald-400" size={20} />
              Guardar Valor na Meta ({depositGoal.title})
            </h2>

            <form onSubmit={handleDepositGoal} className="space-y-3">
              <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-1">
                <p className="text-xs text-zinc-300">
                  Guardado Atual: <strong className="text-emerald-400">{formatCurrency(depositGoal.currentAmount)}</strong> de {formatCurrency(depositGoal.targetAmount)}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-400 mb-1">
                  Quanto você guardou hoje? (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Ex: 50,00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full bg-zinc-800 border border-emerald-500/50 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDepositGoal(null)}
                  className="px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                >
                  Confirmar Aporte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: EDITAR META ────────────────────────────────────────────────── */}
      {editingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-4 sm:p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditingGoal(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Edit2 className="text-emerald-400" size={18} />
              Editar Meta ({editingGoal.title})
            </h2>

            <form onSubmit={handleSaveGoalEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Título da Meta</label>
                <input
                  type="text"
                  required
                  value={editGoalTitle}
                  onChange={(e) => setEditGoalTitle(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Valor Alvo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editGoalTarget}
                    onChange={(e) => setEditGoalTarget(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Valor Atual Guardado (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editGoalCurrent}
                    onChange={(e) => setEditGoalCurrent(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Categoria</label>
                  <select
                    value={editGoalCategory}
                    onChange={(e) => setEditGoalCategory(e.target.value as GoalCategory)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-2 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="emergencia">🛡️ Segurança / Emergência</option>
                    <option value="dividas">🧹 Liberdade de Dívidas</option>
                    <option value="trabalho">🚀 Crescimento / Trabalho</option>
                    <option value="sonhos">🏠 Sonhos & Família</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Data Alvo</label>
                  <input
                    type="date"
                    value={editGoalDate}
                    onChange={(e) => setEditGoalDate(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Sua Motivação</label>
                <textarea
                  rows={2}
                  value={editGoalMotivation}
                  onChange={(e) => setEditGoalMotivation(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingGoal(null)}
                  className="px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
