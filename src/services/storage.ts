import type { FirebaseConfig, LedgerEntry, PaymentTypeItem, Transaction } from '../types';
import { formatMoney } from '../utils/transactions';

const TRANSACTIONS_KEY = 'expense_transactions_v1';
const PAYMENT_TYPES_KEY = 'expense_payment_types_v1';
const FIREBASE_CONFIG_KEY = 'expense_firebase_config_custom';
const FAMILY_CODE_KEY = 'expense_family_code';

export const INITIAL_PAYMENT_TYPES: PaymentTypeItem[] = [
  { id: 'pt-1', name: 'Cash', isSystemDefault: true, isDefault: true },
  { id: 'pt-2', name: 'VISA - Wyndham Rewards - Anh Vuong', ownerName: 'Anh Vuong', isDefault: true },
  { id: 'pt-3', name: 'VISA - United Explorer - Anh Vuong', ownerName: 'Anh Vuong', isDefault: true },
  { id: 'pt-4', name: 'VISA - Venture X - Anh Vuong', ownerName: 'Anh Vuong', isDefault: true },
  { id: 'pt-5', name: 'VISA - Citi Costco - Anh Vuong', ownerName: 'Anh Vuong', isDefault: true },
  { id: 'pt-6', name: 'Gift Card - Vanilla - Anh Vuong', ownerName: 'Anh Vuong', isDefault: true }
];

// Demo rows only ever live in local storage — they are filtered out before
// anything is seeded into a real household ledger.
export const DEMO_PREFIX = 'demo-';

const daysAgo = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: `${DEMO_PREFIX}1`,
    date: daysAgo(0),
    time: '17:45',
    amount: 86.42,
    vendor: 'Trader Joe\'s',
    notes: 'Weekly grocery run',
    category: 'Expense - Grocery - Supermarket',
    paymentType: 'VISA - Wyndham Rewards - Anh Vuong',
    user: 'Household Member'
  },
  {
    id: `${DEMO_PREFIX}2`,
    date: daysAgo(1),
    time: '12:20',
    amount: 24.9,
    vendor: 'Pho Saigon',
    notes: 'Lunch',
    category: 'Expense - Food & Dining - Restaurant',
    paymentType: 'Cash',
    user: 'Household Member'
  },
  {
    id: `${DEMO_PREFIX}3`,
    date: daysAgo(4),
    time: '08:05',
    amount: 52.1,
    vendor: 'Shell',
    notes: 'Fill up',
    category: 'Expense - Transportation - Fuel',
    paymentType: 'VISA - Citi Costco - Anh Vuong',
    user: 'Household Member'
  },
  {
    id: `${DEMO_PREFIX}4`,
    date: daysAgo(9),
    time: '19:30',
    amount: 149.0,
    vendor: 'Target',
    notes: 'Cleaning supplies and paper goods',
    category: 'Expense - Household Supplies - Cleaning',
    paymentType: 'Gift Card - Vanilla - Anh Vuong',
    user: 'Household Member'
  },
  {
    id: `${DEMO_PREFIX}5`,
    date: daysAgo(12),
    time: '09:15',
    amount: 21.16,
    vendor: 'Namecheap',
    notes: 'Domain renewal — 1 year',
    category: 'Expense - Digital & Tech - Domains & Hosting',
    paymentType: 'VISA - Venture X - Anh Vuong',
    user: 'Household Member'
  }
];

export const loadLocalPaymentTypes = (): PaymentTypeItem[] => {
  try {
    const raw = localStorage.getItem(PAYMENT_TYPES_KEY);
    if (!raw) {
      localStorage.setItem(PAYMENT_TYPES_KEY, JSON.stringify(INITIAL_PAYMENT_TYPES));
      return INITIAL_PAYMENT_TYPES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_PAYMENT_TYPES;
  } catch (err) {
    console.error('Failed to load local payment types:', err);
    return INITIAL_PAYMENT_TYPES;
  }
};

export const saveLocalPaymentTypes = (paymentTypes: PaymentTypeItem[]): void => {
  try {
    localStorage.setItem(PAYMENT_TYPES_KEY, JSON.stringify(paymentTypes));
  } catch (err) {
    console.error('Failed to save local payment types:', err);
  }
};

export const loadLocalTransactions = (): Transaction[] => {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_KEY);
    if (!raw) {
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(INITIAL_TRANSACTIONS));
      return INITIAL_TRANSACTIONS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load local transactions:', err);
    return INITIAL_TRANSACTIONS;
  }
};

export const saveLocalTransactions = (transactions: Transaction[]): void => {
  try {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
  } catch (err) {
    console.error('Failed to save local transactions:', err);
  }
};

export const clearDemoData = (): void => {
  saveLocalTransactions(loadLocalTransactions().filter(t => !t.id.startsWith(DEMO_PREFIX)));
};

export const restoreSampleData = (): void => {
  const existing = loadLocalTransactions().filter(t => !t.id.startsWith(DEMO_PREFIX));
  saveLocalTransactions([...INITIAL_TRANSACTIONS, ...existing]);
};

export const getStoredFirebaseConfig = (): FirebaseConfig | null => {
  try {
    const raw = localStorage.getItem(FIREBASE_CONFIG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setStoredFirebaseConfig = (config: FirebaseConfig | null): void => {
  if (!config) {
    localStorage.removeItem(FIREBASE_CONFIG_KEY);
  } else {
    localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(config));
  }
};

export const getStoredFamilyCode = (): string => localStorage.getItem(FAMILY_CODE_KEY) || '';

export const setStoredFamilyCode = (code: string): void => {
  const clean = code.trim().toUpperCase();
  if (!clean) {
    localStorage.removeItem(FAMILY_CODE_KEY);
  } else {
    localStorage.setItem(FAMILY_CODE_KEY, clean);
  }
};

const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const csvCell = (value: string): string => `"${(value || '').replace(/"/g, '""')}"`;

export const exportEntriesAsCSV = (entries: LedgerEntry[]): void => {
  const headers = ['Date', 'Time', 'Source', 'Category', 'Vendor', 'Amount', 'Payment Type', 'Member', 'Notes', 'Tax Deductible'];
  const rows = entries.map(e => [
    csvCell(e.date),
    csvCell(e.time),
    csvCell(e.source),
    csvCell([e.label, e.detail].filter(Boolean).join(' · ')),
    csvCell(e.vendor),
    e.amount.toFixed(2),
    csvCell(e.paymentType),
    csvCell(e.user),
    csvCell(e.notes || ''),
    e.isTaxDeductible ? 'Yes' : 'No'
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadBlob(
    new Blob([csv], { type: 'text/csv;charset=utf-8;' }),
    `ExpenseTracker_Log_${new Date().toISOString().split('T')[0]}.csv`
  );
};

export const exportTransactionsAsJSON = (transactions: Transaction[]): void => {
  const backup = {
    version: '1.0',
    app: 'ExpenseTracker',
    exportDate: new Date().toISOString(),
    total: formatMoney(transactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0)),
    transactions
  };
  downloadBlob(
    new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }),
    `ExpenseTracker_Backup_${new Date().toISOString().split('T')[0]}.json`
  );
};

export const importJSONBackup = (jsonString: string): Transaction[] => {
  try {
    const data = JSON.parse(jsonString);
    const transactions: Transaction[] = data.transactions || [];
    if (!Array.isArray(transactions)) {
      throw new Error('Invalid JSON backup file structure.');
    }
    saveLocalTransactions(transactions);
    return transactions;
  } catch (err: any) {
    throw new Error(err.message || 'Failed to parse JSON backup file.');
  }
};
