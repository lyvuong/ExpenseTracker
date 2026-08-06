import {
  ShoppingCart,
  UtensilsCrossed,
  Plane,
  Bus,
  Zap,
  SprayCan,
  HeartPulse,
  ShoppingBag,
  Clapperboard,
  GraduationCap,
  Sparkles,
  Baby,
  PawPrint,
  Repeat,
  ShieldCheck,
  Gift,
  CircleEllipsis,
  House,
  Car,
  Receipt
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ExpenseCategory, LedgerSource, PaymentType } from '../types';

export interface CategoryMeta {
  id: ExpenseCategory;
  icon: LucideIcon;
  color: string;
  hint: string;
}

export const CATEGORY_META: CategoryMeta[] = [
  { id: 'Grocery', icon: ShoppingCart, color: '#16a34a', hint: 'Supermarket, produce, butcher' },
  { id: 'Food & Dining', icon: UtensilsCrossed, color: '#f97316', hint: 'Lunch, dinner, coffee, takeout' },
  { id: 'Travel', icon: Plane, color: '#0ea5e9', hint: 'Flights, hotels, vacations' },
  { id: 'Transportation', icon: Bus, color: '#6366f1', hint: 'Gas, transit, parking, rideshare' },
  { id: 'Utilities', icon: Zap, color: '#eab308', hint: 'Power, water, internet, phone' },
  { id: 'Household Supplies', icon: SprayCan, color: '#0891b2', hint: 'Cleaning, paper goods, kitchen' },
  { id: 'Health & Medical', icon: HeartPulse, color: '#ef4444', hint: 'Doctor, pharmacy, dental' },
  { id: 'Shopping', icon: ShoppingBag, color: '#ec4899', hint: 'Clothing, electronics, home goods' },
  { id: 'Entertainment', icon: Clapperboard, color: '#a855f7', hint: 'Movies, events, hobbies' },
  { id: 'Education', icon: GraduationCap, color: '#14b8a6', hint: 'Tuition, books, courses' },
  { id: 'Personal Care', icon: Sparkles, color: '#f43f5e', hint: 'Haircut, salon, gym' },
  { id: 'Kids & Childcare', icon: Baby, color: '#f59e0b', hint: 'Daycare, school, activities' },
  { id: 'Pets', icon: PawPrint, color: '#84cc16', hint: 'Food, vet, grooming' },
  { id: 'Subscriptions', icon: Repeat, color: '#8b5cf6', hint: 'Streaming, apps, memberships' },
  { id: 'Insurance', icon: ShieldCheck, color: '#64748b', hint: 'Health, life, auto policies' },
  { id: 'Gifts & Donations', icon: Gift, color: '#d946ef', hint: 'Presents, charity' },
  { id: 'Other', icon: CircleEllipsis, color: '#94a3b8', hint: 'Anything else' }
];

export const CATEGORIES: ExpenseCategory[] = CATEGORY_META.map(c => c.id);

const META_BY_ID = new Map(CATEGORY_META.map(c => [c.id as string, c]));

export const getCategoryMeta = (category: string): CategoryMeta =>
  META_BY_ID.get(category) || { id: 'Other', icon: CircleEllipsis, color: '#94a3b8', hint: '' };

export const PAYMENT_TYPES: PaymentType[] = [
  'Cash',
  'Credit Card',
  'Debit Card',
  'Bank Transfer',
  'Check',
  'Other'
];

// Sibling apps writing into the same household ledger. `app` names the app
// that owns an entry, so a read-only row can say where to go to edit it.
export const SOURCE_META: Record<LedgerSource, { icon: LucideIcon; color: string; label: string; app: string }> = {
  Expense: { icon: Receipt, color: '#4f46e5', label: 'Everyday', app: 'ExpenseTracker' },
  Home: { icon: House, color: '#10b981', label: 'Home', app: 'HomeTracker' },
  Car: { icon: Car, color: '#0284c7', label: 'Car', app: 'CarTracker' },
  Other: { icon: CircleEllipsis, color: '#94a3b8', label: 'Other', app: 'another app' }
};
