import { useState, useMemo, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import {
  FinancialTransaction,
  FinancialDebt,
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
  DollarSign,
  Receipt,
  ShieldAlert,
  CheckSquare,
} from 'lucide-react';

export function FinancialManagement() {
  const financialTransactions = useStore((s) => s.financialTransactions);
  const financialDebts = useStore((s) => s.financialDebts);
  const addFinancialTransaction = useStore((s) => s.addFinancialTransaction);
  const deleteFinancialTransaction = useStore((s) => s.deleteFinancialTransaction);
  const toggleTransactionPaid = useStore((s) => s.toggleTransactionPaid);
  const addFinancialDebt = useStore((s) => s.addFinancialDebt);
  const deleteFinancialDebt = useStore((s) => s.deleteFinancialDebt);
  const toggleDebtParcelPayment = useStore((s) => s.toggleDebtParcelPayment);

  // Active Tab: 'overview' | 'incomes' | 'daily_expenses' | 'recurring_bills' | 'debts'
  const [activeTab, setActiveTab] = useState<'overview' | 'incomes' | 'daily_expenses' | 'recurring_bills' | 'debts'>('overview');

  // Modals state
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [modalDefaultType, setModalDefaultType] = useState<TransactionType>('income');
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);

  // Filter Month
  const currentMonthKey = new Date().toISOString().slice(0, 7); // YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);

  // Form State: Transaction
  const [txType, setTxType] = useState<TransactionType>('income');
  const [txTitle, setTxTitle] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState<FinancialCategory | string>('salario');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txDueDay, setTxDueDay] = useState('5');
  const [txIsRecurring, setTxIsRecurring] = useState(false);
  const [txNotes, setTxNotes] = useState('');

  // Form State: Debt
  const [debtTitle, setDebtTitle] = useState('');
  const [debtCreditor, setDebtCreditor] = useState('');
  const [debtTotalAmount, setDebtTotalAmount] = useState('');
  const [debtInstallmentsCount, setDebtInstallmentsCount] = useState('12');
  const [debtInstallmentValue, setDebtInstallmentValue] = useState('');
  const [debtDueDay, setDebtDueDay] = useState('10');
  const [debtFirstDueDate, setDebtFirstDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [debtNotes, setDebtNotes] = useState('');

  // ─── GERAÇÃO AUTOMÁTICA DE CONTAS RECORRENTES NO DIA 1 DO MÊS ───────────────────
  useEffect(() => {
    // Projeta contas recorrentes cadastradas para o mês selecionado
    const recurringTemplates = financialTransactions.filter(
      (tx) => tx.type === 'recurring_bill'
    );

    recurringTemplates.forEach((template) => {
      const templateMonth = template.date.slice(0, 7);
      // Se a conta recorrente foi criada antes ou no mês selecionado, garante a instância no mês
      if (templateMonth <= selectedMonth) {
        const expectedDate = `${selectedMonth}-${String(template.dueDay || 1).padStart(2, '0')}`;
        const instanceExists = financialTransactions.some(
          (tx) =>
            tx.title === template.title &&
            tx.date.startsWith(selectedMonth) &&
            tx.type === 'recurring_bill'
        );

        if (!instanceExists && templateMonth !== selectedMonth) {
          // Cria automaticamente a instância da conta para o mês selecionado
          const newInstance: FinancialTransaction = {
            id: 'tx_rec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            title: template.title,
            amount: template.amount,
            type: 'recurring_bill',
            category: template.category,
            date: expectedDate,
            dueDay: template.dueDay || 1,
            isRecurring: true,
            paid: false,
            notes: template.notes,
            createdAt: new Date().toISOString(),
          };
          addFinancialTransaction(newInstance);
        }
      }
    });
  }, [selectedMonth, financialTransactions, addFinancialTransaction]);

  // Auto-calcular valor da parcela da dívida
  const handleTotalOrCountChange = (totalStr: string, countStr: string) => {
    const total = parseFloat(totalStr) || 0;
    const count = parseInt(countStr) || 1;
    if (total > 0 && count > 0) {
      setDebtInstallmentValue((total / count).toFixed(2));
    }
  };

  // Movimentações do Mês Selecionado
  const monthTransactions = useMemo(() => {
    return financialTransactions.filter((tx) => tx.date.startsWith(selectedMonth));
  }, [financialTransactions, selectedMonth]);

  // 1. Receitas do Mês (Salário, Bicos, Rendas Extras)
  const monthIncomes = useMemo(() => {
    return monthTransactions.filter((tx) => tx.type === 'income');
  }, [monthTransactions]);

  const totalIncome = useMemo(() => {
    return monthIncomes.reduce((acc, tx) => acc + tx.amount, 0);
  }, [monthIncomes]);

  // 2. Gastos Diários do Mês (Gasolina, Almoço, Lanche, Uber, etc.)
  const monthDailyExpenses = useMemo(() => {
    return monthTransactions.filter((tx) => tx.type === 'expense');
  }, [monthTransactions]);

  const totalDailyExpenses = useMemo(() => {
    return monthDailyExpenses.reduce((acc, tx) => acc + tx.amount, 0);
  }, [monthDailyExpenses]);

  // 3. Contas Recorrentes Mensais (Energia, Água, Internet, Aluguel, etc.)
  const monthRecurringBills = useMemo(() => {
    return monthTransactions.filter((tx) => tx.type === 'recurring_bill');
  }, [monthTransactions]);

  const totalRecurringBills = useMemo(() => {
    return monthRecurringBills.reduce((acc, tx) => acc + tx.amount, 0);
  }, [monthRecurringBills]);

  // Total de Gastos Gerais (Diários + Contas Recorrentes)
  const totalExpensesAll = totalDailyExpenses + totalRecurringBills;

  // Saldo Livre (Sobra)
  const netBalance = totalIncome - totalExpensesAll;

  // 4. Dívidas & Empréstimos (Saldo Devedor Restante)
  const totalRemainingDebt = useMemo(() => {
    return financialDebts.reduce((acc, debt) => {
      const unpaidParcels = debt.parcels.filter((p) => !p.paid);
      const remainingAmount = unpaidParcels.reduce((pAcc, p) => pAcc + p.amount, 0);
      return acc + remainingAmount;
    }, 0);
  }, [financialDebts]);

  // Handler para Salvar Lançamento
  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txTitle.trim() || !txAmount || parseFloat(txAmount) <= 0) return;

    const dueDayNum = parseInt(txDueDay) || 1;
    const isRec = txType === 'recurring_bill';

    const newTx: FinancialTransaction = {
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: txTitle.trim(),
      amount: parseFloat(txAmount),
      type: txType,
      category: txCategory,
      date: txDate,
      dueDay: dueDayNum,
      isRecurring: isRec,
      paid: txType === 'income' ? true : false,
      notes: txNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    addFinancialTransaction(newTx);
    setIsTransactionModalOpen(false);

    // Reset Form
    setTxTitle('');
    setTxAmount('');
    setTxNotes('');
  };

  // Handler para Salvar Dívida / Empréstimo Consignado
  const handleSaveDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const total = parseFloat(debtTotalAmount) || 0;
    const count = parseInt(debtInstallmentsCount) || 1;
    const instValue = parseFloat(debtInstallmentValue) || (total / count);
    const dueDayNum = parseInt(debtDueDay) || 10;

    if (!debtTitle.trim() || total <= 0 || count <= 0) return;

    const parcels = [];
    const startDateObj = new Date(debtFirstDueDate);

    for (let i = 1; i <= count; i++) {
      const pDate = new Date(startDateObj);
      pDate.setMonth(startDateObj.getMonth() + (i - 1));
      
      if (dueDayNum > 0 && dueDayNum <= 31) {
        pDate.setDate(dueDayNum);
      }

      parcels.push({
        id: `p_${Date.now()}_${i}`,
        number: i,
        dueDate: pDate.toISOString().split('T')[0],
        amount: instValue,
        paid: false,
      });
    }

    const newDebt: FinancialDebt = {
      id: 'debt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: debtTitle.trim(),
      creditor: debtCreditor.trim() || 'Não especificado',
      totalAmount: total,
      installmentsCount: count,
      installmentValue: instValue,
      dueDay: dueDayNum,
      firstDueDate: debtFirstDueDate,
      notes: debtNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
      parcels,
    };

    addFinancialDebt(newDebt);
    setIsDebtModalOpen(false);

    // Reset Form
    setDebtTitle('');
    setDebtCreditor('');
    setDebtTotalAmount('');
    setDebtInstallmentValue('');
    setDebtNotes('');
  };

  const openNewTransaction = (type: TransactionType) => {
    setTxType(type);
    if (type === 'income') {
      setTxCategory('salario');
      setTxIsRecurring(false);
    } else if (type === 'recurring_bill') {
      setTxCategory('moradia');
      setTxIsRecurring(true);
    } else {
      setTxCategory('alimentacao');
      setTxIsRecurring(false);
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
            <p className="text-xs text-zinc-400">
              Salário, bicos, gastos diários, contas recorrentes e dívidas.
            </p>
          </div>
        </div>

        {/* Filter Month */}
        <div className="flex items-center justify-between sm:justify-start gap-2 bg-zinc-800/90 px-3 py-2 rounded-xl border border-zinc-700">
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

        {/* Contas Recorrentes */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3.5 sm:p-4 relative overflow-hidden group hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-zinc-400">Contas Mensais</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Repeat size={16} />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-extrabold text-white mt-1.5 truncate">
            {formatCurrency(totalRecurringBills)}
          </p>
          <p className="text-[10px] text-zinc-500 mt-1 truncate">Energia, Água ({monthRecurringBills.length})</p>
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
          <p className="text-[10px] text-zinc-500 mt-1 truncate">{financialDebts.length} Empréstimo(s)</p>
        </div>
      </div>

      {/* ─── NAVEGAÇÃO DAS 5 ABAS SOLICITADAS (PÍLULAS SCROLLÁVEIS) ─────────────── */}
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
          CONTAS RECORRENTES ({monthRecurringBills.length})
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
                  <p className="text-[11px] text-zinc-600 mt-1">
                    Navegue nas abas acima para cadastrar receitas, gastos diários ou contas.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {monthTransactions.map((tx) => (
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
                              ? 'bg-amber-500/10 text-amber-400'
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
                              <span className="text-amber-400 text-[10px]">↻ Mensal</span>
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
                  ))}
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
                  <span className="text-zinc-400">Contas Mensais:</span>
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

      {/* ABA 2: RECEITAS (Salário, Bicos, Rendas Extras) */}
      {activeTab === 'incomes' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">Minhas Receitas</h2>
              <p className="text-[11px] text-zinc-400">Tudo aquilo que você ganha: Salário, bicos, renda extra.</p>
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
                className="bg-zinc-900/90 border border-zinc-800 p-3.5 rounded-2xl flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                    <Briefcase size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-white truncate">{tx.title}</p>
                    <p className="text-[10px] text-zinc-500">
                      {FINANCIAL_CATEGORY_LABELS[tx.category] || tx.category} • {formatDate(tx.date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs sm:text-sm font-extrabold text-emerald-400">
                    +{formatCurrency(tx.amount)}
                  </span>
                  <button
                    onClick={() => deleteFinancialTransaction(tx.id)}
                    className="text-zinc-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}

            {monthIncomes.length === 0 && (
              <div className="col-span-full py-8 text-center text-zinc-500 text-xs bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                Nenhuma receita cadastrada. Clique em "+ Nova Receita" para registrar seu salário ou bico.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ABA 3: GASTOS DIÁRIOS (Gasolina, Almoço, Lanche, Uber) */}
      {activeTab === 'daily_expenses' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">Gastos Diários</h2>
              <p className="text-[11px] text-zinc-400">Gastos do dia a dia: R$ 20 gasolina, R$ 10 almoço, etc.</p>
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
                className="bg-zinc-900/90 border border-zinc-800 p-3.5 rounded-2xl flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 shrink-0">
                    <ArrowDownRight size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-white truncate">{tx.title}</p>
                    <p className="text-[10px] text-zinc-500">
                      {FINANCIAL_CATEGORY_LABELS[tx.category] || tx.category} • {formatDate(tx.date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs sm:text-sm font-extrabold text-rose-400">
                    -{formatCurrency(tx.amount)}
                  </span>
                  <button
                    onClick={() => deleteFinancialTransaction(tx.id)}
                    className="text-zinc-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}

            {monthDailyExpenses.length === 0 && (
              <div className="col-span-full py-8 text-center text-zinc-500 text-xs bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                Nenhum gasto diário registrado neste mês.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ABA 4: CONTAS RECORRENTES (Energia, Água, Internet, Aluguel) */}
      {activeTab === 'recurring_bills' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">Contas Recorrentes Mensais</h2>
              <p className="text-[11px] text-zinc-400">
                Contas fixas que chegam todo mês. Todo dia 1 aparecem automaticamente!
              </p>
            </div>
            <button
              onClick={() => openNewTransaction('recurring_bill')}
              className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-amber-500/20"
            >
              <Plus size={14} /> Nova Conta Recorrente
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {monthRecurringBills.map((tx) => (
              <div
                key={tx.id}
                className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                  tx.paid
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : 'bg-zinc-900/90 border-amber-500/30'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-2 rounded-xl shrink-0 ${tx.paid ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    <Repeat size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-white truncate">{tx.title}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      Vence dia <strong className="text-zinc-200">{tx.dueDay || 1}</strong> • {formatCurrency(tx.amount)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleTransactionPaid(tx.id)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      tx.paid
                        ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                        : 'bg-amber-500 hover:bg-amber-600 text-zinc-950'
                    }`}
                  >
                    {tx.paid ? (
                      <>
                        <CheckCircle2 size={13} /> Paga
                      </>
                    ) : (
                      'Dar Baixa'
                    )}
                  </button>
                  <button
                    onClick={() => deleteFinancialTransaction(tx.id)}
                    className="text-zinc-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}

            {monthRecurringBills.length === 0 && (
              <div className="col-span-full py-8 text-center text-zinc-500 text-xs bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                Nenhuma conta recorrente cadastrada. Adicione sua conta de luz, água ou aluguel!
              </div>
            )}
          </div>
        </div>
      )}

      {/* ABA 5: DÍVIDAS / EMPRÉSTIMOS (Consignado, Cerasa, Empréstimos) */}
      {activeTab === 'debts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">Dívidas & Empréstimos</h2>
              <p className="text-[11px] text-zinc-400">
                Consignados, dívidas Cerasa, bancos e empréstimos parcelados.
              </p>
            </div>
            <button
              onClick={() => setIsDebtModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-600/20"
            >
              <Plus size={14} /> Novo Empréstimo / Dívida
            </button>
          </div>

          {financialDebts.length === 0 ? (
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 text-center">
              <Building2 size={36} className="mx-auto text-zinc-600 mb-2" />
              <p className="text-xs sm:text-sm font-semibold text-white">Nenhuma dívida ou empréstimo cadastrado.</p>
              <p className="text-[11px] text-zinc-500 mt-1">
                Cadastre seus empréstimos consignados ou dívidas para dar baixa em cada parcela.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {financialDebts.map((debt) => {
                const paidParcelsCount = debt.parcels.filter((p) => p.paid).length;
                const progressPercent = (paidParcelsCount / debt.installmentsCount) * 100;
                const paidAmount = debt.parcels.filter((p) => p.paid).reduce((a, b) => a + b.amount, 0);
                const remainingAmount = debt.totalAmount - paidAmount;

                return (
                  <div key={debt.id} className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-800 gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h3 className="text-sm font-bold text-white truncate">{debt.title}</h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-medium border border-purple-500/20">
                            {debt.creditor}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          Vencimento todo dia <strong className="text-zinc-300">{debt.dueDay}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <p className="text-[10px] text-zinc-400">Total: {formatCurrency(debt.totalAmount)}</p>
                          <p className="text-xs font-bold text-purple-400">
                            Restante: {formatCurrency(remainingAmount)}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteFinancialDebt(debt.id)}
                          className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-zinc-400 font-medium">
                        <span>
                          Progresso ({paidParcelsCount}/{debt.installmentsCount} pagas)
                        </span>
                        <span>{progressPercent.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-purple-500 h-full rounded-full transition-all"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                        Parcelas do Empréstimo
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {debt.parcels.map((parcel) => (
                          <div
                            key={parcel.id}
                            className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                              parcel.paid
                                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                                : 'bg-zinc-800/40 border-zinc-800 text-zinc-300'
                            }`}
                          >
                            <div>
                              <p className="font-bold text-xs">
                                Parcela {parcel.number}/{debt.installmentsCount}
                              </p>
                              <p className="text-[10px] text-zinc-500">
                                Vence: {formatDate(parcel.dueDate)}
                              </p>
                              <p className="font-semibold text-xs mt-0.5">{formatCurrency(parcel.amount)}</p>
                            </div>

                            <button
                              onClick={() => toggleDebtParcelPayment(debt.id, parcel.id)}
                              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                                parcel.paid
                                  ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                  : 'bg-purple-600 hover:bg-purple-700 text-white'
                              }`}
                            >
                              {parcel.paid ? (
                                <>
                                  <CheckCircle2 size={13} /> Paga
                                </>
                              ) : (
                                'Dar Baixa'
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── MODAL: NOVA TRANSAÇÃO (RECEITA / GASTO / CONTA RECORRENTE) ───────── */}
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
                ? 'Lançar Conta Recorrente'
                : 'Lançar Gasto Diário'}
            </h2>

            <form onSubmit={handleSaveTransaction} className="space-y-3">
              {/* Seletor do Tipo */}
              <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-800/60 rounded-xl text-center">
                <button
                  type="button"
                  onClick={() => {
                    setTxType('income');
                    setTxCategory('salario');
                    setTxIsRecurring(false);
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
                    setTxIsRecurring(false);
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
                    setTxIsRecurring(true);
                  }}
                  className={`py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                    txType === 'recurring_bill' ? 'bg-amber-500 text-zinc-950 shadow' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Conta Mensal
                </button>
              </div>

              {/* Título */}
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

              {/* Valor & Categoria */}
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

              {/* Data & Dia de Vencimento */}
              <div className="grid grid-cols-2 gap-2">
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

                {txType === 'recurring_bill' && (
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Dia Vencimento (1-31)</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      required
                      value={txDueDay}
                      onChange={(e) => setTxDueDay(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}
              </div>

              {/* Botões */}
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

      {/* ─── MODAL: NOVO EMPRÉSTIMO / DÍVIDA CERASA ───────────────────────────── */}
      {isDebtModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-4 sm:p-6 space-y-3 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsDebtModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CreditCard className="text-purple-400" size={18} />
              Novo Empréstimo / Dívida Cerasa
            </h2>

            <form onSubmit={handleSaveDebt} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Nome da Dívida / Empréstimo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Empréstimo Consignado, Cerasa, Nubank"
                  value={debtTitle}
                  onChange={(e) => setDebtTitle(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Banco / Credor</label>
                  <input
                    type="text"
                    placeholder="Ex: Nubank, Caixa, Amigo"
                    value={debtCreditor}
                    onChange={(e) => setDebtCreditor(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Valor Total (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="5000.00"
                    value={debtTotalAmount}
                    onChange={(e) => {
                      setDebtTotalAmount(e.target.value);
                      handleTotalOrCountChange(e.target.value, debtInstallmentsCount);
                    }}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Nº Parcelas</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    required
                    value={debtInstallmentsCount}
                    onChange={(e) => {
                      setDebtInstallmentsCount(e.target.value);
                      handleTotalOrCountChange(debtTotalAmount, e.target.value);
                    }}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Valor Parcela (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={debtInstallmentValue}
                    onChange={(e) => setDebtInstallmentValue(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Dia Vencimento</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={debtDueDay}
                    onChange={(e) => setDebtDueDay(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">1ª Parcela Em</label>
                  <input
                    type="date"
                    required
                    value={debtFirstDueDate}
                    onChange={(e) => setDebtFirstDueDate(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Botões */}
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
    </div>
  );
}
