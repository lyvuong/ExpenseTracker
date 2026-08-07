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

// Utilities live in HomeTracker (they belong to a property, not to a person),
// so they are deliberately absent here. There is no "Subscriptions" category
// either: a subscription is a payment cadence, not a kind of spending —
// streaming lands under Entertainment, a gym under Personal Care, and
// software or AI tooling under Digital & Tech.
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
  | 'Other';

/**
 * Optional second level under a category, e.g. "Domains & Hosting" under
 * "Digital & Tech". Stored by concatenating it onto the category string the
 * same way CarTracker appends the vehicle — "Expense - Digital & Tech -
 * Domains & Hosting" — so the shared ledger needs no new field and entries
 * saved before subcategories existed stay valid.
 */
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
  category: string; // namespaced, e.g. "Expense - Grocery - Supermarket"
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
  detail: string; // our subcategory, or the owning app's context, e.g. "Main House"
  isEditable: boolean; // only Expense-owned entries may be edited here
}

// Minimal, read-only views of CarTracker's Vehicle and HomeTracker's Home —
// just enough to populate an "associate with" picker. Kept local here rather
// than imported since those are separate repos/packages.
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
  category: ExpenseCategory;
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
