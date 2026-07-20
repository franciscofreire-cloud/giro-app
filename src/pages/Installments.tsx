import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { TopBar } from '@/components/layout/TopBar';
import { InstallmentPurchase, Item, STATUS_LABELS } from '@/types';
import { formatBRL, generateId } from '@/lib/utils';
import {
  CreditCard,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  Trash2,
  ChevronRight,
  Package,
  X,
  AlertCircle,
  TrendingDown,
  DollarSign
} from 'lucide-react';
import { StatusBadge } from '@/components/shared/Badge';


export function Installments() {
  const items = useStore((s) => s.items);
  const installmentPurchases = useStore((s) => s.installmentPurchases);
  const addInstallmentPurchase = useStore((s) => s.addInstallmentPurchase);
  const deleteInstallmentPurchase = useStore((s) => s.deleteInstallmentPurchase);
  const toggleInstallmentPayment = useStore((s) => s.toggleInstallmentPayment);

  // States
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<InstallmentPurchase | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // New Purchase Form State
  const [selectedItemId, setSelectedItemId] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [installmentsCount, setInstallmentsCount] = useState('6');
  const [dueDay, setDueDay] = useState('10');
  const [firstDueDate, setFirstDueDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Compute Metrics
  let totalRemainingDebt = 0;
  let totalPaidAmount = 0;
  let nextDueDate: string | null = null;
  let nextDueAmount = 0;

  installmentPurchases.forEach((p) => {
    p.payments.forEach((pmt) => {
      if (pmt.paid) {
        totalPaidAmount += pmt.amount;
      } else {
        totalRemainingDebt += pmt.amount;
        if (!nextDueDate || pmt.dueDate < nextDueDate) {
          nextDueDate = pmt.dueDate;
          nextDueAmount = pmt.amount;
        }
      }
    });
  });

  // Filtered List
  const filteredList = installmentPurchases.filter((p) => {
    const matchesSearch =
      p.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.itemCategory.toLowerCase().includes(searchTerm.toLowerCase());

    const isCompleted = p.payments.every((pmt) => pmt.paid);
    if (filterStatus === 'pending' && isCompleted) return false;
    if (filterStatus === 'completed' && !isCompleted) return false;

    return matchesSearch;
  });

  // Handle item selection in new purchase form
  function handleSelectExistingItem(itemId: string) {
    setSelectedItemId(itemId);
    const item = items.find((i) => i.id === itemId);
    if (item) {
      setTotalPrice(String(item.purchasePrice || ''));
    }
  }

  // Handle Create Purchase
  async function handleCreatePurchase(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    if (!selectedItemId) {
      setFormError('Por favor, selecione um item da lista.');
      return;
    }

    const item = items.find((i) => i.id === selectedItemId);
    if (!item) {
      setFormError('Item selecionado não encontrado.');
      return;
    }

    const total = parseFloat(totalPrice);
    const count = parseInt(installmentsCount, 10);
    const day = parseInt(dueDay, 10);

    if (isNaN(total) || total <= 0) {
      setFormError('Informe um valor total válido.');
      return;
    }

    if (isNaN(count) || count < 1) {
      setFormError('Quantidade de parcelas deve ser pelo menos 1.');
      return;
    }

    if (isNaN(day) || day < 1 || day > 31) {
      setFormError('Dia do vencimento deve ser entre 1 e 31.');
      return;
    }

    const installmentValue = Math.round((total / count) * 100) / 100;

    // Generate monthly payments
    const payments = [];
    const startDate = new Date(firstDueDate + 'T00:00:00');

    for (let i = 1; i <= count; i++) {
      const pDate = new Date(startDate);
      pDate.setMonth(startDate.getMonth() + (i - 1));

      // Adjust for months with fewer days if needed
      const year = pDate.getFullYear();
      const month = String(pDate.getMonth() + 1).padStart(2, '0');
      const formattedDay = String(Math.min(day, 28)).padStart(2, '0');

      const dueDateStr = `${year}-${month}-${formattedDay}`;

      payments.push({
        id: generateId(),
        number: i,
        dueDate: dueDateStr,
        amount: i === count ? total - installmentValue * (count - 1) : installmentValue, // Adjust rounding on last
        paid: false,
      });
    }

    const newPurchase: InstallmentPurchase = {
      id: generateId(),
      itemId: item.id,
      itemName: item.name,
      itemCategory: item.category,
      itemPhotoUrl: item.photoUrl,
      itemStatus: item.status,
      totalPrice: total,
      installmentsCount: count,
      installmentValue,
      dueDay: day,
      firstDueDate,
      notes,
      createdAt: new Date().toISOString(),
      payments,
    };

    await addInstallmentPurchase(newPurchase);

    // Reset Form
    setShowAddModal(false);
    setSelectedItemId('');
    setTotalPrice('');
    setInstallmentsCount('6');
    setDueDay('10');
    setNotes('');
  }

  function handleDelete(id: string) {
    if (confirm('Tem certeza que deseja excluir este parcelamento?')) {
      deleteInstallmentPurchase(id);
      if (selectedPurchase?.id === id) {
        setSelectedPurchase(null);
      }
    }
  }

  return (
    <div className="flex flex-col min-h-full pb-24 md:pb-8">
      <TopBar
        title="Itens Parcelados"
        subtitle="Controle de compras em parcelas"
        right={
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          >
            <Plus size={16} />
            <span>Novo Parcelamento</span>
          </button>
        }
      />

      <div className="px-4 md:px-8 py-4 space-y-5 max-w-5xl mx-auto w-full">
        {/* Metric Cards Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Debt Summary */}
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-400">Total a Pagar</span>
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                <TrendingDown size={16} />
              </div>
            </div>
            <p className="text-2xl font-bold text-white tabular-nums">
              {formatBRL(totalRemainingDebt)}
            </p>
            <p className="text-[11px] text-zinc-500 mt-1">Dívida pendente em parcelas</p>
          </div>

          {/* Paid Summary */}
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-400">Total Já Quitado</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <p className="text-2xl font-bold text-emerald-400 tabular-nums">
              {formatBRL(totalPaidAmount)}
            </p>
            <p className="text-[11px] text-zinc-500 mt-1">Parcelas já pagas com sucesso</p>
          </div>

          {/* Next Due Date */}
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-400">Próximo Vencimento</span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Clock size={16} />
              </div>
            </div>
            <p className="text-2xl font-bold text-white tabular-nums">
              {nextDueDate ? formatBRL(nextDueAmount) : 'Nenhum'}
            </p>
            <p className="text-[11px] text-zinc-500 mt-1">
              {nextDueDate
                ? `Vence em ${new Date(nextDueDate + 'T00:00:00').toLocaleDateString('pt-BR')}`
                : 'Todas as parcelas estão em dia'}
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar item parcelado..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-full sm:w-auto">
            {(['all', 'pending', 'completed'] as const).map((st) => {
              const labels = { all: 'Todos', pending: 'Em Aberto', completed: 'Concluídos' };
              const active = filterStatus === st;
              return (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    active ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {labels[st]}
                </button>
              );
            })}
          </div>
        </div>

        {/* List of Installments */}
        {filteredList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-zinc-900/40 rounded-3xl border border-zinc-800/60 p-6">
            <div className="w-14 h-14 rounded-2xl bg-zinc-800 text-zinc-500 flex items-center justify-center mb-3">
              <CreditCard size={28} />
            </div>
            <p className="text-base font-bold text-white">Nenhum item parcelado encontrado</p>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm">
              Você ainda não vinculou compras parceladas aos seus itens cadastrados. Clique no botão abaixo para adicionar.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold shadow-lg shadow-emerald-500/20"
            >
              <Plus size={16} />
              <span>Cadastrar Primeiro Parcelamento</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredList.map((p) => {
              const paidCount = p.payments.filter((pmt) => pmt.paid).length;
              const percent = Math.round((paidCount / p.installmentsCount) * 100);
              const isCompleted = paidCount === p.installmentsCount;

              // Find current item status in state
              const liveItem = items.find((i) => i.id === p.itemId);
              const currentStatus = liveItem ? liveItem.status : p.itemStatus;

              return (
                <div
                  key={p.id}
                  className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 space-y-3 hover:border-zinc-700 transition-colors relative"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {p.itemPhotoUrl ? (
                        <img
                          src={p.itemPhotoUrl}
                          alt={p.itemName}
                          className="w-12 h-12 rounded-xl object-cover border border-zinc-800 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-zinc-800 text-zinc-400 flex items-center justify-center shrink-0">
                          <Package size={20} />
                        </div>
                      )}
                      <div>
                        <h4 className="text-sm font-bold text-white line-clamp-1">{p.itemName}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-zinc-500">{p.itemCategory}</span>
                          <span className="text-[10px] text-zinc-600">•</span>
                          <StatusBadge status={currentStatus} />
                        </div>

                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-zinc-600 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                      title="Excluir parcelamento"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Financial & Progress Info */}
                  <div className="bg-zinc-950/60 rounded-xl p-3 border border-zinc-800/80 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400">Valor Total:</span>
                      <span className="font-bold text-white">{formatBRL(p.totalPrice)}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400">Parcelas:</span>
                      <span className="font-semibold text-emerald-400">
                        {p.installmentsCount}x de {formatBRL(p.installmentValue)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-zinc-500">
                      <span>Vencimento mensal:</span>
                      <span>Todo dia <strong>{p.dueDay}</strong></span>
                    </div>

                    {/* Progress Bar */}
                    <div className="pt-1 space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-zinc-400 font-medium">
                          {paidCount} de {p.installmentsCount} pagas
                        </span>
                        <span className={isCompleted ? 'text-emerald-400 font-bold' : 'text-zinc-400'}>
                          {percent}%
                        </span>
                      </div>
                      <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isCompleted ? 'bg-emerald-500' : 'bg-emerald-500/70'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Button to Open Payment Modal */}
                  <button
                    onClick={() => setSelectedPurchase(p)}
                    className="w-full py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-emerald-400" />
                      <span>Gerenciar Parcelas & Baixas</span>
                    </div>
                    <ChevronRight size={14} className="text-zinc-400" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Novo Parcelamento */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="text-emerald-400" size={20} />
                <h3 className="text-base font-bold text-white">Cadastrar Item Parcelado</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="mb-4 flex items-start gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-rose-400 text-xs">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <p>{formError}</p>
              </div>
            )}

            <form onSubmit={handleCreatePurchase} className="space-y-4">
              {/* Select Existing Item */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">
                  Selecione o Item do Sistema
                </label>
                <select
                  value={selectedItemId}
                  onChange={(e) => handleSelectExistingItem(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/60"
                  required
                >
                  <option value="">-- Escolha um item cadastrado --</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({STATUS_LABELS[item.status]}) — Valor Compra: R$ {item.purchasePrice}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-zinc-500">
                  Puxa itens em estoque, vendidos, reservados ou aguardando entrega.
                </p>
              </div>

              {/* Price & Installments grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Valor Total (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={totalPrice}
                    onChange={(e) => setTotalPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/60"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Qtd de Parcelas</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={installmentsCount}
                    onChange={(e) => setInstallmentsCount(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/60"
                    required
                  />
                </div>
              </div>

              {/* Due day & First Due Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Dia de Vencimento</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    placeholder="Ex: 10"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/60"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Data 1ª Parcela</label>
                  <input
                    type="date"
                    value={firstDueDate}
                    onChange={(e) => setFirstDueDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/60"
                    required
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Observações (opcional)</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Cartão de crédito Nubank, comprado em 10x sem juros..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/60"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold shadow-lg shadow-emerald-500/20"
                >
                  Salvar Parcelamento
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs font-medium"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Gerenciar Parcelas / Dar Baixa */}
      {selectedPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl relative animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-white">{selectedPurchase.itemName}</h3>
                <p className="text-xs text-zinc-400">
                  {selectedPurchase.installmentsCount}x de {formatBRL(selectedPurchase.installmentValue)} • Total {formatBRL(selectedPurchase.totalPrice)}
                </p>
              </div>
              <button
                onClick={() => setSelectedPurchase(null)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Installments List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {selectedPurchase.payments.map((pmt) => {
                return (
                  <div
                    key={pmt.id}
                    onClick={() => toggleInstallmentPayment(selectedPurchase.id, pmt.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                      pmt.paid
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                        : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                          pmt.paid ? 'bg-emerald-500 text-white' : 'border border-zinc-700 text-transparent'
                        }`}
                      >
                        <CheckCircle2 size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold">
                          Parcela {pmt.number} de {selectedPurchase.installmentsCount}
                        </p>
                        <p className="text-[10px] text-zinc-500">
                          Vencimento: {new Date(pmt.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                          {pmt.paidDate && ` • Pago em ${new Date(pmt.paidDate + 'T00:00:00').toLocaleDateString('pt-BR')}`}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-bold tabular-nums">{formatBRL(pmt.amount)}</p>
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                          pmt.paid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {pmt.paid ? 'Paga' : 'Pendente'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-zinc-800 pt-4 mt-4 flex justify-end">
              <button
                onClick={() => setSelectedPurchase(null)}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold"
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
