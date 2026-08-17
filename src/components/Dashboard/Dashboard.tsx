import React, { useMemo, useState } from 'react';
import { ArrowRight, TrendingDown, TrendingUp, Plus, Users } from 'lucide-react';
import { EntryRow } from '../Expenses/EntryRow';
import { CATEGORIES_BY_TARGET, getCategoryMeta } from '../../constants/categories';
import { currentMonthKey, formatMoney, monthKey, monthLabel, recentMonthKeys, todayISO } from '../../utils/transactions';
import type { ExpenseTarget, LedgerEntry } from '../../types';

interface DashboardProps {
  entries: LedgerEntry[];
  memberName: string;
  familyCode: string;
  onQuickAdd: (category?: string, target?: ExpenseTarget) => void;
  onViewAll: () => void;
  onEditEntry: (entry: LedgerEntry) => void;
  onViewEntry: (entry: LedgerEntry) => void;
}

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
  const [selectedTarget, setSelectedTarget] = useState<ExpenseTarget>('Family');

  const stats = useMemo(() => {
    const inMonth = entries.filter(e => monthKey(e.date) === thisMonth);
    const inLastMonth = entries.filter(e => monthKey(e.date) === lastMonth);
    const total = inMonth.reduce((sum, e) => sum + e.amount, 0);
    const lastTotal = inLastMonth.reduce((sum, e) => sum + e.amount, 0);
    const today = todayISO();
    const todayTotal = entries.filter(e => e.date === today).reduce((sum, e) => sum + e.amount, 0);
    const dayOfMonth = Number(today.slice(8, 10)) || 1;

    // Target breakdown
    const byTarget = new Map<string, number>();
    inMonth.forEach(e => {
      const t = e.target || 'Family';
      byTarget.set(t, (byTarget.get(t) || 0) + e.amount);
    });

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
      byTarget: Array.from(byTarget.entries()),
      byMember: Array.from(byMember.entries()).sort((a, b) => b[1] - a[1])
    };
  }, [entries, thisMonth, lastMonth]);

  const delta = stats.lastTotal > 0 ? ((stats.total - stats.lastTotal) / stats.lastTotal) * 100 : 0;
  const isUp = delta > 0;
  const recent = entries.slice(0, 6);
  const maxCategory = stats.topCategories[0]?.[1] || 1;

  const quickCategories = CATEGORIES_BY_TARGET[selectedTarget].slice(0, 4);

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

        {/* Domain mini totals */}
        {stats.byTarget.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {stats.byTarget.map(([targetName, amt]) => {
              const isTravel = targetName === 'Travel';
              const isBusiness = targetName === 'Business';
              const colorCls = isTravel
                ? 'bg-sky-50 text-sky-700 border-sky-200'
                : isBusiness
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200';
              return (
                <span key={targetName} className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${colorCls}`}>
                  {targetName}: {formatMoney(amt)}
                </span>
              );
            })}
          </div>
        )}

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

      {/* Quick Add with Domain Switcher */}
      <div className="card p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Quick add</p>
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
            {(['Family', 'Travel', 'Business'] as ExpenseTarget[]).map(t => {
              const isActive = selectedTarget === t;
              return (
                <button
                  key={t}
                  onClick={() => setSelectedTarget(t)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                    isActive ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {quickCategories.map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => onQuickAdd(cat.id, selectedTarget)}
                className="flex flex-col items-center gap-1.5 px-1 py-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors"
              >
                <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${cat.color}1a` }}>
                  <Icon className="w-4.5 h-4.5" style={{ color: cat.color }} />
                </span>
                <span className="text-[11px] font-semibold text-slate-600 text-center leading-tight truncate w-full px-1">{cat.name}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onQuickAdd(undefined, selectedTarget)}
          className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Log a {selectedTarget} expense as {memberName}
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
              const meta = getCategoryMeta(label);
              const Icon = meta.icon;
              const color = meta.color;
              return (
                <div key={label} className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}1a` }}>
                    <Icon className="w-3.5 h-3.5" style={{ color }} />
                  </span>
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
