import type { FirebaseConfig, LedgerEntry, Office, PaymentTypeItem, Transaction, Trip } from '../types';
import { formatMoney } from '../utils/transactions';

const TRANSACTIONS_KEY = 'expense_transactions_v1';
const PAYMENT_TYPES_KEY = 'expense_payment_types_v1';
const TRIPS_KEY = 'expense_trips_v1';
const OFFICES_KEY = 'expense_offices_v1';
const FIREBASE_CONFIG_KEY = 'expense_firebase_config_custom';
const FAMILY_CODE_KEY = 'expense_family_code';
const LAST_VEHICLE_KEY = 'expense_last_vehicle_id';
const LAST_HOME_KEY = 'expense_last_home_id';
const LAST_TRIP_KEY = 'expense_last_trip_id';
const LAST_OFFICE_KEY = 'expense_last_office_id';

export const INITIAL_PAYMENT_TYPES: PaymentTypeItem[] = [
  { id: 'pt-1', name: 'Cash', isSystemDefault: true, isDefault: true },
  { id: 'pt-2', name: 'VISA - Wyndham Rewards - Anh Vuong', ownerName: 'Anh Vuong', isDefault: true },
  { id: 'pt-3', name: 'VISA - United Explorer - Anh Vuong', ownerName: 'Anh Vuong', isDefault: true },
  { id: 'pt-4', name: 'VISA - Venture X - Anh Vuong', ownerName: 'Anh Vuong', isDefault: true },
  { id: 'pt-5', name: 'VISA - Citi Costco - Anh Vuong', ownerName: 'Anh Vuong', isDefault: true },
  { id: 'pt-6', name: 'Gift Card - Vanilla - Anh Vuong', ownerName: 'Anh Vuong', isDefault: true }
];

export const INITIAL_TRIPS: Trip[] = [
  {
    id: 'trip-demo-1',
    name: 'Summer in Tokyo',
    startDate: '2026-06-10',
    endDate: '2026-06-22',
    tripType: 'City Break',
    destinations: ['Tokyo', 'Kyoto'],
    notes: 'Family vacation to Japan'
  },
  {
    id: 'trip-demo-2',
    name: 'Hawaii Beach Getaway',
    startDate: '2026-09-01',
    endDate: '2026-09-08',
    tripType: 'Beach Vacation',
    destinations: ['Maui', 'Honolulu'],
    notes: 'Island road trip and surfing'
  }
];

