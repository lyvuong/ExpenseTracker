import React, { useMemo } from 'react';
import { ArrowRight, TrendingDown, TrendingUp, Plus, Users } from 'lucide-react';
import { EntryRow } from '../Expenses/EntryRow';
import { CATEGORY_META, getCategoryMeta } from '../../constants/categories';
import { currentMonthKey, formatMoney, monthKey, monthLabel, recentMonthKeys, todayISO } from '../../utils/transactions';
import type { ExpenseCategory, LedgerEntry } from '../../types';

interface DashboardProps {
  entries: LedgerEntry[];
  memberName: string;
  familyCode: string;
  onQuickAdd: (category?: ExpenseCategory) => void;
  onViewAll: () => void;
  onEditEntry: (entry: LedgerEntry) => void;
  onViewEntry: (entry: LedgerEntry) => void;
}

const QUICK_CATEGORIES: ExpenseCategory[] = ['Grocery', 'Food & Dining', 'Transportation', 'Shopping'];

export const Dashboard: React.FC<DashboardProps> = ({
  entries,
  memberName,
  familyCode,
  onQuickAdd,
  onViewAll,
  onEditEntry,
  onViewEntry
}) => {
  const thisMonth = currentMonthKey();
  const lastMonth = recentMonthKeys(2)[1];

  const stats = useMemo(() => {
    const inMonth = entries.filter(e => monthKey(e.date) === thisMonth);
    const inLastMonth = entries.filter(e => monthKey(e.date) === lastMonth);
    const total = inMonth.reduce((sum, e) => sum + e.amount, 0);
    const lastTotal = inLastMonth.reduce((sum, e) => sum + e.amount, 0);
    const today = todayISO();
    const todayTotal = entries.filter(e => e.date === today).reduce((sum, e) => sum + e.amount, 0);
    const dayOfMonth = Number(today.slice(8, 10)) || 1;

    const byCategory = new Map<string, number>();
    inMonth.forEach(e => byCategory.set(e.label, (byCategory.get(e.label) || 0) + e.amount));
    const topCategories = Array.from(byCategory.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const byMember = new Map<string, number>();
    inMonth.forEach(e => byMember.set(e.user || 'Unknown', (byMember.get(e.user || 'Unknown') || 0) + e.amount));

    return {
      total,
      lastTotal,
      count: inMonth.length,
      todayTotal,
      dailyAverage: total / dayOfMonth,
      topCategories,
      byMember: Array.from(byMember.entries()).sort((a, b) => b[1] - a[1])
    };
  }, [entries, thisMonth, lastMonth]);

  const delta = stats.lastTotal > 0 ? ((stats.total - stats.lastTotal) / stats.lastTotal) * 100 : 0;
  const isUp = delta > 0;
  const recent = entries.slice(0, 6);
  const maxCategory = stats.topCategories[0]?.[1] || 1;

  return (
    <section className="space-y-4">

      {/* Month summary */}
      <div className="card p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{monthLabel(thisMonth)}</p>
            <p className="mt-1 text-4xl font-extrabold text-slate-900 tabular">{formatMoney(stats.total)}</p>
            <p className="mt-1.5 text-xs text-slate-500">
              {stats.count} {stats.count === 1 ? 'entry' : 'entries'} · {formatMoney(stats.dailyAverage)}/day average
            </p>
          </div>
          {stats.lastTotal > 0 && (
            <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg ${
              isUp ? 'text-red-600 bg-red-50' : 'text-emerald-700 bg-emerald-50'
            }`}>
              {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {Math.abs(delta).toFixed(0)}%
            </div>
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-50 px-3.5 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Today</p>
            <p className="text-lg font-bold text-slate-900 tabular">{formatMoney(stats.todayTotal)}</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-3.5 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{monthLabel(lastMonth, { short: true })}</p>
            <p className="text-lg font-bold text-slate-900 tabular">{formatMoney(stats.lastTotal)}</p>
          </div>
        </div>
      </div>

      {/* Quick add */}
      <div className="card p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">Quick add</p>
        <div className="grid grid-cols-4 gap-2">
          {QUICK_CATEGORIES.map(category => {
            const { icon: Icon, color } = getCategoryMeta(category);
            return (
              <button
                key={category}
                onClick={() => onQuickAdd(category)}
                className="flex flex-col items-center gap-1.5 px-1 py-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors"
              >
                <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}1a` }}>
                  <Icon className="w-4.5 h-4.5" style={{ color }} />
                </span>
                <span className="text-[11px] font-semibold text-slate-600 text-center leading-tight">{category}</span>
              </button>
            );
          })}
        </div>
        <button
          onClick={() => onQuickAdd()}
          className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Log an expense as {memberName}
        </button>
      </div>

      {/* Category breakdown */}
      <div className="card p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-4">Top categories this month</p>
        {stats.topCategories.length === 0 ? (
          <p className="text-sm text-slate-400">Nothing logged this month yet.</p>
        ) : (
          <div className="space-y-3">
            {stats.topCategories.map(([label, amount]) => {
              const { color } = getCategoryMeta(label);
              const meta = CATEGORY_META.find(c => c.id === label);
              const Icon = meta?.icon;
              return (
                <div key={label} className="flex items-center gap-3">
                  {Icon && (
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}1a` }}>
                      <Icon className="w-3.5 h-3.5" style={{ color }} />
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-700 truncate">{label}</span>
                      <span className="text-xs font-bold text-slate-900 tabular">{formatMoney(amount)}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.max(4, (amount / maxCategory) * 100)}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Who spent what */}
      {familyCode && stats.byMember.length > 0 && (
        <div className="card p-5">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">
            <Users className="w-3.5 h-3.5" />
            Household members this month
          </p>
          <div className="space-y-2">
            {stats.byMember.map(([name, amount]) => (
              <div key={name} className="flex items-center justify-between text-sm">
                <span className="text-slate-700 truncate">{name}</span>
                <span className="font-bold text-slate-900 tabular">{formatMoney(amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent activity */}
      <div className="card p-2">
        <div className="flex items-center justify-between px-3 py-2">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Recent activity</h3>
          <button onClick={onViewAll} className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
            View all <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        {recent.length === 0 ? (
          <p className="px-3 py-6 text-sm text-slate-400 text-center">No entries yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {recent.map(entry => (
              <EntryRow key={entry.id} entry={entry} onEdit={onEditEntry} onView={onViewEntry} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
