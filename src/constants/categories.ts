import {
  ShoppingCart,
  UtensilsCrossed,
  Plane,
  Bus,
  SprayCan,
  HeartPulse,
  ShoppingBag,
  Laptop,
  Clapperboard,
  GraduationCap,
  Sparkles,
  Baby,
  PawPrint,
  ShieldCheck,
  Gift,
  CircleEllipsis,
  Receipt,
  BedDouble,
  Ticket,
  Briefcase,
  Smartphone,
  RefreshCw,
  Wallet,
  Scale,
  Banknote,
  Building2,
  Megaphone,
  Handshake,
  BadgeCheck,
  Award,
  Users,
  FileCheck,
  UsersRound,
  Tag,
  House,
  Car
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type {
  ExpenseCategory,
  ExpenseSubcategory,
  LedgerSource,
  PaymentType,
  Target,
  TaxonomyOverrideDoc
} from '../types';

export interface CategoryMeta {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  hint: string;
  subcategories: ExpenseSubcategory[];
  isCustom?: boolean;
  isDeleted?: boolean;
}

export interface TargetMeta {
  id: Target;
  name: string;
  icon: LucideIcon;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  description: string;
  collectionName: string;
  entityLabel: string;
}

export const TARGET_META: Record<Target, TargetMeta> = {
  Family: {
    id: 'Family',
    name: 'Family & Household',
    icon: UsersRound,
    color: '#10b981',
    badgeBg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    badgeBorder: 'border-emerald-200 dark:border-emerald-800/40',
    badgeText: 'text-emerald-600 dark:text-emerald-400',
    description: 'Everyday household living, personal care, education & groceries',
    collectionName: 'family',
    entityLabel: 'Family Member'
  },
  Travel: {
    id: 'Travel',
    name: 'Travel & Trips',
    icon: Plane,
    color: '#0ea5e9',
    badgeBg: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
    badgeBorder: 'border-sky-200 dark:border-sky-800/40',
    badgeText: 'text-sky-600 dark:text-sky-400',
    description: 'Vacations, flights, lodging, tours & travel expenses',
    collectionName: 'trips',
    entityLabel: 'Trip'
  },
  Business: {
    id: 'Business',
    name: 'Business & Office',
    icon: Briefcase,
    color: '#6366f1',
    badgeBg: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
    badgeBorder: 'border-indigo-200 dark:border-indigo-800/40',
    badgeText: 'text-indigo-600 dark:text-indigo-400',
    description: 'Office supplies, technology, marketing, client meals & professional fees',
    collectionName: 'offices',
    entityLabel: 'Office / Business'
  }
};

// ============================================================================
// TRAVEL CATEGORIES (From Statements PWA)
// ============================================================================
export const TRAVEL_CATEGORIES: CategoryMeta[] = [
  {
    id: 'Transportation',
    name: 'Transportation',
    icon: Bus,
    color: '#6366f1',
    hint: 'Flights, trains, rental cars, transit',
    subcategories: ['Flights', 'Trains & Buses', 'Rental Car', 'Rideshare & Taxi', 'Public Transit', 'Ferries', 'Cruise', 'Parking']
  },
  {
    id: 'Lodging',
    name: 'Lodging',
    icon: BedDouble,
    color: '#ec4899',
    hint: 'Hotels, vacation rentals, resort fees',
    subcategories: ['Hotel/Resort', 'Vacation Rental', 'Resort Fees']
  },
  {
    id: 'Food & Dining',
    name: 'Food & Dining',
    icon: UtensilsCrossed,
    color: '#f97316',
    hint: 'Restaurants, cafes, groceries on trips',
    subcategories: ['Restaurants', 'Cafes & Coffee', 'Room Service', 'Groceries While Traveling', 'Snacks']
  },
  {
    id: 'Activities & Entertainment',
    name: 'Activities & Entertainment',
    icon: Ticket,
    color: '#f59e0b',
    hint: 'Tours, excursions, theme parks, shows',
    subcategories: ['Tours & Excursions', 'Attraction Tickets', 'Events & Shows']
  },
  {
    id: 'Technology',
    name: 'Technology',
    icon: Smartphone,
    color: '#8b5cf6',
    hint: 'Adapters, SIM cards, Wi-Fi, apps',
    subcategories: ['Travel Adapters & Chargers', 'Portable Wi-Fi & SIM Cards', 'Camera & Gear Rentals', 'Device Repairs', 'Travel Apps & Software']
  },
  {
    id: 'Shopping',
    name: 'Shopping',
    icon: ShoppingBag,
    color: '#06b6d4',
    hint: 'Souvenirs, duty-free, luggage, gifts',
    subcategories: ['Souvenirs & Gifts', 'Duty-Free Shopping', 'Local Crafts & Goods', 'Travel Gear & Luggage', 'Clothing While Traveling']
  },
  {
    id: 'Travel Services & Fees',
    name: 'Travel Services & Fees',
    icon: Briefcase,
    color: '#14b8a6',
    hint: 'Insurance, passport/visa, baggage, FX',
    subcategories: ['Travel Insurance', 'Visa & Passport Fees', 'Baggage Fees', 'Currency Exchange', 'Travel Agent Fees']
  }
];

// ============================================================================
// FAMILY & HOUSEHOLD CATEGORIES (Matching Statements PWA)
// ============================================================================
export const FAMILY_CATEGORIES: CategoryMeta[] = [
  {
    id: 'Income',
    name: 'Income',
    icon: Banknote,
    color: '#059669',
    hint: 'Salary, bonus, freelance, dividends, refunds, unemployment',
    subcategories: [
      'Salary & Wages',
      'Bonus & Commission',
      'Freelance & Side Income',
      'Investment & Dividends',
      'Rental Income',
      'Tax Refund',
      'Reimbursement',
      'Gifts Received',
      'Unemployment Benefits'
    ]
  },
  {
    id: 'Health & Wellness',
    name: 'Health & Wellness',
    icon: HeartPulse,
    color: '#ef4444',
    hint: 'Doctor, dental, vision, pharmacy, gym, counseling',
    subcategories: [
      'Doctor Visits',
      'Dental Care',
      'Vision Care',
      'Pharmacy & Prescriptions',
      'Gym & Fitness',
      'Therapy & Counseling'
    ]
  },
  {
    id: 'Personal Care',
    name: 'Personal Care',
    icon: Sparkles,
    color: '#f43f5e',
    hint: 'Haircuts, salon, spa, massage, cosmetics',
    subcategories: [
      'Haircuts & Salon',
      'Spa & Massage',
      'Cosmetics & Toiletries'
    ]
  },
  {
    id: 'Shopping',
    name: 'Shopping',
    icon: ShoppingBag,
    color: '#2563eb',
    hint: 'Clothing, shoes, accessories, electronics, general merchandise',
    subcategories: [
      'Clothing & Apparel',
      'Shoes & Footwear',
      'Accessories & Jewelry',
      'Electronics & Gadgets',
      'General Merchandise'
    ]
  },
  {
    id: 'Food & Groceries',
    name: 'Food & Groceries',
    icon: ShoppingCart,
    color: '#f59e0b',
    hint: 'Supermarket, dining, coffee shops, alcohol & bars',
    subcategories: [
      'Groceries',
      'Restaurants',
      'Coffee Shops',
      'Alcohol & Bars'
    ]
  },
  {
    id: 'Entertainment & Leisure',
    name: 'Entertainment & Leisure',
    icon: Clapperboard,
    color: '#8b5cf6',
    hint: 'Streaming, movies, concerts, hobbies, books, games, digital service',
    subcategories: [
      'Movies & Streaming',
      'Concerts & Events',
      'Hobbies',
      'Books & Magazines',
      'Video Games',
      'Digital Service'
    ]
  },
  {
    id: 'Education',
    name: 'Education',
    icon: GraduationCap,
    color: '#0ea5e9',
    hint: 'Tuition, student loans, books & supplies, courses & certifications',
    subcategories: [
      'Tuition',
      'Student Loans',
      'Books & Supplies',
      'Courses & Certifications'
    ]
  },
  {
    id: 'Gifts & Donations',
    name: 'Gifts & Donations',
    icon: Gift,
    color: '#10b981',
    hint: 'Gifts, charitable donations, religious contributions',
    subcategories: [
      'Gifts',
      'Charitable Donations',
      'Religious Contributions'
    ]
  },
  {
    id: 'Family & Childcare',
    name: 'Family & Childcare',
    icon: Baby,
    color: '#14b8a6',
    hint: 'Childcare, daycare, kids activities, pet care, eldercare',
    subcategories: [
      'Childcare & Daycare',
      'Kids Activities',
      'Pet Care',
      'Elder Care'
    ]
  },
  {
    id: 'Subscriptions and Memberships',
    name: 'Subscriptions and Memberships',
    icon: RefreshCw,
    color: '#6366f1',
    hint: 'Streaming, music, cloud storage, publications, clubs, meal kits',
    subcategories: [
      'Streaming & Media',
      'Music & Audio',
      'Cloud Storage & Software',
      'News & Publications',
      'Gym & Fitness Memberships',
      'Warehouse & Retail Clubs',
      'Meal Kits & Food Delivery',
      'Gaming Subscriptions',
      'Professional & Trade Memberships'
    ]
  },
  {
    id: 'Personal Finance',
    name: 'Personal Finance',
    icon: Wallet,
    color: '#a855f7',
    hint: 'Banking fees, card payments, pension, SSA, transfers, insurance',
    subcategories: [
      'Bank & ATM Fees',
      'Subscriptions & Memberships',
      'Life Insurance',
      'CC Payment',
      'Income',
      'Pension',
      'SSA',
      'CD',
      'Transfer'
    ]
  },
  {
    id: 'Taxes',
    name: 'Taxes',
    icon: Scale,
    color: '#ea580c',
    hint: 'Federal & state income tax, estimated payments, tax prep, local tax',
    subcategories: [
      'Federal Income Tax',
      'State Income Tax',
      'Estimated Tax Payments',
      'Tax Preparation Fees',
      'IRS Penalties & Interest',
      'Local & City Tax'
    ]
  }
];

// Fallback metadata for any legacy categories found in older transactions
export const LEGACY_FAMILY_FALLBACK_CATEGORIES: CategoryMeta[] = [
  {
    id: 'Household Supplies',
    name: 'Household Supplies',
    icon: SprayCan,
    color: '#0891b2',
    hint: 'Cleaning, paper goods, kitchen, tools',
    subcategories: ['Cleaning', 'Paper Goods', 'Kitchen', 'Laundry', 'Storage & Organization', 'Tools & Hardware']
  },
  {
    id: 'Pets',
    name: 'Pets',
    icon: PawPrint,
    color: '#84cc16',
    hint: 'Pet food, vet visits, grooming, supplies',
    subcategories: ['Food & Treats', 'Vet & Healthcare', 'Grooming', 'Pet Supplies', 'Boarding & Sitting', 'Medication']
  },
  {
    id: 'Digital & Tech',
    name: 'Digital & Tech',
    icon: Laptop,
    color: '#8b5cf6',
    hint: 'Software, cloud, domains, AI tools',
    subcategories: ['Domains & Hosting', 'Software & Apps', 'AI & Dev Tools', 'Cloud & Storage', 'Online Services', 'Devices & Accessories']
  },
  {
    id: 'Insurance',
    name: 'Insurance',
    icon: ShieldCheck,
    color: '#475569',
    hint: 'Health, dental, life, disability',
    subcategories: ['Health', 'Dental & Vision', 'Life', 'Disability', 'Umbrella']
  },
  {
    id: 'Other',
    name: 'Other',
    icon: CircleEllipsis,
    color: '#94a3b8',
    hint: 'Miscellaneous personal expenses',
    subcategories: ['Fees & Charges', 'Cash Withdrawal', 'Reimbursable', 'Miscellaneous']
  }
];

// ============================================================================
// BUSINESS CATEGORIES (From Statements PWA)
// ============================================================================
export const BUSINESS_CATEGORIES: CategoryMeta[] = [
  {
    id: 'Office & Supplies',
    name: 'Office & Supplies',
    icon: Building2,
    color: '#2563eb',
    hint: 'Office supplies, equipment, software, postage',
    subcategories: ['Office Supplies', 'Equipment & Hardware', 'Software & Subscriptions', 'Printing & Postage', 'Furniture & Fixtures']
  },
  {
    id: 'Technology',
    name: 'Technology & IT',
    icon: Laptop,
    color: '#4f46e5',
    hint: 'Computers, cloud, SaaS licenses, DNS, IT',
    subcategories: ['Computers & Devices', 'Cloud & Hosting', 'SaaS & Software Licenses', 'IT Support & Repairs', 'Domain & DNS', 'Data & Cybersecurity']
  },
  {
    id: 'Marketing & Advertising',
    name: 'Marketing & Advertising',
    icon: Megaphone,
    color: '#d97706',
    hint: 'Ads, print, website, social tools, staging',
    subcategories: ['Online Advertising', 'Print Marketing', 'Website & Hosting', 'Social Media Tools', 'Signage & Photography', 'Staging & Promotional']
  },
  {
    id: 'Professional Services',
    name: 'Professional Services',
    icon: Handshake,
    color: '#7c3aed',
    hint: 'Legal, accounting, consulting, bank fees',
    subcategories: ['Legal Fees', 'Accounting & Bookkeeping', 'Consulting Fees', 'Bank & Merchant Fees']
  },
  {
    id: 'Travel & Meals',
    name: 'Travel & Meals',
    icon: UtensilsCrossed,
    color: '#ea580c',
    hint: 'Business trips, client meals, events',
    subcategories: ['Business Travel', 'Client Meals', 'Conferences & Events', 'Lodging & Transport']
  },
  {
    id: 'Dues & Subscriptions',
    name: 'Dues & Subscriptions',
    icon: BadgeCheck,
    color: '#0284c7',
    hint: 'MLS dues, trade associations, board dues',
    subcategories: ['MLS Dues & Fees', 'Realtor / Trade Association Dues', 'Industry Subscriptions', 'Professional Memberships', 'Board Dues']
  },
  {
    id: 'Professional Development',
    name: 'Professional Development',
    icon: Award,
    color: '#0d9488',
    hint: 'Continuing ed (CE), licenses, workshops',
    subcategories: ['Continuing Education (CE)', 'Professional Licensing', 'Certifications & Exams', 'Seminars & Workshops', 'Training & Coaching']
  },
  {
    id: 'Commissions & Fees',
    name: 'Commissions & Fees',
    icon: Banknote,
    color: '#059669',
    hint: 'Broker splits, desk fees, closing fees',
    subcategories: ['Broker Commission Split', 'Broker Desk Fees', 'Brokerage Admin Fees', 'Referral & Finder Fees', 'Closing & Transaction Fees']
  },
  {
    id: 'Taxes & Licenses',
    name: 'Taxes & Licenses',
    icon: FileCheck,
    color: '#e11d48',
    hint: 'Business taxes, permits, business insurance',
    subcategories: ['Business Taxes', 'Licenses & Permits', 'Business Insurance']
  },
  {
    id: 'Payroll & Contractors',
    name: 'Payroll & Contractors',
    icon: Users,
    color: '#c026d3',
    hint: 'Payroll, contractor 1099, benefits',
    subcategories: ['Employee Payroll', 'Contractor Payments', 'Employee Benefits']
  },
  {
    id: 'Income',
    name: 'Business Income',
    icon: Banknote,
    color: '#16a34a',
    hint: 'Client payments, sales, grants, refunds',
    subcategories: ['Client Payments', 'Product Sales', 'Interest Income', 'Refunds & Reimbursements', 'Loans & Financing', 'Grants & Subsidies', 'Owner Contribution']
  },
  {
    id: 'Other',
    name: 'Other Business',
    icon: CircleEllipsis,
    color: '#64748b',
    hint: 'Miscellaneous company expenses',
    subcategories: ['Bank Charges', 'Miscellaneous Expense']
  }
];

export const CATEGORIES_BY_TARGET: Record<Target, CategoryMeta[]> = {
  Family: FAMILY_CATEGORIES,
  Travel: TRAVEL_CATEGORIES,
  Business: BUSINESS_CATEGORIES
};

// Base taxonomy dictionary for Family, Travel, Business
export const CATEGORY_TAXONOMY_BASE: Record<Target, Record<string, string[]>> = {
  Family: Object.fromEntries(FAMILY_CATEGORIES.map(c => [c.id, c.subcategories])),
  Travel: Object.fromEntries(TRAVEL_CATEGORIES.map(c => [c.id, c.subcategories])),
  Business: Object.fromEntries(BUSINESS_CATEGORIES.map(c => [c.id, c.subcategories]))
};

// Flattened list of all built-in category metadata
export const ALL_CATEGORIES: CategoryMeta[] = [
  ...FAMILY_CATEGORIES,
  ...TRAVEL_CATEGORIES,
  ...BUSINESS_CATEGORIES,
  ...LEGACY_FAMILY_FALLBACK_CATEGORIES
];

export const CATEGORY_META = FAMILY_CATEGORIES;
export const CATEGORIES: ExpenseCategory[] = Array.from(new Set(ALL_CATEGORIES.map(c => c.id as ExpenseCategory)));

const FALLBACK_META: CategoryMeta = {
  id: 'Other',
  name: 'Other',
  icon: CircleEllipsis,
  color: '#94a3b8',
  hint: '',
  subcategories: []
};

/**
 * Returns merged category taxonomy with custom overrides & soft-delete filtering.
 */
export const getEffectiveCategories = (
  target: Target,
  overrideDoc?: TaxonomyOverrideDoc
): CategoryMeta[] => {
  const baseList = CATEGORIES_BY_TARGET[target] || CATEGORIES_BY_TARGET.Family;
  const override = overrideDoc?.[target];
  if (!override) return baseList;

  const deletedSet = new Set(override.deleted || []);
  const customMap = override.categories || {};

  const result: CategoryMeta[] = [];

  // 1. Process base categories
  for (const base of baseList) {
    if (deletedSet.has(base.id)) continue;
    const customSubs = customMap[base.id] || [];
    const combinedSubs = Array.from(new Set([...base.subcategories, ...customSubs])).filter(
      sub => !deletedSet.has(`${base.id}::${sub}`)
    );
    result.push({
      ...base,
      subcategories: combinedSubs
    });
  }

  // 2. Process newly added custom categories
  for (const [customName, customSubs] of Object.entries(customMap)) {
    if (deletedSet.has(customName)) continue;
    if (!result.some(c => c.id.toLowerCase() === customName.toLowerCase())) {
      const activeSubs = customSubs.filter(sub => !deletedSet.has(`${customName}::${sub}`));
      result.push({
        id: customName,
        name: customName,
        icon: Tag,
        color: '#6366f1',
        hint: 'Custom household category',
        subcategories: activeSubs,
        isCustom: true
      });
    }
  }

  return result;
};

const normalizeCategoryStr = (str: string) =>
  str.toLowerCase().replace(/\s*&\s*/g, ' and ').replace(/\s+/g, ' ').trim();

export const getCategoryMeta = (
  categoryId?: string | null,
  target?: Target,
  overrideDoc?: TaxonomyOverrideDoc
): CategoryMeta => {
  if (!categoryId) return FALLBACK_META;
  const catLower = String(categoryId).trim().toLowerCase();
  const catNorm = normalizeCategoryStr(String(categoryId));

  const matches = (c: CategoryMeta) =>
    (c.id && (c.id.toLowerCase() === catLower || normalizeCategoryStr(c.id) === catNorm)) ||
    (c.name && (c.name.toLowerCase() === catLower || normalizeCategoryStr(c.name) === catNorm));

  if (target) {
    const effective = getEffectiveCategories(target, overrideDoc);
    const found = effective.find(matches);
    if (found) return found;
  }
  const found = ALL_CATEGORIES.find(matches);
  return found || FALLBACK_META;
};

export const getSubcategoriesFor = (
  target: Target,
  categoryId: string,
  overrideDoc?: TaxonomyOverrideDoc
): ExpenseSubcategory[] => {
  const meta = getCategoryMeta(categoryId, target, overrideDoc);
  return meta.subcategories || [];
};

// Sibling apps and cross-app target metadata (HomeTracker / CarTracker)
export const SOURCE_META: Record<LedgerSource, { icon: LucideIcon; color: string; label: string; app: string }> = {
  Expense: { icon: Receipt, color: '#4f46e5', label: 'Everyday', app: 'ExpenseTracker' },
  Home: { icon: House, color: '#10b981', label: 'Home', app: 'HomeTracker' },
  Car: { icon: Car, color: '#0284c7', label: 'Car', app: 'CarTracker' },
  Travel: { icon: Plane, color: '#0ea5e9', label: 'Travel', app: 'ExpenseTracker' },
  Business: { icon: Briefcase, color: '#6366f1', label: 'Business', app: 'ExpenseTracker' },
  Other: { icon: CircleEllipsis, color: '#94a3b8', label: 'Other', app: 'another app' }
};

export const PAYMENT_TYPES: PaymentType[] = [
  'Cash',
  'VISA - Wyndham Rewards - Anh Vuong',
  'VISA - United Explorer - Anh Vuong',
  'VISA - Venture X - Anh Vuong',
  'VISA - Citi Costco - Anh Vuong',
  'Gift Card - Vanilla - Anh Vuong'
];
