import { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import {
  FinancialTransaction,
  FinancialDebt,
  FinancialGoal,
  GoalCategory,
  FinancialCategory,
  FINANCIAL_CATEGORY_LABELS,
  TransactionType,
} from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Scale,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Briefcase,
  Sparkles,
  CreditCard,
  Building2,
  X,
  AlertTriangle,
  Repeat,
  Edit2,
  DollarSign,
  History,
  Target,
  Shield,
  Zap,
  Award,
  HeartHandshake,
  Flame,
} from 'lucide-react';

// Helper para calcular status automático (PENDENTE x VENCIDA x PAGA) por Data de Vencimento Completa
function getBillStatus(tx: FinancialTransaction): 'paga' | 'pendente' | 'vencida' {
  if (tx.status === 'paga' || tx.paid === true) return 'paga';
  if (tx.status === 'vencida' || tx.status === 'atrasada') return 'vencida';

  const todayStr = new Date().toISOString().split('T')[0];
  const billDueDate = tx.date;

  if (billDueDate && billDueDate < todayStr) {
    return 'vencida';
  }
  return 'pendente';
}

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

export function FinancialManagement() {
  const financialTransactions = useStore((s) => s.financialTransactions);
  const financialDebts = useStore((s) => s.financialDebts);
  const financialGoals = useStore((s) => s.financialGoals || []);

  const addFinancialTransaction = useStore((s) => s.addFinancialTransaction);
  const deleteFinancialTransaction = useStore((s) => s.deleteFinancialTransaction);
  const clearAllTransactions = useStore((s) => s.clearAllTransactions);
  const updateTransactionStatus = useStore((s) => s.updateTransactionStatus);

  const addFinancialDebt = useStore((s) => s.addFinancialDebt);
  const updateFinancialDebt = useStore((s) => s.updateFinancialDebt);
  const deleteFinancialDebt = useStore((s) => s.deleteFinancialDebt);
  const clearAllDebts = useStore((s) => s.clearAllDebts);

  const addFinancialGoal = useStore((s) => s.addFinancialGoal);
  const updateFinancialGoal = useStore((s) => s.updateFinancialGoal);
  const addAmountToGoal = useStore((s) => s.addAmountToGoal);
  const deleteFinancialGoal = useStore((s) => s.deleteFinancialGoal);

  // Active Tab: 'overview' | 'incomes' | 'daily_expenses' | 'recurring_bills' | 'debts' | 'goals'
  const [activeTab, setActiveTab] = useState<'overview' | 'incomes' | 'daily_expenses' | 'recurring_bills' | 'debts' | 'goals'>('overview');

  // Modals state
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
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

  // Edit/Amortize Debt Modal
  const [editingDebt, setEditingDebt] = useState<FinancialDebt | null>(null);
  const [editCreditor, setEditCreditor] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editRemainingAmount, setEditRemainingAmount] = useState('');
  const [amortizeAmount, setAmortizeAmount] = useState('');

  // Histórico de Contas Pagas aberto/fechado
  const [isPaidHistoryOpen, setIsPaidHistoryOpen] = useState(true);

  // Filter Month (YYYY-MM)
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);

  // Form State: Transaction
  const [txType, setTxType] = useState<TransactionType>('income');
  const [txTitle, setTxTitle] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState<FinancialCategory | string>('salario');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txDueDate, setTxDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [txStatus, setTxStatus] = useState<'paga' | 'pendente' | 'vencida'>('pendente');
  const [txNotes, setTxNotes] = useState('');

  // Form State: Dívida
  const [debtCreditor, setDebtCreditor] = useState('');
  const [debtTitle, setDebtTitle] = useState('');
  const [debtTotalAmount, setDebtTotalAmount] = useState('');

  // Form State: Nova Meta
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTargetAmount, setGoalTargetAmount] = useState('');
  const [goalCurrentAmount, setGoalCurrentAmount] = useState('');
  const [goalTargetDate, setGoalTargetDate] = useState('');
  const [goalCategory, setGoalCategory] = useState<GoalCategory>('emergencia');
  const [goalMotivation, setGoalMotivation] = useState('');

  // Movimentações estritamente filtradas pelo Mês Selecionado
  const monthTransactions = useMemo(() => {
    return financialTransactions.filter((tx) => tx.date.startsWith(selectedMonth));
  }, [financialTransactions, selectedMonth]);

  // 1. Receitas do Mês
  const monthIncomes = useMemo(() => {
    return monthTransactions.filter((tx) => tx.type === 'income');
  }, [monthTransactions]);

  const totalIncome = useMemo(() => {
    return monthIncomes.reduce((acc, tx) => acc + tx.amount, 0);
  }, [monthIncomes]);

  // 2. Gastos Diários do Mês
  const monthDailyExpenses = useMemo(() => {
    return monthTransactions.filter((tx) => tx.type === 'expense');
  }, [monthTransactions]);

  const totalDailyExpenses = useMemo(() => {
    return monthDailyExpenses.reduce((acc, tx) => acc + tx.amount, 0);
  }, [monthDailyExpenses]);

  // 3. CONTAS: TODAS AS CONTAS CADASTRADAS
  const allBills = useMemo(() => {
    return financialTransactions.filter((tx) => tx.type === 'recurring_bill');
  }, [financialTransactions]);

  const openBills = useMemo(() => {
    return allBills.filter((tx) => getBillStatus(tx) !== 'paga');
  }, [allBills]);

  const paidBills = useMemo(() => {
    return allBills.filter((tx) => getBillStatus(tx) === 'paga');
  }, [allBills]);

  const totalRecurringBills = useMemo(() => {
    return openBills.reduce((acc, tx) => acc + tx.amount, 0);
  }, [openBills]);

  const totalExpensesAll = totalDailyExpenses + totalRecurringBills;
  const netBalance = totalIncome - totalExpensesAll;

  // 4. Dívidas & Empréstimos
  const totalRemainingDebt = useMemo(() => {
    return financialDebts.reduce((acc, debt) => {
      const rem = debt.remainingAmount !== undefined ? debt.remainingAmount : debt.totalAmount;
      return acc + (rem > 0 ? rem : 0);
    }, 0);
  }, [financialDebts]);

  // 5. Metas Financeiras (Totais)
  const totalGoalsTarget = useMemo(() => {
    return financialGoals.reduce((acc: number, g: FinancialGoal) => acc + g.targetAmount, 0);
  }, [financialGoals]);

  const totalGoalsSaved = useMemo(() => {
    return financialGoals.reduce((acc: number, g: FinancialGoal) => acc + g.currentAmount, 0);
  }, [financialGoals]);

  const overallGoalsProgress = totalGoalsTarget > 0 ? (totalGoalsSaved / totalGoalsTarget) * 100 : 0;

  // Handler para Salvar Lançamento
  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txTitle.trim() || !txAmount || parseFloat(txAmount) <= 0) return;

    const isRec = txType === 'recurring_bill';

    const finalDate = isRec
      ? txDueDate
      : txDate.startsWith(selectedMonth)
      ? txDate
      : `${selectedMonth}-${txDate.split('-')[2] || '01'}`;

    const dueDayNum = parseInt(finalDate.split('-')[2]) || 15;
    const isPaid = txType === 'income' || txStatus === 'paga';

    const newTx: FinancialTransaction = {
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: txTitle.trim(),
      amount: parseFloat(txAmount),
      type: txType,
      category: txCategory,
      date: finalDate,
      dueDay: dueDayNum,
      isRecurring: false,
      status: txType === 'recurring_bill' ? txStatus : isPaid ? 'paga' : 'pendente',
      paid: isPaid,
      notes: txNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    addFinancialTransaction(newTx);
    setIsTransactionModalOpen(false);

    setTxTitle('');
    setTxAmount('');
    setTxNotes('');
  };

  // Handler para Salvar Nova Dívida
  const handleSaveDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const total = parseFloat(debtTotalAmount) || 0;

    if (!debtCreditor.trim() || !debtTitle.trim() || total <= 0) return;

    const newDebt: FinancialDebt = {
      id: 'debt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: debtTitle.trim(),
      creditor: debtCreditor.trim(),
      totalAmount: total,
      remainingAmount: total,
      createdAt: new Date().toISOString(),
    };

    addFinancialDebt(newDebt);
    setIsDebtModalOpen(false);
    setActiveTab('debts');

    setDebtCreditor('');
    setDebtTitle('');
    setDebtTotalAmount('');
  };

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
    setActiveTab('goals');

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

  // Handler para Abrir Modal de Edição de Dívida
  const openEditDebt = (debt: FinancialDebt) => {
    setEditingDebt(debt);
    setEditCreditor(debt.creditor);
    setEditTitle(debt.title);
    setEditRemainingAmount(String(debt.remainingAmount !== undefined ? debt.remainingAmount : debt.totalAmount));
    setAmortizeAmount('');
  };

  // Handler para Salvar Alterações na Dívida
  const handleSaveDebtEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDebt) return;

    let newRemaining = parseFloat(editRemainingAmount) || 0;
    const amortVal = parseFloat(amortizeAmount) || 0;

    if (amortVal > 0) {
      newRemaining = Math.max(0, newRemaining - amortVal);
    }

    updateFinancialDebt(editingDebt.id, {
      creditor: editCreditor.trim() || editingDebt.creditor,
      title: editTitle.trim() || editingDebt.title,
      remainingAmount: newRemaining,
    });

    setEditingDebt(null);
  };

  const openNewTransaction = (type: TransactionType) => {
    setTxType(type);
    if (type === 'income') {
      setTxCategory('salario');
    } else if (type === 'recurring_bill') {
      setTxCategory('moradia');
      setTxStatus('pendente');
      setTxDueDate(new Date().toISOString().split('T')[0]);
    } else {
      setTxCategory('alimentacao');
    }
    setIsTransactionModalOpen(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-6 pt-3 px-3 sm:px-6 max-w-7xl mx-auto overflow-x-hidden">
      {/* ─── Header & Seletor de Mês ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/90 p-4 sm:p-5 rounded-2xl border border-zinc-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
            <Wallet className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Gestão Financeira
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/20">
                Pessoal
              </span>
            </h1>
          </div>
        </div>

        {/* Filter Month & Botão Limpar Lançamentos */}
        <div className="flex items-center justify-between sm:justify-start gap-2">
          {financialTransactions.length > 0 && (
            <button
              onClick={() => clearAllTransactions()}
              className="flex items-center gap-1 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-semibold transition-all"
              title="Limpar todos os dados das abas"
            >
              <Trash2 size={13} /> Limpar Dados
            </button>
          )}

          <div className="flex items-center gap-1.5 bg-zinc-800/90 px-3 py-2 rounded-xl border border-zinc-700">
            <span className="flex items-center gap-1.5 text-xs text-zinc-400">
              <Calendar size={14} className="text-emerald-400" />
              Mês:
            </span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* ─── Cards de Resumo (KPIs) ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Receitas */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3.5 sm:p-4 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-zinc-400">Receitas</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ArrowUpRight size={16} />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-extrabold text-white mt-1.5 truncate">
            {formatCurrency(totalIncome)}
          </p>
          <p className="text-[10px] text-zinc-500 mt-1 truncate">Salário + Bicos ({monthIncomes.length})</p>
        </div>

        {/* Gastos Diários */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3.5 sm:p-4 relative overflow-hidden group hover:border-rose-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-zinc-400">Gastos Diários</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <ArrowDownRight size={16} />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-extrabold text-white mt-1.5 truncate">
            {formatCurrency(totalDailyExpenses)}
          </p>
          <p className="text-[10px] text-zinc-500 mt-1 truncate">Gasolina, Almoço ({monthDailyExpenses.length})</p>
        </div>

        {/* Contas */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3.5 sm:p-4 relative overflow-hidden group hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-zinc-400">Contas</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Repeat size={16} />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-extrabold text-white mt-1.5 truncate">
            {formatCurrency(totalRecurringBills)}
          </p>
          <p className="text-[10px] text-zinc-500 mt-1 truncate">
            {openBills.length} pendente(s) • {paidBills.length} paga(s)
          </p>
        </div>

        {/* Saldo Devedor Dívidas */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3.5 sm:p-4 relative overflow-hidden group hover:border-purple-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-zinc-400">Dívidas / Consignado</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <CreditCard size={16} />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-extrabold text-white mt-1.5 truncate">
            {formatCurrency(totalRemainingDebt)}
          </p>
          <p className="text-[10px] text-zinc-500 mt-1 truncate">{financialDebts.length} Dívida(s)</p>
        </div>
      </div>

      {/* ─── NAVEGAÇÃO DAS 6 ABAS (COM A NOVA ABA METAS DE RECOMEÇO) ──────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-zinc-800 scrollbar-none">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          }`}
        >
          <Sparkles size={14} />
          VISÃO GERAL
        </button>

        <button
          onClick={() => setActiveTab('incomes')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'incomes'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          }`}
        >
          <TrendingUp size={14} />
          RECEITAS ({monthIncomes.length})
        </button>

        <button
          onClick={() => setActiveTab('daily_expenses')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'daily_expenses'
              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          }`}
        >
          <TrendingDown size={14} />
          GASTOS DIÁRIOS ({monthDailyExpenses.length})
        </button>

        <button
          onClick={() => setActiveTab('recurring_bills')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'recurring_bills'
              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          }`}
        >
          <Repeat size={14} />
          CONTAS ({openBills.length})
        </button>

        <button
          onClick={() => setActiveTab('debts')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'debts'
              ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          }`}
        >
          <CreditCard size={14} />
          DÍVIDAS / EMPRÉSTIMOS ({financialDebts.length})
        </button>

        {/* NOVA ABA: METAS */}
        <button
          onClick={() => setActiveTab('goals')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shadow-sm ${
            activeTab === 'goals'
              ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/40 shadow-emerald-500/10'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          }`}
        >
          <Target size={15} className="text-emerald-400" />
          🎯 METAS ({financialGoals.length})
        </button>
      </div>

      {/* ─── CONTEÚDO DE CADA ABA ─────────────────────────────────────────────── */}

      {/* ABA 1: VISÃO GERAL */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-3">
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <Calendar size={15} className="text-emerald-400" />
                  Extrato do Mês ({selectedMonth})
                </h2>
                <span className="text-[11px] text-zinc-500">
                  {monthTransactions.length} registro(s)
                </span>
              </div>

              {monthTransactions.length === 0 ? (
                <div className="text-center py-8 sm:py-12 border border-dashed border-zinc-800 rounded-xl px-4">
                  <PiggyBank size={36} className="mx-auto text-zinc-600 mb-2" />
                  <p className="text-xs sm:text-sm font-medium text-zinc-400">
                    Nenhum lançamento registrado neste mês.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {monthTransactions.map((tx) => {
                    const st = tx.type === 'recurring_bill' ? getBillStatus(tx) : tx.paid ? 'paga' : 'pendente';
                    return (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/40 hover:bg-zinc-800/70 border border-zinc-800/60 transition-all gap-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              tx.type === 'income'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : tx.type === 'recurring_bill'
                                ? st === 'paga'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : st === 'vencida'
                                  ? 'bg-rose-500/10 text-rose-400'
                                  : 'bg-amber-500/10 text-amber-400'
                                : 'bg-rose-500/10 text-rose-400'
                            }`}
                          >
                            {tx.type === 'income' ? (
                              <ArrowUpRight size={16} />
                            ) : tx.type === 'recurring_bill' ? (
                              <Repeat size={16} />
                            ) : (
                              <ArrowDownRight size={16} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-semibold text-white truncate">{tx.title}</p>
                            <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-zinc-500 mt-0.5">
                              <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-medium">
                                {FINANCIAL_CATEGORY_LABELS[tx.category] || tx.category}
                              </span>
                              <span>• {formatDate(tx.date)}</span>
                              {tx.type === 'recurring_bill' && (
                                <span
                                  className={`px-1.5 py-0.5 rounded font-bold uppercase ${
                                    st === 'paga'
                                      ? 'bg-emerald-500/20 text-emerald-400'
                                      : st === 'vencida'
                                      ? 'bg-rose-500/20 text-rose-400 animate-pulse'
                                      : 'bg-amber-500/20 text-amber-400'
                                  }`}
                                >
                                  {st}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-xs sm:text-sm font-bold ${
                              tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
                          </span>
                          <button
                            onClick={() => deleteFinancialTransaction(tx.id)}
                            className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-all"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 sm:p-5">
              <h2 className="text-xs sm:text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Scale size={15} className="text-emerald-400" />
                Resumo do Mês
              </h2>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-zinc-800">
                  <span className="text-zinc-400">Total Receitas:</span>
                  <span className="font-bold text-emerald-400">{formatCurrency(totalIncome)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-zinc-800">
                  <span className="text-zinc-400">Gastos Diários:</span>
                  <span className="font-bold text-rose-400">{formatCurrency(totalDailyExpenses)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-zinc-800">
                  <span className="text-zinc-400">Contas:</span>
                  <span className="font-bold text-amber-400">{formatCurrency(totalRecurringBills)}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="font-bold text-zinc-200">Saldo Livre (Sobra):</span>
                  <span className={`font-extrabold ${netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatCurrency(netBalance)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: RECEITAS */}
      {activeTab === 'incomes' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">Minhas Receitas ({selectedMonth})</h2>
            </div>
            <button
              onClick={() => openNewTransaction('income')}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-500/20"
            >
              <Plus size={14} /> Nova Receita
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {monthIncomes.map((tx) => (
              <div
                key={tx.id}
                className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-md hover:border-emerald-500/30 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0 border border-emerald-500/20">
                    <Briefcase size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm sm:text-base font-bold text-white tracking-tight truncate">{tx.title}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {FINANCIAL_CATEGORY_LABELS[tx.category] || tx.category} • {formatDate(tx.date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-lg sm:text-xl font-extrabold text-emerald-400 tabular-nums">
                    +{formatCurrency(tx.amount)}
                  </span>
                  <button
                    onClick={() => deleteFinancialTransaction(tx.id)}
                    className="text-zinc-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            {monthIncomes.length === 0 && (
              <div className="col-span-full py-8 text-center text-zinc-500 text-xs bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                Nenhuma receita cadastrada neste mês ({selectedMonth}). Clique em "+ Nova Receita" para registrar.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ABA 3: GASTOS DIÁRIOS */}
      {activeTab === 'daily_expenses' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">Gastos Diários ({selectedMonth})</h2>
            </div>
            <button
              onClick={() => openNewTransaction('expense')}
              className="flex items-center gap-1 px-3 py-1.5 bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-rose-500/20"
            >
              <Plus size={14} /> Novo Gasto Diário
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {monthDailyExpenses.map((tx) => (
              <div
                key={tx.id}
                className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-md hover:border-rose-500/30 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 shrink-0 border border-rose-500/20">
                    <ArrowDownRight size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm sm:text-base font-bold text-white tracking-tight truncate">{tx.title}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {FINANCIAL_CATEGORY_LABELS[tx.category] || tx.category} • {formatDate(tx.date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-lg sm:text-xl font-extrabold text-rose-400 tabular-nums">
                    -{formatCurrency(tx.amount)}
                  </span>
                  <button
                    onClick={() => deleteFinancialTransaction(tx.id)}
                    className="text-zinc-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            {monthDailyExpenses.length === 0 && (
              <div className="col-span-full py-8 text-center text-zinc-500 text-xs bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                Nenhum gasto diário registrado neste mês ({selectedMonth}).
              </div>
            )}
          </div>
        </div>
      )}

      {/* ABA 4: CONTAS */}
      {activeTab === 'recurring_bills' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">Minhas Contas a Pagar</h2>
            </div>
            <button
              onClick={() => openNewTransaction('recurring_bill')}
              className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-amber-500/20"
            >
              <Plus size={14} /> Nova Conta
            </button>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Contas Abertas ({openBills.length})
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {openBills.map((tx) => {
                const currentStatus = getBillStatus(tx);
                return (
                  <div
                    key={tx.id}
                    className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all shadow-md ${
                      currentStatus === 'vencida'
                        ? 'bg-rose-950/30 border-rose-500/50 hover:border-rose-500/70'
                        : 'bg-zinc-900/90 border-amber-500/30 hover:border-amber-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${
                          currentStatus === 'vencida'
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {currentStatus === 'vencida' ? (
                          <AlertTriangle size={20} />
                        ) : (
                          <Repeat size={20} />
                        )}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <h4 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                          {tx.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-zinc-800/90 text-zinc-300 px-2.5 py-0.5 rounded-lg border border-zinc-700">
                            <Calendar size={12} className={currentStatus === 'vencida' ? 'text-rose-400' : 'text-amber-400'} />
                            Vence em: {formatDate(tx.date)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/80">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Valor</span>
                        <span className={`text-lg sm:text-2xl font-extrabold tracking-tight tabular-nums ${
                          currentStatus === 'vencida' ? 'text-rose-400' : 'text-amber-400'
                        }`}>
                          {formatCurrency(tx.amount)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={currentStatus}
                          onChange={(e) =>
                            updateTransactionStatus(
                              tx.id,
                              e.target.value as 'paga' | 'pendente' | 'vencida'
                            )
                          }
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border focus:outline-none cursor-pointer transition-all shadow-sm ${
                            currentStatus === 'vencida'
                              ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                              : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          <option value="pendente" className="bg-zinc-900 text-amber-400 font-bold">
                            ⏳ PENDENTE
                          </option>
                          <option value="paga" className="bg-zinc-900 text-emerald-400 font-bold">
                            ✅ MARCAR PAGA
                          </option>
                          <option value="vencida" className="bg-zinc-900 text-rose-400 font-bold">
                            🚨 VENCIDA
                          </option>
                        </select>

                        <button
                          onClick={() => deleteFinancialTransaction(tx.id)}
                          className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {openBills.length === 0 && (
                <div className="col-span-full py-8 text-center text-zinc-500 text-xs bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                  {paidBills.length > 0
                    ? '🎉 Todas as suas contas cadastradas já foram pagas! Confira o histórico abaixo.'
                    : 'Nenhuma conta pendente ou vencida cadastrada. Clique em "+ Nova Conta" para adicionar.'}
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-800 space-y-2">
            <button
              onClick={() => setIsPaidHistoryOpen(!isPaidHistoryOpen)}
              className="flex items-center justify-between w-full p-2.5 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-300 transition-all"
            >
              <span className="flex items-center gap-2">
                <History size={15} className="text-emerald-400" />
                Histórico de Contas Pagas ({paidBills.length})
              </span>
              <span className="text-[11px] text-emerald-400 font-semibold">
                {isPaidHistoryOpen ? 'Ocultar ▲' : 'Mostrar ▼'}
              </span>
            </button>

            {isPaidHistoryOpen && (
              <div className="grid grid-cols-1 gap-2">
                {paidBills.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0 border border-emerald-500/20">
                        <CheckCircle2 size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-white truncate">{tx.title}</p>
                        <p className="text-[10px] text-emerald-400 font-medium">
                          Paga • Venceu em {formatDate(tx.date)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-base sm:text-lg font-extrabold text-emerald-400 tabular-nums">
                        {formatCurrency(tx.amount)}
                      </span>

                      <select
                        value="paga"
                        onChange={(e) =>
                          updateTransactionStatus(
                            tx.id,
                            e.target.value as 'paga' | 'pendente' | 'vencida'
                          )
                        }
                        className="px-2 py-1 rounded-xl text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 focus:outline-none cursor-pointer"
                      >
                        <option value="paga" className="bg-zinc-900 text-emerald-400">
                          ✅ PAGA
                        </option>
                        <option value="pendente" className="bg-zinc-900 text-amber-400">
                          ⏳ Desfazer (Voltar Pendente)
                        </option>
                      </select>

                      <button
                        onClick={() => deleteFinancialTransaction(tx.id)}
                        className="text-zinc-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}

                {paidBills.length === 0 && (
                  <div className="col-span-full py-4 text-center text-zinc-500 text-xs bg-zinc-900/30 rounded-xl border border-zinc-800/60">
                    Nenhuma conta foi paga ainda.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ABA 5: DÍVIDAS / EMPRÉSTIMOS */}
      {activeTab === 'debts' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">Dívidas & Empréstimos</h2>
            </div>
            <div className="flex items-center gap-2">
              {financialDebts.length > 0 && (
                <button
                  onClick={() => clearAllDebts()}
                  className="flex items-center gap-1 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-semibold transition-all"
                  title="Apagar todas as dívidas"
                >
                  <Trash2 size={13} /> Apagar Dívidas
                </button>
              )}
              <button
                onClick={() => setIsDebtModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-600/20"
              >
                <Plus size={14} /> Nova Dívida
              </button>
            </div>
          </div>

          {financialDebts.length === 0 ? (
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 text-center">
              <Building2 size={36} className="mx-auto text-zinc-600 mb-2" />
              <p className="text-xs sm:text-sm font-semibold text-white">Nenhuma dívida cadastrada.</p>
              <p className="text-[11px] text-zinc-500 mt-1">
                Clique em "+ Nova Dívida" e informe a Instituição, Modelo de Dívida e o Valor.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {financialDebts.map((debt) => {
                const remaining = debt.remainingAmount !== undefined ? debt.remainingAmount : debt.totalAmount;
                const isQuitada = remaining <= 0;

                return (
                  <div
                    key={debt.id}
                    className={`bg-zinc-900/90 border rounded-2xl p-4 space-y-3 flex flex-col justify-between transition-all ${
                      isQuitada ? 'border-emerald-500/30 bg-emerald-950/10' : 'border-zinc-800 hover:border-purple-500/30'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[11px] font-bold text-purple-400 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 truncate">
                          {debt.creditor}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditDebt(debt)}
                            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-all"
                            title="Editar / Pagamento Parcial"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => deleteFinancialDebt(debt.id)}
                            className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-sm font-extrabold text-white">{debt.title}</h3>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        Valor Inicial: {formatCurrency(debt.totalAmount)}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Saldo Devedor</p>
                        <p className={`text-base font-extrabold ${isQuitada ? 'text-emerald-400' : 'text-purple-400'}`}>
                          {formatCurrency(remaining)}
                        </p>
                      </div>

                      <button
                        onClick={() => openEditDebt(debt)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                          isQuitada
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/20'
                        }`}
                      >
                        {isQuitada ? (
                          <>
                            <CheckCircle2 size={14} /> QUITADA
                          </>
                        ) : (
                          <>
                            <DollarSign size={14} /> Abater / Editar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── ABA 6: 🎯 METAS DE RECOMEÇO (VIRADA DE CHAVE) ────────────────────── */}
      {activeTab === 'goals' && (
        <div className="space-y-4">
          {/* Header da Aba com Mensagem Inspiradora */}
          <div className="bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-teal-950/40 p-4 sm:p-5 rounded-2xl border border-emerald-500/30 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
                  <Flame size={22} className="animate-pulse" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                    Minhas Metas de Recomeço
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Virada de Chave 🔑
                    </span>
                  </h2>
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

            {/* Progresso Geral de Todas as Metas */}
            {financialGoals.length > 0 && (
              <div className="pt-3 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                  <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Total Guardado</span>
                  <span className="text-base font-extrabold text-emerald-400">{formatCurrency(totalGoalsSaved)}</span>
                </div>
                <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                  <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Meta Total Planejada</span>
                  <span className="text-base font-extrabold text-white">{formatCurrency(totalGoalsTarget)}</span>
                </div>
                <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                  <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Progresso Geral</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
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
          </div>

          {/* LISTA DE METAS */}
          {financialGoals.length === 0 ? (
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 text-center space-y-4">
              <Target size={42} className="mx-auto text-emerald-400/60 animate-bounce" />
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-sm sm:text-base font-bold text-white">Pronto para dar a virada na sua vida?</h3>
                <p className="text-xs text-zinc-400">
                  Defina metas claras como Reserva de Emergência, Quitar Dívidas ou Comprar Equipamentos para alavancar seu negócio!
                </p>
              </div>

              {/* Botão de Sugestão Rápida */}
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
                  className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-all"
                >
                  🛡️ Criar Reserva R$ 1.000
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
                  className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold transition-all"
                >
                  🧹 Quitar Dívidas
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
        </div>
      )}

      {/* ─── MODAL: NOVA TRANSAÇÃO ────────────────────────────────────────────── */}
      {isTransactionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-4 sm:p-6 space-y-3 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsTransactionModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="text-emerald-400" size={18} />
              {txType === 'income'
                ? 'Lançar Receita / Bico'
                : txType === 'recurring_bill'
                ? 'Lançar Conta'
                : 'Lançar Gasto Diário'}
            </h2>

            <form onSubmit={handleSaveTransaction} className="space-y-3">
              <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-800/60 rounded-xl text-center">
                <button
                  type="button"
                  onClick={() => {
                    setTxType('income');
                    setTxCategory('salario');
                  }}
                  className={`py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                    txType === 'income' ? 'bg-emerald-500 text-white shadow' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Receita
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTxType('expense');
                    setTxCategory('alimentacao');
                  }}
                  className={`py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                    txType === 'expense' ? 'bg-rose-500 text-white shadow' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Gasto Diário
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTxType('recurring_bill');
                    setTxCategory('moradia');
                    setTxStatus('pendente');
                    setTxDueDate(new Date().toISOString().split('T')[0]);
                  }}
                  className={`py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                    txType === 'recurring_bill' ? 'bg-amber-500 text-zinc-950 shadow' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Conta
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Título / Descrição</label>
                <input
                  type="text"
                  required
                  placeholder={
                    txType === 'income'
                      ? 'Ex: Salário, Bico de Informática'
                      : txType === 'recurring_bill'
                      ? 'Ex: Conta de Energia, Água, Internet'
                      : 'Ex: R$ 20 Gasolina, R$ 10 Almoço'
                  }
                  value={txTitle}
                  onChange={(e) => setTxTitle(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Categoria</label>
                  <select
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value as FinancialCategory)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-2 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    {Object.entries(FINANCIAL_CATEGORY_LABELS).map(([catKey, catLabel]) => (
                      <option key={catKey} value={catKey}>
                        {catLabel}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {txType === 'recurring_bill' ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-amber-400 mb-1 font-bold">
                      📅 Data de Vencimento
                    </label>
                    <input
                      type="date"
                      required
                      value={txDueDate}
                      onChange={(e) => setTxDueDate(e.target.value)}
                      className="w-full bg-zinc-800 border border-amber-500/50 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Status Inicial</label>
                    <select
                      value={txStatus}
                      onChange={(e) => setTxStatus(e.target.value as 'paga' | 'pendente' | 'vencida')}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-2 py-2 text-xs sm:text-sm font-bold text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="pendente">⏳ Pendente</option>
                      <option value="vencida">🚨 Vencida</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Data</label>
                  <input
                    type="date"
                    required
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTransactionModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: NOVA DÍVIDA ───────────────────────────────────────────────── */}
      {isDebtModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-4 sm:p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsDebtModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CreditCard className="text-purple-400" size={18} />
              Nova Dívida / Empréstimo
            </h2>

            <form onSubmit={handleSaveDebt} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Nome da Instituição / Credor</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Nubank, Cerasa, Banco do Brasil, Amigo"
                  value={debtCreditor}
                  onChange={(e) => setDebtCreditor(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Modelo de Dívida</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Empréstimo Consignado, Dívida Cerasa, Cartão de Crédito"
                  value={debtTitle}
                  onChange={(e) => setDebtTitle(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Valor Total da Dívida (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="5000.00"
                  value={debtTotalAmount}
                  onChange={(e) => setDebtTotalAmount(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDebtModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/20"
                >
                  Salvar Dívida
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: EDITAR / ABATER DÍVIDA ────────────────────────────────────── */}
      {editingDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-4 sm:p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setEditingDebt(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Edit2 className="text-purple-400" size={18} />
              Abater / Editar Dívida ({editingDebt.creditor})
            </h2>

            <form onSubmit={handleSaveDebtEdit} className="space-y-3">
              <div className="p-3 bg-purple-950/20 border border-purple-500/30 rounded-xl space-y-2">
                <label className="block text-xs font-bold text-purple-300">
                  ⚡ Pagamento Parcial / Abater Valor (R$)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 200,00"
                    value={amortizeAmount}
                    onChange={(e) => setAmortizeAmount(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <p className="text-[10px] text-zinc-400">
                  Digite quanto você pagou agora para descontar automaticamente do saldo.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Nome da Instituição</label>
                <input
                  type="text"
                  value={editCreditor}
                  onChange={(e) => setEditCreditor(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Modelo de Dívida</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Saldo Devedor Restante (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editRemainingAmount}
                  onChange={(e) => setEditRemainingAmount(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-purple-400 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingDebt(null)}
                  className="px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/20"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
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
