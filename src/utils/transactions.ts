import type { ExpenseSubcategory, ExpenseTarget, LedgerEntry, LedgerSource, Target, Transaction } from '../types';
import { getCategoryMeta, getSubcategoriesFor } from '../constants/categories';

export const EXPENSE_PREFIX = 'Expense';

/**
 * Builds a namespaced category string:
 * "Expense - Travel - Lodging - Hotel/Resort"
 * "Expense - Business - Office & Supplies - Software & Subscriptions"
 * "Expense - Family - Food & Groceries - Supermarket"
 */
export const buildTransactionCategory = (
  target: ExpenseTarget,
  category: string,
  subcategory?: ExpenseSubcategory
): string => {
  return [EXPENSE_PREFIX, target, category?.trim(), subcategory?.trim()].filter(Boolean).join(' - ');
};

const SOURCE_PREFIXES: Record<string, LedgerSource> = {
  Expense: 'Expense',
  Home: 'Home',
  Car: 'Car',
  Travel: 'Travel',
  Business: 'Business'
};

export const parseTransaction = (transaction: Transaction): LedgerEntry => {
  const parts = (transaction.category || '').split(' - ').map(p => p.trim()).filter(Boolean);
  const prefix = parts[0] || 'Expense';
  const source: LedgerSource = SOURCE_PREFIXES[prefix] || (prefix === 'Home' ? 'Home' : prefix === 'Car' ? 'Car' : 'Expense');
  const isNamespaced = prefix === 'Expense' || prefix === 'Home' || prefix === 'Car' || prefix === 'Travel' || prefix === 'Business';

  let target: Target = transaction.target || 'Family';
  let label = 'Other';
  let detail = '';

  if (prefix === 'Home') {
    target = 'Family';
    label = parts[1] || 'Home Project';
    detail = parts.slice(2).join(' · ');
  } else if (prefix === 'Car') {
    target = 'Family';
    label = parts[1] || 'Auto Service';
    detail = parts.slice(2).join(' · ');
  } else if (prefix === 'Expense') {
    // Check if parts[1] is a known target: Family, Travel, Business
    if (parts[1] === 'Family' || parts[1] === 'Travel' || parts[1] === 'Business') {
      target = parts[1] as Target;
      label = parts[2] || 'General';
      detail = parts.slice(3).join(' · ');
    } else {
      // Legacy flat categories: "Expense - Grocery - Supermarket"
      const flatCategory = parts[1] || 'Other';
      if (flatCategory.toLowerCase() === 'travel') {
        target = 'Travel';
        label = parts[2] || 'Transportation';
        detail = parts.slice(3).join(' · ');
      } else {
        target = 'Family';
        label = flatCategory;
        detail = parts.slice(2).join(' · ');
      }
    }
  } else {
    label = isNamespaced ? (parts[1] || 'Other') : (parts[0] || 'Uncategorized');
    detail = isNamespaced ? parts.slice(2).join(' · ') : parts.slice(1).join(' · ');
  }

  // Use explicit target on transaction doc if provided
  if (transaction.target) {
    target = transaction.target;
  }

  return {
    ...transaction,
    amount: Number(transaction.amount) || 0,
    source,
    target,
    targetEntityId: transaction.targetEntityId,
    targetEntityLabel: transaction.targetEntityLabel,
    label,
    detail,
    isEditable: source === 'Expense'
  };
};

export const toExpenseCategory = (label: string, target?: ExpenseTarget): string => {
  const meta = getCategoryMeta(label, target);
  return meta ? meta.id : 'Other';
};

export const toExpenseSubcategory = (
  target: ExpenseTarget,
  category: string,
  detail: string
): ExpenseSubcategory => {
  const subcategories = getSubcategoriesFor(target, category);
  return subcategories.includes(detail) ? detail : '';
};

export const sortEntries = (entries: LedgerEntry[]): LedgerEntry[] =>
  [...entries].sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`));

// --- date & money helpers ------------------------------------------------

export const todayISO = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export const nowTime = (): string => new Date().toTimeString().slice(0, 5);

export const monthKey = (isoDate: string): string => (isoDate || '').slice(0, 7);

export const currentMonthKey = (): string => todayISO().slice(0, 7);

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
