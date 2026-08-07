import type { ExpenseCategory, ExpenseSubcategory, LedgerEntry, LedgerSource, Transaction } from '../types';
import { CATEGORIES, getSubcategories } from '../constants/categories';

// Every app on the shared ledger namespaces its category string with its own
// prefix — "Expense - Grocery", "Home - HVAC - Main House",
// "Car - Oil Change - 2019 - Toyota RAV4". Keeping the prefix means each app
// can still recognise its own rows in a household's combined ledger.
export const EXPENSE_PREFIX = 'Expense';

/**
 * "Expense - Digital & Tech - Domains & Hosting", or "Expense - Grocery" when
 * no subcategory was picked. Same hyphen concatenation CarTracker uses to
 * append the vehicle, so sibling apps parse our rows the way we parse theirs.
 */
export const buildTransactionCategory = (
  category: ExpenseCategory,
  subcategory?: ExpenseSubcategory
): string =>
  [EXPENSE_PREFIX, category, subcategory?.trim()].filter(Boolean).join(' - ');

const KNOWN_CATEGORIES = new Set<string>(CATEGORIES);

const SOURCE_PREFIXES: Record<string, LedgerSource> = {
  Expense: 'Expense',
  Home: 'Home',
  Car: 'Car'
};

export const parseTransaction = (transaction: Transaction): LedgerEntry => {
  const parts = (transaction.category || '').split(' - ').map(p => p.trim()).filter(Boolean);
  const source: LedgerSource = SOURCE_PREFIXES[parts[0]] || 'Other';
  const isNamespaced = source !== 'Other';

  const label = isNamespaced ? (parts[1] || 'Other') : (parts[0] || 'Uncategorized');
  const detail = isNamespaced ? parts.slice(2).join(' · ') : parts.slice(1).join(' · ');

  return {
    ...transaction,
    amount: Number(transaction.amount) || 0,
    source,
    label,
    detail,
    isEditable: source === 'Expense'
  };
};

// Expense entries whose leaf category is no longer one this app offers —
// "Utilities" moved to HomeTracker, "Subscriptions" was retired — still have
// to render, so fall back to "Other" rather than dropping the row.
export const toExpenseCategory = (label: string): ExpenseCategory =>
  (KNOWN_CATEGORIES.has(label) ? label : 'Other') as ExpenseCategory;

// Only echo a subcategory back into the editor when the category still offers
// it; otherwise the entry reopens with no subcategory selected.
export const toExpenseSubcategory = (
  category: ExpenseCategory,
  detail: string
): ExpenseSubcategory =>
  getSubcategories(category).includes(detail) ? detail : '';

export const sortEntries = (entries: LedgerEntry[]): LedgerEntry[] =>
  [...entries].sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`));

// --- date & money helpers ------------------------------------------------

export const todayISO = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export const nowTime = (): string => new Date().toTimeString().slice(0, 5);

/** "2026-08" for the month an ISO date falls in. */
export const monthKey = (isoDate: string): string => (isoDate || '').slice(0, 7);

export const currentMonthKey = (): string => todayISO().slice(0, 7);

/** "2026" for the year an ISO date falls in. */
export const yearKey = (isoDate: string): string => (isoDate || '').slice(0, 4);

export const currentYearKey = (): string => todayISO().slice(0, 4);

export const monthLabel = (key: string, opts: { short?: boolean } = {}): string => {
  const [year, month] = key.split('-').map(Number);
  if (!year || !month) return key;
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: opts.short ? 'short' : 'long',
    year: 'numeric'
  });
};

/** Month keys from newest to oldest, ending with the current month. */
export const recentMonthKeys = (count: number): string[] => {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
};

export const formatMoney = (amount: number): string =>
  amount.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

export const formatCompactMoney = (amount: number): string =>
  amount >= 1000
    ? `$${(amount / 1000).toFixed(amount >= 10000 ? 0 : 1)}k`
    : `$${Math.round(amount)}`;

export const formatDayLabel = (isoDate: string): string => {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  const date = new Date(y, m - 1, d);
  const today = new Date();
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);

  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric'
  });
};