export const INITIAL_OFFICES: Office[] = [
  {
    id: 'office-demo-1',
    name: 'Main Business Office',
    officeType: 'Headquarters',
    notes: 'Primary consulting and workspace'
  },
  {
    id: 'office-demo-2',
    name: 'Home Office & Studio',
    officeType: 'Home Office',
    notes: 'Remote tech & dev workspace'
  }
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
    category: 'Expense - Family - Food & Groceries - Supermarket',
    paymentType: 'VISA - Wyndham Rewards - Anh Vuong',
    user: 'Household Member',
    target: 'Family'
  },
  {
    id: `${DEMO_PREFIX}2`,
    date: daysAgo(1),
    time: '12:20',
    amount: 24.9,
    vendor: 'Pho Saigon',
    notes: 'Lunch',
    category: 'Expense - Family - Food & Groceries - Restaurants',
    paymentType: 'Cash',
    user: 'Household Member',
    target: 'Family'
  },
  {
    id: `${DEMO_PREFIX}3`,
    date: daysAgo(3),
    time: '14:15',
    amount: 420.0,
    vendor: 'Hilton Tokyo Odaiba',
    notes: 'Hotel deposit for summer vacation',
    category: 'Expense - Travel - Lodging - Hotel/Resort',
    paymentType: 'VISA - Venture X - Anh Vuong',
    user: 'Household Member',
    target: 'Travel',
    targetEntityId: 'trip-demo-1',
    targetEntityLabel: 'Summer in Tokyo'
  },
  {
    id: `${DEMO_PREFIX}4`,
    date: daysAgo(6),
    time: '11:30',
    amount: 299.0,
    vendor: 'Cursor AI & Claude Pro',
    notes: 'Annual AI & dev tooling subscription',
    category: 'Expense - Business - Technology - SaaS & Software Licenses',
    paymentType: 'VISA - Venture X - Anh Vuong',
    user: 'Household Member',
    target: 'Business',
    targetEntityId: 'office-demo-2',
    targetEntityLabel: 'Home Office & Studio',
    isTaxDeductible: true
  },
  {
    id: `${DEMO_PREFIX}5`,
    date: daysAgo(9),
    time: '19:30',
    amount: 149.0,
    vendor: 'Target',
    notes: 'Cleaning supplies and paper goods',
    category: 'Expense - Family - Household Supplies - Cleaning',
    paymentType: 'Gift Card - Vanilla - Anh Vuong',
    user: 'Household Member',
    target: 'Family'
  },
  {
    id: `${DEMO_PREFIX}6`,
    date: daysAgo(12),
    time: '09:15',
    amount: 21.16,
    vendor: 'Namecheap',
    notes: 'Domain renewal — 1 year',
    category: 'Expense - Business - Office & Supplies - Software & Subscriptions',
    paymentType: 'VISA - Venture X - Anh Vuong',
    user: 'Household Member',
    target: 'Business',
    isTaxDeductible: true
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

export const loadLocalTrips = (): Trip[] => {
  try {
    const raw = localStorage.getItem(TRIPS_KEY);
    if (!raw) {
      localStorage.setItem(TRIPS_KEY, JSON.stringify(INITIAL_TRIPS));
      return INITIAL_TRIPS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load local trips:', err);
    return INITIAL_TRIPS;
  }
};

export const saveLocalTrips = (trips: Trip[]): void => {
  try {
    localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
  } catch (err) {
    console.error('Failed to save local trips:', err);
  }
};

export const loadLocalOffices = (): Office[] => {
  try {
    const raw = localStorage.getItem(OFFICES_KEY);
    if (!raw) {
      localStorage.setItem(OFFICES_KEY, JSON.stringify(INITIAL_OFFICES));
      return INITIAL_OFFICES;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load local offices:', err);
    return INITIAL_OFFICES;
  }
};

export const saveLocalOffices = (offices: Office[]): void => {
  try {
    localStorage.setItem(OFFICES_KEY, JSON.stringify(offices));
  } catch (err) {
    console.error('Failed to save local offices:', err);
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

// Remembers entity IDs so pickers remember recent choices
export const getStoredLastVehicleId = (): string => localStorage.getItem(LAST_VEHICLE_KEY) || '';
export const setStoredLastVehicleId = (id: string): void => {
  if (id) localStorage.setItem(LAST_VEHICLE_KEY, id);
};
export const getStoredLastHomeId = (): string => localStorage.getItem(LAST_HOME_KEY) || '';
export const setStoredLastHomeId = (id: string): void => {
  if (id) localStorage.setItem(LAST_HOME_KEY, id);
};
export const getStoredLastTripId = (): string => localStorage.getItem(LAST_TRIP_KEY) || '';
export const setStoredLastTripId = (id: string): void => {
  if (id) localStorage.setItem(LAST_TRIP_KEY, id);
};
export const getStoredLastOfficeId = (): string => localStorage.getItem(LAST_OFFICE_KEY) || '';
export const setStoredLastOfficeId = (id: string): void => {
  if (id) localStorage.setItem(LAST_OFFICE_KEY, id);
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
  const headers = ['Date', 'Time', 'Target', 'Source', 'Entity', 'Category', 'Vendor', 'Amount', 'Payment Type', 'Member', 'Notes', 'Tax Deductible'];
  const rows = entries.map(e => [
    csvCell(e.date),
    csvCell(e.time),
    csvCell(e.target || 'Family'),
    csvCell(e.source),
    csvCell(e.targetEntityLabel || ''),
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
    version: '2.0',
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
