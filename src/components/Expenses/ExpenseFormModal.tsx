import React, { useEffect, useMemo, useState } from 'react';
import { X, Trash2, Store, Settings2, Plane, Plus, Building2, UsersRound } from 'lucide-react';
import {
  PAYMENT_TYPES as DEFAULT_PAYMENT_TYPES,
  TARGET_META,
  getCategoryMeta,
  getEffectiveCategories
} from '../../constants/categories';
import { toExpenseCategory, toExpenseSubcategory, todayISO, nowTime } from '../../utils/transactions';
import type {
  AssociableHome,
  AssociableVehicle,
  AssociationTarget,
  ExpenseDraft,
  ExpenseTarget,
  FamilyMember,
  LedgerEntry,
  Office,
  PaymentType,
  PaymentTypeItem,
  TaxonomyOverrideDoc,
  Trip
} from '../../types';

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
  presetCategory?: string;
  presetTarget?: ExpenseTarget;
  /** Custom household payment types. */
  paymentTypes?: PaymentTypeItem[];
  /** Callback to open payment types management modal. */
  onManagePaymentTypes?: () => void;
  trips?: Trip[];
  offices?: Office[];
  familyMembers?: FamilyMember[];
  onSaveTrip?: (trip: Trip) => Promise<void> | void;
  onSaveOffice?: (office: Office) => Promise<void> | void;
  onSaveFamilyMember?: (member: FamilyMember) => Promise<void> | void;
  taxonomyOverrideDoc?: TaxonomyOverrideDoc;
  onManageTaxonomy?: () => void;
  /** Vehicles/homes from sibling apps for the "move to" picker. */
  vehicles?: AssociableVehicle[];
  homes?: AssociableHome[];
  defaultVehicleId?: string;
  defaultHomeId?: string;
  /** Associates the currently-open entry with a car or home. */
  onAssociate?: (target: AssociationTarget) => void;
}

