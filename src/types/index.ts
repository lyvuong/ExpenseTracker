export interface UserAuditInfo {
  uid: string;
  displayName: string;
  email?: string;
}

export interface HouseholdMetadata {
  code: string;
  createdBy: UserAuditInfo;
  createdAt: string;
  members: UserAuditInfo[];
}

export type ExpenseCategory =
  | 'Grocery'
  | 'Food & Dining'
  | 'Travel'
  | 'Transportation'
  | 'Utilities'
  | 'Household Supplies'
  | 'Health & Medical'
  | 'Shopping'
  | 'Entertainment'
  | 'Education'
  | 'Personal Care'
  | 'Kids & Childcare'
  | 'Pets'
  | 'Subscriptions'
  | 'Insurance'
  | 'Gifts & Donations'
  | 'Other';

// Same payment vocabulary the other family apps write, so a household's
// ledger stays consistent no matter which app created the entry.
export type PaymentType = 'Cash' | 'Credit Card' | 'Debit Card' | 'Bank Transfer' | 'Check' | 'Other';

// Generic, app-agnostic ledger entry. This is the exact same collection
// HomeTracker and AutoTrack write to — users/{uid}/transactions or
// households/{code}/transactions — so home, car and everyday household
// spending coexist in one ledger. Unlike those apps, Expense stores its
// entries directly here with no companion record document.
export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  amount: number;
  vendor: string; // store, restaurant or shop
  notes?: string;
  category: string; // namespaced, e.g. "Expense - Grocery"
  paymentType: PaymentType;
  user: string; // household member who logged / paid
  isTaxDeductible?: boolean;
}

// Which app owns a ledger entry, derived from its namespaced category.
export type LedgerSource = 'Expense' | 'Home' | 'Car' | 'Other';

// Read-side view of a Transaction with its category string parsed apart.
// Built in-memory; never persisted.
export interface LedgerEntry extends Transaction {
  source: LedgerSource;
  label: string; // leaf category, e.g. "Grocery"
  detail: string; // remaining context from other apps, e.g. "Main House"
  isEditable: boolean; // only Expense-owned entries may be edited here
}

export interface ExpenseDraft {
  id?: string;
  date: string;
  time: string;
  amount: number;
  vendor: string;
  notes: string;
  category: ExpenseCategory;
  paymentType: PaymentType;
  user: string;
  isTaxDeductible: boolean;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain?: string;
  databaseURL?: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous?: boolean;
}

export type ActiveTab = 'dashboard' | 'log' | 'insights' | 'settings';
