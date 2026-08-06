import React, { useEffect, useMemo, useState } from 'react';
import { X, Trash2, Store } from 'lucide-react';
import { CATEGORY_META, PAYMENT_TYPES, getCategoryMeta } from '../../constants/categories';
import { toExpenseCategory, toExpenseSubcategory, todayISO, nowTime } from '../../utils/transactions';
import type { ExpenseCategory, ExpenseDraft, LedgerEntry, PaymentType } from '../../types';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (draft: ExpenseDraft) => void;
  onDelete?: (id: string) => void;
  initialEntry: LedgerEntry | null;
  /** Vendors already used in this household, offered as autocomplete. */
  vendors: string[];
  /** Household members, so an entry can be attributed to whoever paid. */
  members: string[];
  currentUser: string;
  /** Preselected category when opened from a quick-add tile. */
  presetCategory?: ExpenseCategory;
}

const emptyDraft = (currentUser: string, category: ExpenseCategory = 'Grocery'): ExpenseDraft => ({
  date: todayISO(),
  time: nowTime(),
  amount: 0,
  vendor: '',
  notes: '',
  category,
  subcategory: '',
  paymentType: 'Credit Card',
  user: currentUser,
  isTaxDeductible: false
});

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialEntry,
  vendors,
  members,
  currentUser,
  presetCategory
}) => {
  const [draft, setDraft] = useState<ExpenseDraft>(() => emptyDraft(currentUser));
  const [amountText, setAmountText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (initialEntry) {
      const category = toExpenseCategory(initialEntry.label);
      setDraft({
        id: initialEntry.id,
        date: initialEntry.date,
        time: initialEntry.time || nowTime(),
        amount: initialEntry.amount,
        vendor: initialEntry.vendor,
        notes: initialEntry.notes || '',
        category,
        subcategory: toExpenseSubcategory(category, initialEntry.detail),
        paymentType: initialEntry.paymentType,
        user: initialEntry.user || currentUser,
        isTaxDeductible: initialEntry.isTaxDeductible ?? false
      });
      setAmountText(initialEntry.amount ? String(initialEntry.amount) : '');
    } else {
      setDraft(emptyDraft(currentUser, presetCategory));
      setAmountText('');
    }
    setError('');
  }, [isOpen, initialEntry, currentUser, presetCategory]);

  const memberOptions = useMemo(() => {
    const all = [currentUser, ...members, draft.user].filter(Boolean);
    return Array.from(new Set(all));
  }, [members, currentUser, draft.user]);

  if (!isOpen) return null;

  const activeMeta = getCategoryMeta(draft.category);

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountText);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter an amount greater than zero.');
      return;
    }
    if (!draft.vendor.trim()) {
      setError('Enter the store, restaurant or shop.');
      return;
    }
    onSave({ ...draft, amount: Math.round(amount * 100) / 100, vendor: draft.vendor.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-0 sm:p-4 no-print">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] flex flex-col">

        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900">
            {initialEntry ? 'Edit expense' : 'New expense'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

          {/* Amount */}
          <div>
            <label className="field-label" htmlFor="amount">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">$</span>
              <input
                id="amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                autoFocus
                value={amountText}
                onChange={e => setAmountText(e.target.value)}
                placeholder="0.00"
                className="field tabular text-3xl font-bold py-3 pl-10"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <span className="field-label">Category</span>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_META.map(({ id, icon: Icon, color }) => {
                const isActive = draft.category === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setDraft(d => ({ ...d, category: id as ExpenseCategory, subcategory: '' }))}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      isActive
                        ? 'text-white border-transparent'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                    style={isActive ? { backgroundColor: color } : undefined}
                  >
                    <Icon className="w-3.5 h-3.5" style={isActive ? undefined : { color }} />
                    {id}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-slate-400">{activeMeta.hint}</p>
          </div>

          {/* Subcategory — optional; tapping the active one clears it */}
          {activeMeta.subcategories.length > 0 && (
            <div>
              <span className="field-label">
                Subcategory <span className="font-normal normal-case text-slate-400">· optional</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activeMeta.subcategories.map(sub => {
                  const isActive = draft.subcategory === sub;
                  return (
                    <button
                      key={sub}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => setDraft(d => ({ ...d, subcategory: isActive ? '' : sub }))}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        isActive
                          ? 'text-white border-transparent'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                      style={isActive ? { backgroundColor: activeMeta.color } : undefined}
                    >
                      {sub}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Vendor */}
          <div>
            <label className="field-label" htmlFor="vendor">Store, restaurant or shop</label>
            <div className="relative">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="vendor"
                list="vendor-suggestions"
                value={draft.vendor}
                onChange={e => setDraft(d => ({ ...d, vendor: e.target.value }))}
                placeholder="e.g. Costco, Pho Saigon, Amazon"
                className="field pl-9"
              />
            </div>
            <datalist id="vendor-suggestions">
              {vendors.map(v => <option key={v} value={v} />)}
            </datalist>
          </div>

          {/* Date & time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label" htmlFor="date">Date</label>
              <input
                id="date"
                type="date"
                value={draft.date}
                onChange={e => setDraft(d => ({ ...d, date: e.target.value }))}
                className="field"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="time">Time</label>
              <input
                id="time"
                type="time"
                value={draft.time}
                onChange={e => setDraft(d => ({ ...d, time: e.target.value }))}
                className="field"
              />
            </div>
          </div>

          {/* Payment & member */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label" htmlFor="payment">Payment</label>
              <select
                id="payment"
                value={draft.paymentType}
                onChange={e => setDraft(d => ({ ...d, paymentType: e.target.value as PaymentType }))}
                className="field"
              >
                {PAYMENT_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="member">Paid by</label>
              <select
                id="member"
                value={draft.user}
                onChange={e => setDraft(d => ({ ...d, user: e.target.value }))}
                className="field"
              >
                {memberOptions.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="field-label" htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              rows={2}
              value={draft.notes}
              onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))}
              placeholder="Optional — what was it for?"
              className="field resize-none"
            />
          </div>

          <label className="flex items-center gap-2.5 text-sm text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={draft.isTaxDeductible}
              onChange={e => setDraft(d => ({ ...d, isTaxDeductible: e.target.checked }))}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            Tax deductible
          </label>

          {error && (
            <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </form>

        <div className="flex items-center gap-2 px-5 py-4 border-t border-slate-200">
          {initialEntry && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(initialEntry.id)}
              className="p-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
              aria-label="Delete expense"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-sm shadow-indigo-600/20 transition-colors"
          >
            {initialEntry ? 'Save changes' : 'Add expense'}
          </button>
        </div>
      </div>
    </div>
  );
};