const emptyDraft = (
  currentUser: string,
  defaultPayment: string = 'Cash',
  target: ExpenseTarget = 'Family',
  category: string = 'Food & Groceries'
): ExpenseDraft => ({
  date: todayISO(),
  time: nowTime(),
  amount: 0,
  vendor: '',
  notes: '',
  target,
  targetEntityId: undefined,
  targetEntityLabel: undefined,
  category,
  subcategory: '',
  paymentType: defaultPayment,
  user: currentUser,
  isTaxDeductible: target === 'Business'
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
  presetCategory,
  presetTarget,
  paymentTypes = [],
  onManagePaymentTypes,
  trips = [],
  offices = [],
  familyMembers = [],
  onSaveTrip,
  onSaveOffice,
  onSaveFamilyMember,
  taxonomyOverrideDoc,
  onManageTaxonomy,
  vehicles = [],
  homes = [],
  defaultVehicleId,
  defaultHomeId,
  onAssociate
}) => {
  const availablePaymentTypes = useMemo(() => {
    const rawNames = paymentTypes.length > 0 ? paymentTypes.map(p => p.name) : DEFAULT_PAYMENT_TYPES;
    const withoutCash = rawNames.filter(n => n.toLowerCase() !== 'cash');
    return ['Cash', ...Array.from(new Set(withoutCash))];
  }, [paymentTypes]);

  const defaultPaymentType = availablePaymentTypes[0] || 'Cash';
  const [draft, setDraft] = useState<ExpenseDraft>(() => emptyDraft(currentUser, defaultPaymentType, presetTarget || 'Family'));
  const [amountText, setAmountText] = useState('');
  const [error, setError] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedHomeId, setSelectedHomeId] = useState('');
  const [newEntityPrompt, setNewEntityPrompt] = useState<'trip' | 'office' | 'familyMember' | null>(null);
  const [newEntityName, setNewEntityName] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setSelectedVehicleId(defaultVehicleId || vehicles[0]?.id || '');
    setSelectedHomeId(defaultHomeId || homes[0]?.id || '');
  }, [isOpen, defaultVehicleId, defaultHomeId, vehicles, homes]);

  useEffect(() => {
    if (!isOpen) return;
    if (initialEntry) {
      let target: ExpenseTarget = 'Family';
      if (initialEntry.target === 'Travel' || initialEntry.source === 'Travel') target = 'Travel';
      else if (initialEntry.target === 'Business' || initialEntry.source === 'Business') target = 'Business';

      const category = toExpenseCategory(initialEntry.label, target);
      setDraft({
        id: initialEntry.id,
        date: initialEntry.date,
        time: initialEntry.time || nowTime(),
        amount: initialEntry.amount,
        vendor: initialEntry.vendor,
        notes: initialEntry.notes || '',
        target,
        targetEntityId: initialEntry.targetEntityId,
        targetEntityLabel: initialEntry.targetEntityLabel,
        category: category || (target === 'Travel' ? 'Transportation' : target === 'Business' ? 'Office & Supplies' : 'Food & Groceries'),
        subcategory: toExpenseSubcategory(target, category, initialEntry.detail),
        paymentType: initialEntry.paymentType,
        user: initialEntry.user || currentUser,
        isTaxDeductible: initialEntry.isTaxDeductible ?? (target === 'Business')
      });
      setAmountText(initialEntry.amount ? String(initialEntry.amount) : '');
    } else {
      const target = presetTarget || 'Family';
      const defaultCat = presetCategory || (target === 'Travel' ? 'Transportation' : target === 'Business' ? 'Office & Supplies' : 'Food & Groceries');
      setDraft(emptyDraft(currentUser, defaultPaymentType, target, defaultCat));
      setAmountText('');
    }
    setError('');
    setNewEntityPrompt(null);
    setNewEntityName('');
  }, [isOpen, initialEntry, currentUser, presetCategory, presetTarget, defaultPaymentType]);

  const memberOptions = useMemo(() => {
    const all = [currentUser, ...members, draft.user].filter(Boolean);
    return Array.from(new Set(all));
  }, [members, currentUser, draft.user]);

  if (!isOpen) return null;

  const currentCategories = getEffectiveCategories(draft.target, taxonomyOverrideDoc);
  const activeMeta = getCategoryMeta(draft.category, draft.target, taxonomyOverrideDoc);
  const isRefund = amountText.trim().startsWith('-');

  const handleTargetChange = (newTarget: ExpenseTarget) => {
    const targetCats = getEffectiveCategories(newTarget, taxonomyOverrideDoc);
    const defaultCat = targetCats[0]?.id || 'Other';
    setDraft(d => ({
      ...d,
      target: newTarget,
      category: defaultCat,
      subcategory: '',
      targetEntityId: undefined,
      targetEntityLabel: undefined,
      isTaxDeductible: newTarget === 'Business' ? true : d.isTaxDeductible
    }));
  };

  const handleCreateQuickEntity = async () => {
    if (!newEntityName.trim()) return;
    const name = newEntityName.trim();
    if (newEntityPrompt === 'trip') {
      const newTrip: Trip = {
        id: `trip-${Date.now()}`,
        name,
        startDate: todayISO(),
        destinations: []
      };
      if (onSaveTrip) await onSaveTrip(newTrip);
      setDraft(d => ({ ...d, targetEntityId: newTrip.id, targetEntityLabel: newTrip.name }));
    } else if (newEntityPrompt === 'office') {
      const newOffice: Office = {
        id: `office-${Date.now()}`,
        name,
        officeType: 'General Workspace'
      };
      if (onSaveOffice) await onSaveOffice(newOffice);
      setDraft(d => ({ ...d, targetEntityId: newOffice.id, targetEntityLabel: newOffice.name }));
    } else if (newEntityPrompt === 'familyMember') {
      const newMember: FamilyMember = {
        id: `fm-${Date.now()}`,
        name
      };
      if (onSaveFamilyMember) await onSaveFamilyMember(newMember);
      setDraft(d => ({ ...d, targetEntityId: newMember.id, targetEntityLabel: newMember.name }));
    }
    setNewEntityPrompt(null);
    setNewEntityName('');
  };

  const toggleRefund = () => {
    setAmountText(text => {
      const trimmed = text.trim();
      if (trimmed === '-') return '';
      if (trimmed.startsWith('-')) return trimmed.slice(1);
      return trimmed ? `-${trimmed}` : '-';
    });
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountText);
    if (!Number.isFinite(amount) || amount === 0) {
      setError('Enter an amount other than zero.');
      return;
    }
    if (!draft.vendor.trim()) {
      setError('Enter the store, restaurant or merchant.');
      return;
    }
    onSave({ ...draft, amount: Math.round(amount * 100) / 100, vendor: draft.vendor.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-0 sm:p-4 no-print">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900">
            {initialEntry ? 'Edit transaction' : 'New transaction'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

          {/* Domain Target Selector Pills */}
          <div>
            <span className="field-label">Transaction Domain</span>
            <div className="grid grid-cols-3 gap-2">
              {(['Family', 'Travel', 'Business'] as ExpenseTarget[]).map(t => {
                const meta = TARGET_META[t];
                const Icon = meta.icon;
                const isActive = draft.target === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleTargetChange(t)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                      isActive
                        ? `${meta.badgeBg} ${meta.badgeBorder} border-2 shadow-sm`
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{t}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-[11px] text-slate-400">{TARGET_META[draft.target].description}</p>
          </div>

          {/* Entity Association for Family (Members), Travel (Trips) or Business (Offices) */}
          {draft.target === 'Family' && (
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <UsersRound className="w-3.5 h-3.5 text-emerald-600" />
                  For family member <span className="font-normal text-emerald-600">· optional</span>
                </label>
                <button
                  type="button"
                  onClick={() => setNewEntityPrompt(newEntityPrompt === 'familyMember' ? null : 'familyMember')}
                  className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" /> Add Member
                </button>
              </div>

              {newEntityPrompt === 'familyMember' ? (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newEntityName}
                    onChange={e => setNewEntityName(e.target.value)}
                    placeholder="e.g. Sarah or Mom"
                    className="field flex-1 text-xs py-1.5 bg-white"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleCreateQuickEntity}
                    className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewEntityPrompt(null)}
                    className="px-2 py-1.5 text-slate-500 text-xs font-medium"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <select
                  value={draft.targetEntityId || ''}
                  onChange={e => {
                    const id = e.target.value;
                    const member = familyMembers.find(m => m.id === id);
                    setDraft(d => ({
                      ...d,
                      targetEntityId: id || undefined,
                      targetEntityLabel: member?.name || undefined
                    }));
                  }}
                  className="field text-xs py-1.5 bg-white"
                >
                  <option value="">All (Entire Family)</option>
                  {familyMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {draft.target === 'Travel' && (
            <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                  <Plane className="w-3.5 h-3.5 text-sky-600" />
                  Link to Trip <span className="font-normal text-sky-600">· optional</span>
                </label>
                <button
                  type="button"
                  onClick={() => setNewEntityPrompt(newEntityPrompt === 'trip' ? null : 'trip')}
                  className="text-[11px] font-semibold text-sky-700 hover:text-sky-900 flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" /> New Trip
                </button>
              </div>

              {newEntityPrompt === 'trip' ? (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newEntityName}
                    onChange={e => setNewEntityName(e.target.value)}
                    placeholder="e.g. Summer in Italy"
                    className="field flex-1 text-xs py-1.5 bg-white"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleCreateQuickEntity}
                    className="px-3 py-1.5 bg-sky-600 text-white text-xs font-bold rounded-lg hover:bg-sky-700"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewEntityPrompt(null)}
                    className="px-2 py-1.5 text-slate-500 text-xs font-medium"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <select
                  value={draft.targetEntityId || ''}
                  onChange={e => {
                    const id = e.target.value;
                    const trip = trips.find(t => t.id === id);
                    setDraft(d => ({
                      ...d,
                      targetEntityId: id || undefined,
                      targetEntityLabel: trip?.name || undefined
                    }));
                  }}
                  className="field text-xs py-1.5 bg-white"
                >
                  <option value="">No specific trip (General Travel)</option>
                  {trips.map(t => (
                    <option key={t.id} value={t.id}>{t.name} {t.startDate ? `(${t.startDate})` : ''}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {draft.target === 'Business' && (
            <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  Link to Office / Business <span className="font-normal text-indigo-600">· optional</span>
                </label>
                <button
                  type="button"
                  onClick={() => setNewEntityPrompt(newEntityPrompt === 'office' ? null : 'office')}
                  className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" /> New Office
                </button>
              </div>

              {newEntityPrompt === 'office' ? (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newEntityName}
                    onChange={e => setNewEntityName(e.target.value)}
                    placeholder="e.g. Downtown HQ or Consulting LLC"
                    className="field flex-1 text-xs py-1.5 bg-white"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleCreateQuickEntity}
                    className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewEntityPrompt(null)}
                    className="px-2 py-1.5 text-slate-500 text-xs font-medium"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <select
                  value={draft.targetEntityId || ''}
                  onChange={e => {
                    const id = e.target.value;
                    const office = offices.find(o => o.id === id);
                    setDraft(d => ({
                      ...d,
                      targetEntityId: id || undefined,
                      targetEntityLabel: office?.name || undefined
                    }));
                  }}
                  className="field text-xs py-1.5 bg-white"
                >
                  <option value="">General Business (No specific office)</option>
                  {offices.map(o => (
                    <option key={o.id} value={o.id}>{o.name} {o.officeType ? `· ${o.officeType}` : ''}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Amount & Transaction Type */}
          <div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <label className="field-label mb-0" htmlFor="amount">Amount & Type</label>
              <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
                <button
                  type="button"
                  onClick={() => { if (isRefund) toggleRefund(); }}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                    !isRefund
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Debit (Expense)
                </button>
                <button
                  type="button"
                  onClick={() => { if (!isRefund) toggleRefund(); }}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                    isRefund
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Credit (Refund/Inflow)
                </button>
              </div>
            </div>
            <div className="relative">
              <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold ${
                isRefund ? 'text-emerald-600' : 'text-slate-400'
              }`}>
                {isRefund ? '+$' : '$'}
              </span>
              <input
                id="amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                autoFocus
                value={amountText}
                onChange={e => setAmountText(e.target.value)}
                placeholder="0.00"
                className={`field tabular text-3xl font-bold py-3 pl-12 ${
                  isRefund ? 'text-emerald-700 bg-emerald-50/40 border-emerald-300 focus:border-emerald-500' : ''
                }`}
              />
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              {isRefund
                ? 'Credit mode: logs an incoming refund, reimbursement, or income credit.'
                : 'Debit mode: logs an outgoing expense or payment.'}
            </p>
          </div>

          {/* Category */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="field-label mb-0">{draft.target} Category</span>
              {onManageTaxonomy && (
                <button
                  type="button"
                  onClick={onManageTaxonomy}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <Settings2 className="w-3 h-3" /> Customize Taxonomy
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {currentCategories.map(({ id, name, icon: Icon, color }) => {
                const isActive = draft.category.toLowerCase() === id.toLowerCase() || draft.category.toLowerCase() === name.toLowerCase();
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setDraft(d => ({ ...d, category: id, subcategory: '' }))}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      isActive
                        ? 'text-white border-transparent'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                    style={isActive ? { backgroundColor: color } : undefined}
                  >
                    <Icon className="w-3.5 h-3.5" style={isActive ? undefined : { color }} />
                    {name}
                  </button>
                );
              })}
            </div>
            {activeMeta.hint && <p className="mt-2 text-[11px] text-slate-400">{activeMeta.hint}</p>}
          </div>

          {/* Subcategory — optional; tapping active clears */}
          {activeMeta.subcategories.length > 0 && (
            <div>
              <span className="field-label">
                Subcategory <span className="font-normal normal-case text-slate-400">· optional</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activeMeta.subcategories.map(sub => {
                  const isActive = draft.subcategory.toLowerCase() === sub.toLowerCase();
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
            <label className="field-label" htmlFor="vendor">Merchant, Store or Vendor</label>
            <div className="relative">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="vendor"
                list="vendor-suggestions"
                value={draft.vendor}
                onChange={e => setDraft(d => ({ ...d, vendor: e.target.value }))}
                placeholder="e.g. Delta Air Lines, Hilton, Costco, Amazon, Cursor AI"
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
              <div className="flex items-center justify-between mb-1">
                <label className="field-label !mb-0" htmlFor="payment">Payment</label>
                {onManagePaymentTypes && (
                  <button
                    type="button"
                    onClick={onManagePaymentTypes}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5"
                    title="Manage Payment Types"
                  >
                    <Settings2 className="w-3 h-3" /> Manage
                  </button>
                )}
              </div>
              <select
                id="payment"
                value={draft.paymentType}
                onChange={e => setDraft(d => ({ ...d, paymentType: e.target.value as PaymentType }))}
                className="field"
              >
                {availablePaymentTypes.map(p => <option key={p} value={p}>{p}</option>)}
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
            <span>Tax deductible {draft.target === 'Business' && <span className="text-xs text-indigo-600 font-semibold">(Default for Business)</span>}</span>
          </label>

          {/* Cross-app move to vehicle / home */}
          {initialEntry && (vehicles.length > 0 || homes.length > 0) && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2.5">
              <p className="text-xs font-semibold text-slate-500">Not a general transaction? Move it to:</p>
              {vehicles.length > 0 && (
                <div className="flex items-center gap-2">
                  <select
                    value={selectedVehicleId}
                    onChange={e => setSelectedVehicleId(e.target.value)}
                    className="field flex-1 text-xs py-1.5"
                  >
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.year} {v.make} {v.model}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => onAssociate?.({ app: 'car', vehicleId: selectedVehicleId })}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 whitespace-nowrap"
                  >
                    🚗 Move to Car
                  </button>
                </div>
              )}
              {homes.length > 0 && (
                <div className="flex items-center gap-2">
                  <select
                    value={selectedHomeId}
                    onChange={e => setSelectedHomeId(e.target.value)}
                    className="field flex-1 text-xs py-1.5"
                  >
                    {homes.map(h => (
                      <option key={h.id} value={h.id}>{h.nickname}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => onAssociate?.({ app: 'home', homeId: selectedHomeId })}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 whitespace-nowrap"
                  >
                    🏠 Move to Home
                  </button>
                </div>
              )}
            </div>
          )}

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
              title="Delete transaction"
              aria-label="Delete transaction"
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
            {initialEntry ? 'Save changes' : 'Add transaction'}
          </button>
        </div>
      </div>
    </div>
  );
};
