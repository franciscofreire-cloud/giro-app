import { useState, useMemo } from 'react';
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
  XCircle,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Briefcase,
  Sparkles,
  CreditCard,
  Building2,
  X,
  AlertTriangle,
  Info,
} from 'lucide-react';

export function FinancialManagement() {
  const financialTransactions = useStore((s) => s.financialTransactions);
  const financialDebts = useStore((s) => s.financialDebts);
  const sales = useStore((s) => s.sales);
  const addFinancialTransaction = useStore((s) => s.addFinancialTransaction);
  const deleteFinancialTransaction = useStore((s) => s.deleteFinancialTransaction);
  const addFinancialDebt = useStore((s) => s.addFinancialDebt);
  const deleteFinancialDebt = useStore((s) => s.deleteFinancialDebt);
  const toggleDebtParcelPayment = useStore((s) => s.toggleDebtParcelPayment);

  // Active Tab: 'overview' | 'incomes' | 'expenses' | 'debts'
  const [activeTab, setActiveTab] = useState<'overview' | 'incomes' | 'expenses' | 'debts'>('overview');

  // Modals state
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
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

  // Auto-calculate installment value when total & count change
  const handleTotalOrCountChange = (totalStr: string, countStr: string) => {
    const total = parseFloat(totalStr) || 0;
    const count = parseInt(countStr) || 1;
    if (total > 0 && count > 0) {
      setDebtInstallmentValue((total / count).toFixed(2));
    }
  };

  // Profit from Sales in the selected month
  const salesProfitThisMonth = useMemo(() => {
    return sales
      .filter((s) => s.saleDate.startsWith(selectedMonth))
      .reduce((acc, s) => acc + (s.profit || 0), 0);
  }, [sales, selectedMonth]);

  // Filtered transactions for selected month
  const monthTransactions = useMemo(() => {
    return financialTransactions.filter((tx) => tx.date.startsWith(selectedMonth));
  }, [financialTransactions, selectedMonth]);

  // Total Incomes for the selected month (Registered Incomes + Sales Profit)
  const totalIncome = useMemo(() => {
    const registered = monthTransactions
      .filter((tx) => tx.type === 'income')
      .reduce((acc, tx) => acc + tx.amount, 0);
    return registered + salesProfitThisMonth;
  }, [monthTransactions, salesProfitThisMonth]);

  // Total Expenses for the selected month
  const totalExpense = useMemo(() => {
    return monthTransactions
      .filter((tx) => tx.type === 'expense')
      .reduce((acc, tx) => acc + tx.amount, 0);
  }, [monthTransactions]);

  // Net Balance
  const netBalance = totalIncome - totalExpense;

  // Remaining Debt Total across all active debts
  const totalRemainingDebt = useMemo(() => {
    return financialDebts.reduce((acc, debt) => {
      const unpaidParcels = debt.parcels.filter((p) => !p.paid);
      const remainingAmount = unpaidParcels.reduce((pAcc, p) => pAcc + p.amount, 0);
      return acc + remainingAmount;
    }, 0);
  }, [financialDebts]);

  // Category breakdown for expenses
  const categoryExpenses = useMemo(() => {
    const map: Record<string, number> = {};
    monthTransactions
      .filter((tx) => tx.type === 'expense')
      .forEach((tx) => {
        const catName = FINANCIAL_CATEGORY_LABELS[tx.category] || tx.category;
        map[catName] = (map[catName] || 0) + tx.amount;
      });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [monthTransactions]);

  // Handle Save Transaction
  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txTitle.trim() || !txAmount || parseFloat(txAmount) <= 0) return;

    const newTx: FinancialTransaction = {
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: txTitle.trim(),
      amount: parseFloat(txAmount),
      type: txType,
      category: txCategory,
      date: txDate,
      isRecurring: txIsRecurring,
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

  // Handle Save Debt
  const handleSaveDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const total = parseFloat(debtTotalAmount) || 0;
    const count = parseInt(debtInstallmentsCount) || 1;
    const instValue = parseFloat(debtInstallmentValue) || (total / count);
    const dueDayNum = parseInt(debtDueDay) || 10;

    if (!debtTitle.trim() || total <= 0 || count <= 0) return;

    // Generate Parcels
    const parcels = [];
    const startDateObj = new Date(debtFirstDueDate);

    for (let i = 1; i <= count; i++) {
      const pDate = new Date(startDateObj);
      pDate.setMonth(startDateObj.getMonth() + (i - 1));
      
      // Ajustar dia do vencimento se aplicável
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

  return (
    <div className="space-y-6 pb-24 pt-4 px-4 max-w-7xl mx-auto">
      {/* ─── Header & Quick Actions ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/80 p-5 rounded-2xl border border-zinc-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Wallet className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Gestão Financeira Pessoal
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/20">
                Oficial
              </span>
            </h1>
            <p className="text-xs text-zinc-400">
              Controle seu salário, renda extra, gastos e dívidas para transformar suas finanças.
            </p>
          </div>
        </div>

        {/* Filter Month & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mês Seletor */}
          <div className="flex items-center gap-2 bg-zinc-800/80 px-3 py-1.5 rounded-xl border border-zinc-700">
            <Calendar size={14} className="text-emerald-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={() => {
              setTxType('income');
              setTxCategory('salario');
              setIsTransactionModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-emerald-500/20 active:scale-95"
          >
            <Plus size={16} />
            Lançar Movimentação
          </button>

          <button
            onClick={() => setIsDebtModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-xl text-xs font-semibold border border-zinc-700 transition-all active:scale-95"
          >
            <CreditCard size={16} className="text-purple-400" />
            Novo Empréstimo / Dívida
          </button>
        </div>
      </div>

      {/* ─── Metric Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receitas Totais */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Receitas do Mês</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ArrowUpRight size={18} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white mt-2">
            {formatCurrency(totalIncome)}
          </p>
          <div className="flex items-center gap-2 mt-2 text-[11px] text-zinc-500">
            <span>Salário + Extra</span>
            {salesProfitThisMonth > 0 && (
              <span className="text-emerald-400 font-medium">
                (+{formatCurrency(salesProfitThisMonth)} Giro App)
              </span>
            )}
          </div>
        </div>

        {/* Despesas Totais */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 relative overflow-hidden group hover:border-rose-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Gastos do Mês</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <ArrowDownRight size={18} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white mt-2">
            {formatCurrency(totalExpense)}
          </p>
          <div className="flex items-center gap-2 mt-2 text-[11px] text-zinc-500">
            <span>Fixos + Diários + Dívidas</span>
          </div>
        </div>

        {/* Balanço Líquido */}
        <div
          className={`bg-zinc-900 border rounded-2xl p-4 relative overflow-hidden transition-all ${
            netBalance >= 0 ? 'border-emerald-500/40' : 'border-rose-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Saldo Livre (Sobra)</span>
            <div
              className={`p-2 rounded-xl ${
                netBalance >= 0
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-rose-500/10 text-rose-400'
              }`}
            >
              <Scale size={18} />
            </div>
          </div>
          <p
            className={`text-2xl font-extrabold mt-2 ${
              netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatCurrency(netBalance)}
          </p>
          <div className="flex items-center gap-1 mt-2 text-[11px]">
            {netBalance >= 0 ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 size={12} /> Finanças no Azul!
              </span>
            ) : (
              <span className="text-rose-400 font-semibold flex items-center gap-1">
                <AlertTriangle size={12} /> Atenção aos gastos!
              </span>
            )}
          </div>
        </div>

        {/* Saldo Devedor Restante */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 relative overflow-hidden group hover:border-purple-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Saldo Devedor Dívidas</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <CreditCard size={18} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white mt-2">
            {formatCurrency(totalRemainingDebt)}
          </p>
          <div className="flex items-center gap-2 mt-2 text-[11px] text-zinc-500">
            <span>{financialDebts.length} Empréstimo(s) ativo(s)</span>
          </div>
        </div>
      </div>

      {/* ─── Navigation Sub-Tabs ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          }`}
        >
          <Sparkles size={14} />
          Visão Geral & Extrato
        </button>

        <button
          onClick={() => setActiveTab('incomes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'incomes'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          }`}
        >
          <TrendingUp size={14} />
          Receitas & Salário ({monthTransactions.filter((t) => t.type === 'income').length})
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'expenses'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          }`}
        >
          <TrendingDown size={14} />
          Gastos Fixos & Diários ({monthTransactions.filter((t) => t.type === 'expense').length})
        </button>

        <button
          onClick={() => setActiveTab('debts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'debts'
              ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          }`}
        >
          <CreditCard size={14} />
          Empréstimos & Dívidas ({financialDebts.length})
        </button>
      </div>

      {/* ─── TAB CONTENT ───────────────────────────────────────────────────────── */}

      {/* TAB 1: VISÃO GERAL */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lado Esquerdo: Extrato Recente */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Calendar size={16} className="text-emerald-400" />
                  Extrato de Movimentações ({selectedMonth})
                </h2>
                <span className="text-xs text-zinc-500">
                  {monthTransactions.length} registros no mês
                </span>
              </div>

              {monthTransactions.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-zinc-800 rounded-xl">
                  <PiggyBank size={40} className="mx-auto text-zinc-600 mb-2" />
                  <p className="text-sm font-medium text-zinc-400">
                    Nenhuma movimentação registrada neste mês.
                  </p>
                  <p className="text-xs text-zinc-600 mt-1">
                    Clique em "+ Lançar Movimentação" para registrar salário ou gastos.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {monthTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/40 hover:bg-zinc-800/70 border border-zinc-800/60 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            tx.type === 'income'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}
                        >
                          {tx.type === 'income' ? (
                            <ArrowUpRight size={18} />
                          ) : (
                            <ArrowDownRight size={18} />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{tx.title}</p>
                          <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-medium">
                              {FINANCIAL_CATEGORY_LABELS[tx.category] || tx.category}
                            </span>
                            <span>• {formatDate(tx.date)}</span>
                            {tx.isRecurring && (
                              <span className="text-emerald-400 text-[10px]">↻ Recorrente</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`text-sm font-bold ${
                            tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
                        </span>
                        <button
                          onClick={() => deleteFinancialTransaction(tx.id)}
                          className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-all"
                          title="Excluir movimentação"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Lado Direito: Distribuição de Gastos & Dica Financeira */}
          <div className="space-y-4">
            {/* Categorias de Gastos */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <TrendingDown size={16} className="text-rose-400" />
                Gastos por Categoria
              </h2>

              {categoryExpenses.length === 0 ? (
                <p className="text-xs text-zinc-500 py-4 text-center">
                  Nenhuma despesa para categorizar neste mês.
                </p>
              ) : (
                <div className="space-y-3">
                  {categoryExpenses.map(([catName, amount]) => {
                    const percent = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
                    return (
                      <div key={catName} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-zinc-300">{catName}</span>
                          <span className="font-bold text-zinc-200">
                            {formatCurrency(amount)} ({percent.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-rose-500 h-full rounded-full transition-all"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Card Educativo / Dica de Ouro */}
            <div className="bg-gradient-to-br from-emerald-950/40 to-zinc-900 border border-emerald-500/20 rounded-2xl p-5 relative">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-2">
                <Sparkles size={16} />
                Dica de Saúde Financeira
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Priorize pagar as parcelas dos seus empréstimos e criar uma reserva de emergência com o saldo positivo. Evite comprometer mais de 30% da sua renda com dívidas.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RECEITAS & SALÁRIO */}
      {activeTab === 'incomes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Minhas Receitas & Salários</h2>
            <button
              onClick={() => {
                setTxType('income');
                setTxCategory('salario');
                setIsTransactionModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-xl text-xs font-semibold"
            >
              <Plus size={14} /> Nova Receita
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {monthTransactions
              .filter((tx) => tx.type === 'income')
              .map((tx) => (
                <div
                  key={tx.id}
                  className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                      <Briefcase size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{tx.title}</p>
                      <p className="text-xs text-zinc-500">
                        {FINANCIAL_CATEGORY_LABELS[tx.category] || tx.category} • {formatDate(tx.date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-base font-extrabold text-emerald-400">
                      +{formatCurrency(tx.amount)}
                    </span>
                    <button
                      onClick={() => deleteFinancialTransaction(tx.id)}
                      className="text-zinc-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}

            {monthTransactions.filter((tx) => tx.type === 'income').length === 0 && (
              <div className="col-span-full py-8 text-center text-zinc-500 text-xs">
                Nenhuma receita cadastrada neste mês. Cadastre seu salário ou renda extra.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: GASTOS FIXOS & DIÁRIOS */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Meus Gastos & Despesas</h2>
            <button
              onClick={() => {
                setTxType('expense');
                setTxCategory('alimentacao');
                setIsTransactionModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 text-white rounded-xl text-xs font-semibold"
            >
              <Plus size={14} /> Nova Despesa
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {monthTransactions
              .filter((tx) => tx.type === 'expense')
              .map((tx) => (
                <div
                  key={tx.id}
                  className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400">
                      <ArrowDownRight size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{tx.title}</p>
                      <p className="text-xs text-zinc-500">
                        {FINANCIAL_CATEGORY_LABELS[tx.category] || tx.category} • {formatDate(tx.date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-base font-extrabold text-rose-400">
                      -{formatCurrency(tx.amount)}
                    </span>
                    <button
                      onClick={() => deleteFinancialTransaction(tx.id)}
                      className="text-zinc-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}

            {monthTransactions.filter((tx) => tx.type === 'expense').length === 0 && (
              <div className="col-span-full py-8 text-center text-zinc-500 text-xs">
                Nenhum gasto registrado neste mês.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: EMPRÉSTIMOS & DÍVIDAS */}
      {activeTab === 'debts' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Dívidas & Empréstimos Parcelados</h2>
              <p className="text-xs text-zinc-400">
                Acompanhe o pagamento de parcelas de empréstimos, consignados ou financiamentos.
              </p>
            </div>
            <button
              onClick={() => setIsDebtModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold"
            >
              <Plus size={14} /> Cadastrar Empréstimo
            </button>
          </div>

          {financialDebts.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
              <Building2 size={40} className="mx-auto text-zinc-600 mb-2" />
              <p className="text-sm font-semibold text-white">Nenhuma dívida ou empréstimo cadastrado.</p>
              <p className="text-xs text-zinc-500 mt-1">
                Cadastre seus empréstimos parcelados para acompanhar o saldo devedor e dar baixa nas parcelas.
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
                  <div key={debt.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
                    {/* Header do Empréstimo */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white">{debt.title}</h3>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-medium border border-purple-500/20">
                            {debt.creditor}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          Vencimento todo dia <strong className="text-zinc-300">{debt.dueDay}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-zinc-400">Total: {formatCurrency(debt.totalAmount)}</p>
                          <p className="text-xs font-bold text-purple-400">
                            Restante: {formatCurrency(remainingAmount)}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteFinancialDebt(debt.id)}
                          className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                          title="Excluir Empréstimo"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Progresso de Pagamento */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-zinc-400 font-medium">
                        <span>
                          Progresso ({paidParcelsCount}/{debt.installmentsCount} parcelas pagas)
                        </span>
                        <span>{progressPercent.toFixed(0)}% concluído</span>
                      </div>
                      <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-purple-500 h-full rounded-full transition-all"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Lista de Parcelas com Ação de Dar Baixa */}
                    <div className="space-y-2 pt-2">
                      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        Parcelas do Empréstimo
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {debt.parcels.map((parcel) => (
                          <div
                            key={parcel.id}
                            className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-all ${
                              parcel.paid
                                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                                : 'bg-zinc-800/40 border-zinc-800 text-zinc-300'
                            }`}
                          >
                            <div>
                              <p className="font-bold">
                                Parcela {parcel.number}/{debt.installmentsCount}
                              </p>
                              <p className="text-[11px] text-zinc-500">
                                Vence: {formatDate(parcel.dueDate)}
                              </p>
                              <p className="font-semibold mt-0.5">{formatCurrency(parcel.amount)}</p>
                            </div>

                            <button
                              onClick={() => toggleDebtParcelPayment(debt.id, parcel.id)}
                              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-semibold transition-all ${
                                parcel.paid
                                  ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                  : 'bg-purple-600 hover:bg-purple-700 text-white'
                              }`}
                            >
                              {parcel.paid ? (
                                <>
                                  <CheckCircle2 size={14} /> Paga
                                </>
                              ) : (
                                'Pagar Parcela'
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

      {/* ─── MODAL: NOVA TRANSAÇÃO (RECEITA / GASTO) ───────────────────────────── */}
      {isTransactionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsTransactionModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X size={20} />
            </button>

            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="text-emerald-400" size={20} />
              Lançar Movimentação Financeira
            </h2>

            <form onSubmit={handleSaveTransaction} className="space-y-4">
              {/* Tipo */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-800/60 rounded-xl">
                <button
                  type="button"
                  onClick={() => setTxType('income')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    txType === 'income'
                      ? 'bg-emerald-500 text-white shadow'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  + Receita / Salário
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('expense')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    txType === 'expense'
                      ? 'bg-rose-500 text-white shadow'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  - Gasto / Despesa
                </button>
              </div>

              {/* Título */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Título / Descrição</label>
                <input
                  type="text"
                  required
                  placeholder={txType === 'income' ? 'Ex: Salário Mensal, Renda Extra Bico' : 'Ex: Aluguel, Mercado, Lanche'}
                  value={txTitle}
                  onChange={(e) => setTxTitle(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Valor & Categoria */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Categoria</label>
                  <select
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value as FinancialCategory)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    {Object.entries(FINANCIAL_CATEGORY_LABELS).map(([catKey, catLabel]) => (
                      <option key={catKey} value={catKey}>
                        {catLabel}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Data & Recorrente */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Data</label>
                  <input
                    type="date"
                    required
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={txIsRecurring}
                      onChange={(e) => setTxIsRecurring(e.target.checked)}
                      className="rounded bg-zinc-800 border-zinc-700 text-emerald-500 focus:ring-emerald-500"
                    />
                    Repete todo mês
                  </label>
                </div>
              </div>

              {/* Botões */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTransactionModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                >
                  Salvar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: NOVO EMPRÉSTIMO / DÍVIDA PARCELADA ─────────────────────────── */}
      {isDebtModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsDebtModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X size={20} />
            </button>

            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CreditCard className="text-purple-400" size={20} />
              Cadastrar Empréstimo ou Dívida
            </h2>

            <form onSubmit={handleSaveDebt} className="space-y-4">
              {/* Título & Credor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Nome do Empréstimo/Dívida
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Empréstimo Consignado"
                    value={debtTitle}
                    onChange={(e) => setDebtTitle(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Banco / Credor
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Banco Nubank, Caixa, Amigo"
                    value={debtCreditor}
                    onChange={(e) => setDebtCreditor(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Valor Total & Qtd Parcelas */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Valor Total (R$)
                  </label>
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
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Nº de Parcelas
                  </label>
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
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Valor Parcela (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={debtInstallmentValue}
                    onChange={(e) => setDebtInstallmentValue(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Vencimento & Primeira Parcela */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Dia Vencimento Mensal (1-31)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={debtDueDay}
                    onChange={(e) => setDebtDueDay(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    1ª Parcela Vence Em
                  </label>
                  <input
                    type="date"
                    required
                    value={debtFirstDueDate}
                    onChange={(e) => setDebtFirstDueDate(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Observações</label>
                <textarea
                  rows={2}
                  placeholder="Anotações adicionais sobre taxas ou garantias..."
                  value={debtNotes}
                  onChange={(e) => setDebtNotes(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Botões */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDebtModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/20"
                >
                  Salvar Empréstimo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
