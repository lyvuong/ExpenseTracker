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
  House,
  Car,
  Receipt
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ExpenseCategory, ExpenseSubcategory, LedgerSource, PaymentType } from '../types';

export interface CategoryMeta {
  id: ExpenseCategory;
  icon: LucideIcon;
  color: string;
  hint: string;
  /**
   * Optional second level, kept short so the whole set fits on one phone
   * screen. Picking one is never required — "Expense - Grocery" on its own
   * stays a valid category string.
   */
  subcategories: ExpenseSubcategory[];
}

export const CATEGORY_META: CategoryMeta[] = [
  {
    id: 'Grocery', icon: ShoppingCart, color: '#16a34a', hint: 'Supermarket, produce, butcher',
    subcategories: ['Supermarket', 'Warehouse Club', 'Produce & Market', 'Meat & Seafood', 'Bakery', 'Beverages']
  },
  {
    id: 'Food & Dining', icon: UtensilsCrossed, color: '#f97316', hint: 'Lunch, dinner, coffee, takeout',
    subcategories: ['Restaurant', 'Takeout & Delivery', 'Coffee & Tea', 'Fast Food', 'Bar & Drinks', 'Dessert & Snacks']
  },
  {
    id: 'Travel', icon: Plane, color: '#0ea5e9', hint: 'Flights, hotels, vacations',
    subcategories: ['Flights', 'Lodging', 'Car Rental', 'Activities & Tours', 'Travel Food', 'Fees & Baggage']
  },
  {
    id: 'Transportation', icon: Bus, color: '#6366f1', hint: 'Gas, transit, parking, rideshare',
    subcategories: ['Fuel', 'Public Transit', 'Rideshare & Taxi', 'Parking', 'Tolls']
  },
  {
    id: 'Household Supplies', icon: SprayCan, color: '#0891b2', hint: 'Cleaning, paper goods, kitchen',
    subcategories: ['Cleaning', 'Paper Goods', 'Kitchen', 'Laundry', 'Storage & Organization', 'Tools & Hardware']
  },
  {
    id: 'Health & Medical', icon: HeartPulse, color: '#ef4444', hint: 'Doctor, pharmacy, dental',
    subcategories: ['Doctor Visit', 'Dental', 'Vision', 'Pharmacy', 'Therapy & Mental Health', 'Lab & Imaging']
  },
  {
    id: 'Shopping', icon: ShoppingBag, color: '#ec4899', hint: 'Clothing, electronics, home goods',
    subcategories: ['Clothing', 'Shoes & Accessories', 'Electronics', 'Home & Furniture', 'Books & Media', 'Sporting Goods']
  },
  {
    // Domain renewals, software and AI tooling, cloud storage — recurring or
    // one-off. Distinct from Shopping - Electronics, which is physical gear.
    id: 'Digital & Tech', icon: Laptop, color: '#8b5cf6', hint: 'Domains, software, AI tools, cloud storage',
    subcategories: ['Domains & Hosting', 'Software & Apps', 'AI & Dev Tools', 'Cloud & Storage', 'Online Services', 'Devices & Accessories']
  },
  {
    id: 'Entertainment', icon: Clapperboard, color: '#a855f7', hint: 'Streaming, movies, events, hobbies',
    subcategories: ['Streaming', 'Movies & Theater', 'Concerts & Events', 'Games', 'Hobbies', 'Sports & Recreation']
  },
  {
    id: 'Education', icon: GraduationCap, color: '#14b8a6', hint: 'Tuition, books, courses',
    subcategories: ['Tuition', 'Books & Supplies', 'Courses & Training', 'Tutoring', 'School Fees', 'Exams & Certification']
  },
  {
    id: 'Personal Care', icon: Sparkles, color: '#f43f5e', hint: 'Haircut, salon, gym',
    subcategories: ['Haircut & Salon', 'Gym & Fitness', 'Spa & Massage', 'Cosmetics', 'Nails']
  },
  {
    id: 'Kids & Childcare', icon: Baby, color: '#f59e0b', hint: 'Daycare, school, activities',
    subcategories: ['Daycare', 'Babysitting', 'School', 'Activities & Camps', 'Clothing', 'Toys & Gear']
  },
  {
    id: 'Pets', icon: PawPrint, color: '#84cc16', hint: 'Food, vet, grooming',
    subcategories: ['Food & Treats', 'Vet', 'Grooming', 'Supplies', 'Boarding & Sitting', 'Medication']
  },
  {
    // Auto policies belong to CarTracker and homeowners to HomeTracker.
    id: 'Insurance', icon: ShieldCheck, color: '#64748b', hint: 'Health, life, dental policies',
    subcategories: ['Health', 'Dental & Vision', 'Life', 'Disability', 'Umbrella']
  },
  {
    id: 'Gifts & Donations', icon: Gift, color: '#d946ef', hint: 'Presents, charity',
    subcategories: ['Gifts', 'Charity', 'Religious', 'Fundraisers', 'Cards & Wrapping']
  },
  {
    id: 'Other', icon: CircleEllipsis, color: '#94a3b8', hint: 'Anything else',
    subcategories: ['Fees & Charges', 'Taxes', 'Cash Withdrawal', 'Reimbursable']
  }
];

export const CATEGORIES: ExpenseCategory[] = CATEGORY_META.map(c => c.id);

const FALLBACK_META: CategoryMeta = {
  id: 'Other',
  icon: CircleEllipsis,
  color: '#94a3b8',
  hint: '',
  subcategories: []
};

const META_BY_ID = new Map(CATEGORY_META.map(c => [c.id as string, c]));

export const getCategoryMeta = (category: string): CategoryMeta =>
  META_BY_ID.get(category) || FALLBACK_META;

export const getSubcategories = (category: string): ExpenseSubcategory[] =>
  META_BY_ID.get(category)?.subcategories || [];

export const PAYMENT_TYPES: PaymentType[] = [
  'Cash',
  'VISA - Wyndham Rewards - Anh Vuong',
  'VISA - United Explorer - Anh Vuong',
  'VISA - Venture X - Anh Vuong',
  'VISA - Citi Costco - Anh Vuong',
  'Gift Card - Vanilla - Anh Vuong'
];

// Sibling apps writing into the same household ledger. `app` names the app
// that owns an entry, so a read-only row can say where to go to edit it.
export const SOURCE_META: Record<LedgerSource, { icon: LucideIcon; color: string; label: string; app: string }> = {
  Expense: { icon: Receipt, color: '#4f46e5', label: 'Everyday', app: 'ExpenseTracker' },
  Home: { icon: House, color: '#10b981', label: 'Home', app: 'HomeTracker' },
  Car: { icon: Car, color: '#0284c7', label: 'Car', app: 'CarTracker' },
  Other: { icon: CircleEllipsis, color: '#94a3b8', label: 'Other', app: 'another app' }
};
