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

export const TARGETS = ['Family', 'Travel', 'Business', 'Property', 'Fleet'] as const;
export type Target = typeof TARGETS[number];

// Main expense categorization targets that ExpenseTracker logs into
export type ExpenseTarget = 'Family' | 'Travel' | 'Business';

export interface Trip {
  id: string;
  name: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  tripType?: string;  // Cruise, Land Tour, Road Trip, Beach Vacation, City Break, etc.
  destinations?: string[];
  notes?: string;
}

export interface Office {
  id: string;
  name: string;
  officeType?: string; // Headquarters, Branch, Warehouse, Retail, Home Office, etc.
  notes?: string;
}

export type ExpenseCategory =
  | 'Grocery'
  | 'Food & Dining'
  | 'Travel'
  | 'Transportation'
  | 'Household Supplies'
  | 'Health & Medical'
  | 'Shopping'
  | 'Digital & Tech'
  | 'Entertainment'
  | 'Education'
  | 'Personal Care'
  | 'Kids & Childcare'
  | 'Pets'
  | 'Insurance'
  | 'Gifts & Donations'
  | 'Food & Groceries'
  | 'Health & Wellness'
  | 'Entertainment & Leisure'
  | 'Family & Childcare'
  | 'Subscriptions & Memberships'
  | 'Personal Finance'
  | 'Taxes'
  | 'Lodging'
  | 'Activities & Entertainment'
  | 'Technology'
  | 'Travel Services & Fees'
  | 'Office & Supplies'
  | 'Marketing & Advertising'
  | 'Professional Services'
  | 'Travel & Meals'
  | 'Dues & Subscriptions'
  | 'Professional Development'
  | 'Commissions & Fees'
  | 'Taxes & Licenses'
  | 'Payroll & Contractors'
  | 'Income'
  | 'Other';

export type ExpenseSubcategory = string;

export interface PaymentTypeItem {
  id: string;
  name: string;
  ownerUid?: string;
  ownerName?: string;
  isSystemDefault?: boolean;
  isDefault?: boolean;
  createdAt?: string;
}

export type PaymentType = string;

// Generic, app-agnostic ledger entry. This is the exact same collection
// HomeTracker, AutoTrack, and Statements write to — users/{uid}/transactions or
// households/{code}/transactions — so home, car, travel, business, and everyday household
// spending coexist in one ledger.
export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  amount: number;
  vendor: string; // store, restaurant or shop
  notes?: string;
  category: string; // namespaced, e.g. "Expense - Family - Grocery - Supermarket" or "Expense - Travel - Lodging - Hotel/Resort"
  paymentType: PaymentType;
  user: string; // household member who logged / paid
  isTaxDeductible?: boolean;
  target?: Target;
  targetEntityId?: string;
  targetEntityLabel?: string;
}

// Which app or target owns a ledger entry, derived from its namespaced category.
export type LedgerSource = 'Expense' | 'Home' | 'Car' | 'Travel' | 'Business' | 'Other';

// Read-side view of a Transaction with its category string parsed apart.
export interface LedgerEntry extends Transaction {
  source: LedgerSource;
  target: Target;
  targetEntityId?: string;
  targetEntityLabel?: string;
  label: string; // leaf category, e.g. "Grocery" or "Lodging"
  detail: string; // subcategory or owning app's context, e.g. "Hotel/Resort" or "Main House"
  isEditable: boolean; // only Expense-owned entries may be edited here
}

// Minimal, read-only views of CarTracker's Vehicle and HomeTracker's Home
export interface AssociableVehicle {
  id: string;
  year: number;
  make: string;
  model: string;
  currentMileage: number;
}

export interface AssociableHome {
  id: string;
  nickname: string;
}

export type AssociationTarget =
  | { app: 'car'; vehicleId: string }
  | { app: 'home'; homeId: string };

export interface ExpenseDraft {
  id?: string;
  date: string;
  time: string;
  amount: number;
  vendor: string;
  notes: string;
  target: ExpenseTarget;
  targetEntityId?: string;
  targetEntityLabel?: string;
  category: string;
  subcategory: ExpenseSubcategory; // '' when the category has none or none was picked
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
