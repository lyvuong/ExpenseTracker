import React, { useEffect, useMemo, useState } from 'react';
import { X, Trash2, Store, Settings2, Plane, Plus, Building2, UsersRound, Landmark } from 'lucide-react';
import {
  PAYMENT_TYPES as DEFAULT_PAYMENT_TYPES,
  TARGET_META,
  getCategoryMeta,
  getContextCategories,
  getEffectiveCategories
} from '../../constants/categories';
import { CANONICAL_MEMBERS, normalizeMemberName, nowTime, toExpenseCategory, toExpenseSubcategory, todayISO } from '../../utils/transactions';
import {
  getResolvedTransactionTaxGuidance,
  getSubcategoryTaxGuidance,
  resolveTaxGuidance
} from '../../utils/taxGuidance';
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
  StatementAccount,
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
  /** Accounts synced from Statements PWA. */
  accounts?: StatementAccount[];
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
  onAssociate?: (target: AssociationTarget) => void;
  defaultVehicleId?: string;
  defaultHomeId?: string;
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
  transactionType: 'Debit',
  vendor: '',
  notes: '',
  target,
  targetEntityId: undefined,
  targetEntityLabel: undefined,
  category,
  subcategory: '',
  paymentType: defaultPayment,
  accountName: undefined,
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
  accounts = [],
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
  onAssociate,
  defaultVehicleId,
  defaultHomeId
}) => {
  const availablePaymentTypes = useMemo(() => {
    if (paymentTypes.length > 0) {
      return paymentTypes.map(p => p.name as PaymentType);
    }
    return DEFAULT_PAYMENT_TYPES;
  }, [paymentTypes]);

  const defaultPaymentType = availablePaymentTypes[0] || 'Cash';

  const [draft, setDraft] = useState<ExpenseDraft>(() =>
    emptyDraft(normalizeMemberName(currentUser), defaultPaymentType, presetTarget || 'Family', presetCategory)
  );

  const [amountText, setAmountText] = useState('');
  const [error, setError] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedHomeId, setSelectedHomeId] = useState('');
  const [newEntityPrompt, setNewEntityPrompt] = useState<'trip' | 'office' | 'familyMember' | null>(null);
  const [newEntityName, setNewEntityName] = useState('');
  const [newOfficeType, setNewOfficeType] = useState('General Workspace');

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

      const entryTransactionType: 'Debit' | 'Credit' = initialEntry.transactionType === 'Credit' ? 'Credit' : 'Debit';

      const category = toExpenseCategory(initialEntry.label, target);
      setDraft({
        id: initialEntry.id,
        date: initialEntry.date,
        time: initialEntry.time || nowTime(),
        amount: Math.abs(initialEntry.amount),
        transactionType: entryTransactionType,
        vendor: initialEntry.vendor,
        notes: initialEntry.notes || '',
        target,
        targetEntityId: initialEntry.targetEntityId,
        targetEntityLabel: initialEntry.targetEntityLabel,
        category: category || (target === 'Travel' ? 'Transportation' : target === 'Business' ? 'Office & Supplies' : 'Food & Groceries'),
        subcategory: toExpenseSubcategory(target, category, initialEntry.detail),
        paymentType: initialEntry.paymentType,
        accountName: initialEntry.accountName || undefined,
        user: normalizeMemberName(initialEntry.user || currentUser),
        isTaxDeductible: initialEntry.isTaxDeductible ?? (target === 'Business')
      });
      setAmountText(initialEntry.amount ? String(Math.abs(initialEntry.amount)) : '');
    } else {
      const target = presetTarget || 'Family';
      const defaultCat = presetCategory || (target === 'Travel' ? 'Transportation' : target === 'Business' ? 'Office & Supplies' : 'Food & Groceries');
      const empty = emptyDraft(normalizeMemberName(currentUser), defaultPaymentType, target, defaultCat);
      setDraft(empty);
      setAmountText('');
    }
    setError('');
    setNewEntityPrompt(null);
    setNewEntityName('');
    setNewOfficeType('General Workspace');
  }, [isOpen, initialEntry, currentUser, presetCategory, presetTarget, defaultPaymentType]);

  const memberOptions = useMemo(() => {
    const all = [currentUser, ...members, draft.user].filter(Boolean).map(normalizeMemberName);
    return Array.from(new Set([...CANONICAL_MEMBERS, ...all]));
  }, [members, currentUser, draft.user]);

  const isRefund = draft.transactionType === 'Credit';

  const { bankAccounts, cardAccounts, otherAccounts } = useMemo(() => {
    const banks: StatementAccount[] = [];
    const cards: StatementAccount[] = [];
    const others: StatementAccount[] = [];
    accounts.forEach(acc => {
      if (acc.accountCategory === 'bank' || (!acc.accountCategory && /checking|savings|bank|deposit/i.test(acc.accountName))) {
        banks.push(acc);
      } else if (acc.accountCategory === 'credit_card' || (!acc.accountCategory && /card|visa|amex|mastercard|discover/i.test(acc.accountName))) {
        cards.push(acc);
      } else {
        others.push(acc);
      }
    });
    return { bankAccounts: banks, cardAccounts: cards, otherAccounts: others };
  }, [accounts]);

  const selectedOffice = useMemo(() => {
    if (draft.target !== 'Business' || !draft.targetEntityId) return null;
    return offices.find(o => o.id === draft.targetEntityId) || null;
  }, [draft.target, draft.targetEntityId, offices]);

  const availableTrips = useMemo(() => {
    if (!draft.date) return trips;
    return trips.filter(t => {
      if (draft.targetEntityId && t.id === draft.targetEntityId) return true;
      if (!t.endDate) return true;
      return draft.date <= t.endDate;
    });
  }, [trips, draft.date, draft.targetEntityId]);

  const currentCategories = useMemo(() => {
    return getContextCategories({
      target: draft.target,
      transactionType: draft.transactionType,
      targetEntityId: draft.targetEntityId,
      selectedOffice,
      hasFamilyMemberSelected: draft.target === 'Family' && Boolean(draft.targetEntityId),
      overrideDoc: taxonomyOverrideDoc
    });
  }, [draft.target, draft.transactionType, draft.targetEntityId, selectedOffice, taxonomyOverrideDoc]);

  const activeMeta = useMemo(() => {
    const found = currentCategories.find(c =>
      c.id.toLowerCase() === (draft.category || '').toLowerCase() ||
      c.name.toLowerCase() === (draft.category || '').toLowerCase()
    );
    return found || getCategoryMeta(draft.category, draft.target, taxonomyOverrideDoc);
  }, [currentCategories, draft.target, draft.category, taxonomyOverrideDoc]);

  useEffect(() => {
    if (!isOpen || currentCategories.length === 0) return;
    const hasMatch = currentCategories.some(c =>
      c.id.toLowerCase() === (draft.category || '').toLowerCase() ||
      c.name.toLowerCase() === (draft.category || '').toLowerCase()
    );
    if (!hasMatch) {
      setDraft(d => ({ ...d, category: currentCategories[0].id, subcategory: '' }));
    }
  }, [currentCategories, isOpen]);

  useEffect(() => {
    if (!isOpen || !draft.subcategory) return;
    const availableSubs = activeMeta?.subcategories || [];
    if (availableSubs.length > 0 && !availableSubs.includes(draft.subcategory)) {
      setDraft(d => ({ ...d, subcategory: '' }));
    }
  }, [activeMeta, isOpen]);

  const taxContext = useMemo(() => {
    return getResolvedTransactionTaxGuidance({
      target: draft.target,
      category: draft.category,
      subcategory: draft.subcategory,
      isRefund
    });
  }, [draft.target, draft.category, draft.subcategory, isRefund]);

  if (!isOpen) return null;

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
        officeType: newOfficeType || 'General Workspace'
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
    setNewOfficeType('General Workspace');
  };

  const toggleRefund = () => {
    setDraft(d => ({
      ...d,
      transactionType: d.transactionType === 'Credit' ? 'Debit' : 'Credit'
    }));
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const amount = Math.abs(parseFloat(amountText));
    if (!Number.isFinite(amount) || amount === 0) {
      setError('Enter an amount other than zero.');
      return;
    }
    if (!draft.vendor.trim()) {
      setError('Enter the store, restaurant or merchant.');
      return;
    }
    onSave({
      ...draft,
      amount: Math.round(amount * 100) / 100,
      vendor: draft.vendor.trim(),
      isTaxDeductible: isRefund ? false : draft.isTaxDeductible
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-0 sm:p-4 no-print">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] sm:max-h-[95vh] flex flex-col">
        {/* Mobile Pull-Down Handle */}
        <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto mt-2.5 mb-0.5 sm:hidden" />

        {/* Header with inline Domain Switcher */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 sm:py-3.5 border-b border-slate-200 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              {initialEntry ? 'Edit Transaction' : 'New Transaction'}
            </h2>
            {/* Inline Domain Target Switcher */}
            <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
              {(['Family', 'Travel', 'Business'] as ExpenseTarget[]).map(t => {
                const meta = TARGET_META[t];
                const Icon = meta.icon;
                const isActive = draft.target === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleTargetChange(t)}
                    className={`flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[11px] sm:text-xs font-bold transition-all ${
                      isActive
                        ? `${meta.badgeBg} ${meta.badgeBorder} border shadow-xs`
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>{t}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 sm:px-5 py-3 sm:py-4 space-y-3 sm:space-y-3.5 text-xs">

          {/* Row 1: Amount & Debit/Credit Toggle + Linked Entity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
            {/* Amount & Type */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <label className="field-label !mb-0" htmlFor="amount">Amount & Type</label>
                <div className="flex rounded-md border border-slate-200 bg-slate-100 p-0.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => { if (isRefund) toggleRefund(); }}
                    className={`px-2 py-0.5 font-bold rounded transition-all ${
                      !isRefund ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Debit (Expense)
                  </button>
                  <button
                    type="button"
                    onClick={() => { if (!isRefund) toggleRefund(); }}
                    className={`px-2 py-0.5 font-bold rounded transition-all ${
                      isRefund ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Credit (Inflow/Refund)
                  </button>
                </div>
              </div>
              <div className="relative">
                <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold ${
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
                  className={`field tabular text-xl font-bold py-1.5 pl-9 ${
                    isRefund ? 'text-emerald-700 bg-emerald-50/40 border-emerald-300 focus:border-emerald-500' : ''
                  }`}
                />
              </div>
            </div>

            {/* Entity Link (Family Member, Trip, or Office) */}
            <div>
              {draft.target === 'Family' && (
                <div className="p-2 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-emerald-950 flex items-center gap-1">
                      <UsersRound className="w-3 h-3 text-emerald-600" />
                      Family Member <span className="font-normal text-emerald-600 text-[10px]">· optional</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setNewEntityPrompt(newEntityPrompt === 'familyMember' ? null : 'familyMember')}
                      className="text-[10px] font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-0.5"
                    >
                      <Plus className="w-2.5 h-2.5" /> Add
                    </button>
                  </div>
                  {newEntityPrompt === 'familyMember' ? (
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <input
                        type="text"
                        value={newEntityName}
                        onChange={e => setNewEntityName(e.target.value)}
                        placeholder="e.g. Sarah"
                        className="field flex-1 text-xs py-1 bg-white"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleCreateQuickEntity}
                        className="px-2.5 py-1 bg-emerald-600 text-white text-[11px] font-bold rounded-lg hover:bg-emerald-700"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewEntityPrompt(null)}
                        className="px-1.5 py-1 text-slate-500 text-[11px]"
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
                      className="field text-xs py-1 bg-white"
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
                <div className="p-2 bg-sky-50/60 border border-sky-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-sky-950 flex items-center gap-1">
                      <Plane className="w-3 h-3 text-sky-600" />
                      Linked Trip <span className="font-normal text-sky-600 text-[10px]">· optional</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setNewEntityPrompt(newEntityPrompt === 'trip' ? null : 'trip')}
                      className="text-[10px] font-semibold text-sky-700 hover:text-sky-900 flex items-center gap-0.5"
                    >
                      <Plus className="w-2.5 h-2.5" /> Add
                    </button>
                  </div>
                  {newEntityPrompt === 'trip' ? (
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <input
                        type="text"
                        value={newEntityName}
                        onChange={e => setNewEntityName(e.target.value)}
                        placeholder="e.g. Summer in Tokyo"
                        className="field flex-1 text-xs py-1 bg-white"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleCreateQuickEntity}
                        className="px-2.5 py-1 bg-sky-600 text-white text-[11px] font-bold rounded-lg hover:bg-sky-700"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewEntityPrompt(null)}
                        className="px-1.5 py-1 text-slate-500 text-[11px]"
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
                      className="field text-xs py-1 bg-white"
                    >
                      <option value="">No specific trip (General Travel)</option>
                      {availableTrips.map(t => (
                        <option key={t.id} value={t.id}>{t.name} {t.startDate ? `(${t.startDate})` : ''}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {draft.target === 'Business' && (
                <div className="p-2 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-indigo-950 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-indigo-600" />
                      Linked Office <span className="font-normal text-indigo-600 text-[10px]">· optional</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setNewEntityPrompt(newEntityPrompt === 'office' ? null : 'office')}
                      className="text-[10px] font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-0.5"
                    >
                      <Plus className="w-2.5 h-2.5" /> Add
                    </button>
                  </div>
                  {newEntityPrompt === 'office' ? (
                    <div className="flex flex-col gap-1 pt-0.5">
                      <input
                        type="text"
                        value={newEntityName}
                        onChange={e => setNewEntityName(e.target.value)}
                        placeholder="e.g. Downtown Realty or Consulting LLC"
                        className="field text-xs py-1 bg-white"
                        autoFocus
                      />
                      <select
                        value={newOfficeType}
                        onChange={e => setNewOfficeType(e.target.value)}
                        className="field text-xs py-1 bg-white"
                      >
                        <option value="General Workspace">General Business / Workspace</option>
                        <option value="Real Estate">Real Estate & Brokerage</option>
                        <option value="Consulting">Consulting & Professional Services</option>
                        <option value="Technology & Software">Technology & Software</option>
                        <option value="Healthcare & Medical">Healthcare & Medical</option>
                        <option value="Retail & E-Commerce">Retail & E-Commerce</option>
                        <option value="Legal & Financial">Legal & Financial</option>
                        <option value="Home Office">Home Office</option>
                        <option value="Headquarters">Headquarters</option>
                        <option value="Branch">Branch</option>
                      </select>
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <button
                          type="button"
                          onClick={handleCreateQuickEntity}
                          className="px-2.5 py-1 bg-indigo-600 text-white text-[11px] font-bold rounded-lg hover:bg-indigo-700"
                        >
                          Save Office
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewEntityPrompt(null)}
                          className="px-1.5 py-1 text-slate-500 text-[11px]"
                        >
                          Cancel
                        </button>
                      </div>
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
                      className="field text-xs py-1 bg-white"
                    >
                      <option value="">General Business (No specific office)</option>
                      {offices.map(o => (
                        <option key={o.id} value={o.id}>{o.name} {o.officeType ? `· ${o.officeType}` : ''}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Category & Subcategory Selectors (Compact 2-Column Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="field-label !mb-0 flex items-center gap-1.5" htmlFor="category-select">
                  {activeMeta?.color && (
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-2xs"
                      style={{ backgroundColor: activeMeta.color }}
                    />
                  )}
                  <span>{draft.target} Category</span>
                </label>
                {onManageTaxonomy && (
                  <button
                    type="button"
                    onClick={onManageTaxonomy}
                    className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5"
                  >
                    <Settings2 className="w-2.5 h-2.5" /> Taxonomy
                  </button>
                )}
              </div>
              <select
                id="category-select"
                value={draft.category || ''}
                onChange={e => setDraft(d => ({ ...d, category: e.target.value, subcategory: '' }))}
                className="field py-1.5 font-medium"
              >
                <option value="">-- Select Category --</option>
                {currentCategories.map(({ id, name }) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="field-label !mb-0" htmlFor="subcategory-select">
                  Subcategory <span className="font-normal text-slate-400">· optional</span>
                </label>
                {draft.subcategory && (
                  <button
                    type="button"
                    onClick={() => setDraft(d => ({ ...d, subcategory: '' }))}
                    className="text-[10px] text-slate-400 hover:text-slate-600"
                  >
                    Clear
                  </button>
                )}
              </div>
              <select
                id="subcategory-select"
                value={draft.subcategory || ''}
                onChange={e => setDraft(d => ({ ...d, subcategory: e.target.value }))}
                disabled={(activeMeta?.subcategories || []).length === 0}
                className="field py-1.5 font-medium disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">
                  {(activeMeta?.subcategories || []).length === 0
                    ? 'No subcategories'
                    : '-- Select Subcategory (Optional) --'}
                </option>
                {(activeMeta?.subcategories || []).map(sub => {
                  const subGuidance = resolveTaxGuidance(getSubcategoryTaxGuidance(sub, draft.category, draft.target));
                  return (
                    <option key={sub} value={sub}>
                      {sub} {subGuidance?.scheduleOrForm ? `(${subGuidance.scheduleOrForm})` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Row 3: Merchant / Vendor & Date / Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Vendor */}
            <div>
              <label className="field-label" htmlFor="vendor">Merchant / Store / Vendor</label>
              <div className="relative">
                <Store className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  id="vendor"
                  list="vendor-suggestions"
                  value={draft.vendor}
                  onChange={e => setDraft(d => ({ ...d, vendor: e.target.value }))}
                  placeholder="e.g. Delta Air Lines, Costco, Amazon"
                  className="field pl-8 py-1.5"
                />
              </div>
              <datalist id="vendor-suggestions">
                {vendors.map(v => <option key={v} value={v} />)}
              </datalist>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="field-label" htmlFor="date">Date</label>
                <input
                  id="date"
                  type="date"
                  value={draft.date}
                  onChange={e => setDraft(d => ({ ...d, date: e.target.value }))}
                  className="field py-1.5"
                />
              </div>
              <div>
                <label className="field-label" htmlFor="time">Time</label>
                <input
                  id="time"
                  type="time"
                  value={draft.time}
                  onChange={e => setDraft(d => ({ ...d, time: e.target.value }))}
                  className="field py-1.5"
                />
              </div>
            </div>
          </div>

          {/* Row 4: Payment (Debit) / Credit to (Credit) & Member */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {isRefund ? (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="field-label !mb-0 flex items-center gap-1" htmlFor="deposit-account">
                    <Landmark className="w-3.5 h-3.5 text-emerald-600" /> Credit / Deposit to
                  </label>
                  <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                    Statements PWA
                  </span>
                </div>
                <select
                  id="deposit-account"
                  value={draft.accountName || ''}
                  onChange={e => {
                    const accName = e.target.value;
                    setDraft(d => ({
                      ...d,
                      accountName: accName || undefined,
                      paymentType: accName || d.paymentType
                    }));
                  }}
                  className="field py-1.5"
                >
                  <option value="">-- Select Account (Bank or Card) --</option>
                  {cardAccounts.length > 0 && (
                    <optgroup label="Credit Cards (Refund / Statement Credit)">
                      {cardAccounts.map(acc => (
                        <option key={acc.accountName} value={acc.accountName}>
                          💳 {acc.accountName} {acc.accountSubtype ? `(${acc.accountSubtype})` : ''}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {bankAccounts.length > 0 && (
                    <optgroup label="Bank Accounts (Deposit / Checking / Savings)">
                      {bankAccounts.map(acc => (
                        <option key={acc.accountName} value={acc.accountName}>
                          🏦 {acc.accountName} {acc.accountSubtype ? `(${acc.accountSubtype})` : ''}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {otherAccounts.length > 0 && (
                    <optgroup label="Other Accounts">
                      {otherAccounts.map(acc => (
                        <option key={acc.accountName} value={acc.accountName}>
                          {acc.accountName}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="field-label !mb-0" htmlFor="payment">Payment</label>
                  {onManagePaymentTypes && (
                    <button
                      type="button"
                      onClick={onManagePaymentTypes}
                      className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5"
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
                  className="field py-1.5"
                >
                  {availablePaymentTypes.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="field-label" htmlFor="member">
                {isRefund ? 'Received by' : 'Paid by'}
              </label>
              <select
                id="member"
                value={draft.user}
                onChange={e => setDraft(d => ({ ...d, user: e.target.value }))}
                className="field py-1.5"
              >
                {memberOptions.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Row 5: Notes & Tax Deductible (Tax Deductible only for Debit / Expenses) */}
          <div className={`grid gap-3 items-center ${isRefund ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
            <div>
              <label className="field-label" htmlFor="notes">Notes <span className="font-normal text-slate-400">· optional</span></label>
              <input
                id="notes"
                type="text"
                value={draft.notes}
                onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))}
                placeholder="What was it for?"
                className="field py-1.5"
              />
            </div>

            {!isRefund && (
              <div className="pt-1 sm:pt-4">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={draft.isTaxDeductible}
                    onChange={e => setDraft(d => ({ ...d, isTaxDeductible: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-semibold">
                    Tax deductible
                    {draft.target === 'Business' && <span className="text-[10px] text-indigo-600 font-bold ml-1">(Business Default)</span>}
                    {taxContext.deductibleStatus === 'deductible' && draft.target !== 'Business' && (
                      <span className="text-[10px] text-emerald-600 font-bold ml-1">(Eligible)</span>
                    )}
                    {taxContext.deductibleStatus === 'tax-credit' && (
                      <span className="text-[10px] text-purple-600 font-bold ml-1">(Tax Credit)</span>
                    )}
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Compact IRS Tax Guidance Callout (only for Debit / Expenses) */}
          {!isRefund && (
            <div className={`p-2.5 rounded-xl border shadow-2xs text-[11px] flex items-center gap-2.5 transition-all ${taxContext?.badgeStyle?.bg || 'bg-slate-50'} ${taxContext?.badgeStyle?.border || 'border-slate-200'}`}>
              <div className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 shadow-2xs ${taxContext?.badgeStyle?.iconBg || 'bg-slate-700 text-white'}`}>
                <Landmark className="h-3 w-3" />
              </div>
              <div className="min-w-0 flex-1 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900">{taxContext?.headline || 'Tax Guidance'}:</span>
                  <span className="text-slate-700 font-medium truncate max-w-[280px] sm:max-w-md">{taxContext?.purpose}</span>
                </div>
                {taxContext?.scheduleOrForm && (
                  <span className={`px-1.5 py-0.2 rounded font-mono text-[9px] font-bold border bg-white ${taxContext.badgeStyle?.text || 'text-slate-900'} ${taxContext.badgeStyle?.border || 'border-slate-200'}`}>
                    {taxContext.scheduleOrForm}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Cross-app move to vehicle / home (only for Debit / Expenses when editing) */}
          {!isRefund && initialEntry && (vehicles.length > 0 || homes.length > 0) && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 space-y-2">
              <p className="text-[11px] font-semibold text-slate-500">Move to sibling app:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {vehicles.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <select
                      value={selectedVehicleId}
                      onChange={e => setSelectedVehicleId(e.target.value)}
                      className="field flex-1 text-xs py-1"
                    >
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.year} {v.make} {v.model}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => onAssociate?.({ app: 'car', vehicleId: selectedVehicleId })}
                      className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 whitespace-nowrap"
                    >
                      🚗 Car
                    </button>
                  </div>
                )}
                {homes.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <select
                      value={selectedHomeId}
                      onChange={e => setSelectedHomeId(e.target.value)}
                      className="field flex-1 text-xs py-1"
                    >
                      {homes.map(h => (
                        <option key={h.id} value={h.id}>{h.nickname}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => onAssociate?.({ app: 'home', homeId: selectedHomeId })}
                      className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 whitespace-nowrap"
                    >
                      🏠 Home
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
              {error}
            </p>
          )}
        </form>

        {/* Modal Footer Actions */}
        <div className="flex items-center gap-2 px-4 sm:px-5 py-3 pb-6 sm:pb-3 border-t border-slate-200 safe-bottom">
          {initialEntry && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(initialEntry.id)}
              className="p-2.5 sm:p-2 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
              title="Delete transaction"
              aria-label="Delete transaction"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 sm:py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 py-2.5 sm:py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-600/20 transition-colors"
          >
            {initialEntry ? 'Save changes' : 'Add transaction'}
          </button>
        </div>
      </div>
    </div>
  );
};
