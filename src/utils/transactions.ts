import type { ExpenseRecord, ExpenseSubcategory, ExpenseTarget, LedgerEntry, LedgerSource, Transaction } from '../types';
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

export const CANONICAL_MEMBERS = ['Ly Vuong', 'Huong Pham', 'Huan Vuong'] as const;
export type CanonicalMember = (typeof CANONICAL_MEMBERS)[number];

export const normalizeMemberName = (rawName?: string | null): string => {
  if (!rawName) return 'Ly Vuong';
  const clean = rawName.trim().toLowerCase();

  if (clean === 'ly' || clean.includes('ly vuong') || clean.includes('anh vuong') || clean === 'lyvuong') {
    return 'Ly Vuong';
  }
  if (clean === 'huong' || clean.includes('huong') || clean.includes('hương') || clean === 'hnpham3149@gmail.com') {
    return 'Huong Pham';
  }
  if (clean === 'huan' || clean.includes('huan') || clean.includes('huân') || clean === 'vqhuan@lv5.org') {
    return 'Huan Vuong';
  }
  if (clean === 'household member') {
    return 'Ly Vuong';
  }
  return rawName.trim();
};

const SOURCE_PREFIXES: Record<string, LedgerSource> = {
  Expense: 'Expense',
  Home: 'Home',
  Car: 'Car',
  Travel: 'Travel',
  Business: 'Business'
};

/**
 * Converts a raw Firestore Transaction into a display-ready LedgerEntry.
 *
 * Handles two write shapes transparently:
 *   - Old shape: signed amount (negative = credit), no transactionType, target/entityId embedded on the
 *     transaction doc itself, category namespaced string carries structured data.
 *   - New shape: unsigned amount, transactionType: 'Debit'|'Credit', target/entityId live in an
 *     ExpenseRecord detail doc (pass it as the second argument).
 *
 * Output LedgerEntry.amount is always signed (negative = credit) so all display sites work unchanged.
 */
export const parseTransaction = (
  transaction: Transaction,
  expenseRecord?: ExpenseRecord
): LedgerEntry => {
  // --- Direction normalization -------------------------------------------------
  // Detect credit from: explicit transactionType (new shape) OR negative amount (old shape)
  const rawAmount = Number(transaction.amount) || 0;
  const isCredit =
    transaction.transactionType === 'Credit' ||
    (!transaction.transactionType && rawAmount < 0);
  const transactionType: 'Debit' | 'Credit' = isCredit ? 'Credit' : 'Debit';
  // Produce signed amount for all display sites: negative = credit
  const signedAmount = isCredit ? -Math.abs(rawAmount) : Math.abs(rawAmount);

  // --- Parse namespace from raw category string --------------------------------
  // Format: "Expense - Target - Category - Subcategory" OR "Home - Property - Category"
  const rawCat = transaction.category || '';
  const parts = rawCat.split(' - ').map(s => s.trim()).filter(Boolean);
  const prefix = parts[0] || '';
  const source: LedgerSource = SOURCE_PREFIXES[prefix] || 'Expense';
  const isNamespaced = parts.length >= 2 && prefix in SOURCE_PREFIXES;

  let target: ExpenseTarget = 'Family';
  let label = 'Other';
  let detail = '';

  if (source === 'Expense') {
    if (expenseRecord) {
      target = expenseRecord.target || 'Family';
      label = expenseRecord.category || (isNamespaced ? parts[2] : parts[0]) || 'Other';
      detail = expenseRecord.subcategory || '';
    } else if (isNamespaced) {
      const parsedTarget = parts[1] as ExpenseTarget;
      if (parsedTarget === 'Family' || parsedTarget === 'Travel' || parsedTarget === 'Business') {
        target = parsedTarget;
        label = parts[2] || 'Other';
        detail = parts.slice(3).join(' · ');
      } else {
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
      if (transaction.target) target = transaction.target;
    } else {
      label = isNamespaced ? (parts[1] || 'Other') : (parts[0] || 'Uncategorized');
      detail = isNamespaced ? parts.slice(2).join(' · ') : parts.slice(1).join(' · ');
    }
  } else {
    label = isNamespaced ? (parts[1] || 'Other') : (parts[0] || 'Uncategorized');
    detail = isNamespaced ? parts.slice(2).join(' · ') : parts.slice(1).join(' · ');
  }

  // Resolve entity link: prefer expenseRecord, fall back to legacy fields on transaction
  const targetEntityId = expenseRecord?.targetEntityId ?? transaction.targetEntityId;
  const targetEntityLabel = expenseRecord?.targetEntityLabel ?? transaction.targetEntityLabel;

  return {
    ...transaction,
    user: normalizeMemberName(transaction.user),
    amount: signedAmount,
    transactionType,
    source,
    target,
    targetEntityId,
    targetEntityLabel,
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
