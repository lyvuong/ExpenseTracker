import React, { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, Download, Plus, ReceiptText } from 'lucide-react';
import { EntryRow } from './EntryRow';
import { CATEGORIES, SOURCE_META } from '../../constants/categories';
import { formatDayLabel, formatMoney, monthKey, monthLabel } from '../../utils/transactions';
import type { LedgerEntry, LedgerSource } from '../../types';

interface ExpenseListProps {
  entries: LedgerEntry[];
  onAddExpense: () => void;
  onEditEntry: (entry: LedgerEntry) => void;
  onViewEntry: (entry: LedgerEntry) => void;
  onExportCSV: (entries: LedgerEntry[]) => void;
}

const SOURCES: (LedgerSource | 'All')[] = ['All', 'Expense', 'Home', 'Car'];

export const ExpenseList: React.FC<ExpenseListProps> = ({
  entries,
  onAddExpense,
  onEditEntry,
  onViewEntry,
  onExportCSV
}) => {
  const [search, setSearch] = useState('');
  const [month, setMonth] = useState('all');
  const [category, setCategory] = useState('all');
  const [member, setMember] = useState('all');
  const [source, setSource] = useState<LedgerSource | 'All'>('All');
  const [showFilters, setShowFilters] = useState(false);

  const months = useMemo(
    () => Array.from(new Set(entries.map(e => monthKey(e.date)).filter(Boolean))).sort().reverse(),
    [entries]
  );
  const members = useMemo(
    () => Array.from(new Set(entries.map(e => e.user).filter(Boolean))).sort(),
    [entries]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return entries.filter(e => {
      if (source !== 'All' && e.source !== source) return false;
      if (month !== 'all' && monthKey(e.date) !== month) return false;
      if (category !== 'all' && e.label !== category) return false;
      if (member !== 'all' && e.user !== member) return false;
      if (!term) return true;
      return [e.vendor, e.label, e.detail, e.notes, e.user, e.paymentType]
        .filter(Boolean)
        .some(v => v!.toLowerCase().includes(term));
    });
  }, [entries, search, month, category, member, source]);

  const total = filtered.reduce((sum, e) => sum + e.amount, 0);

  const grouped = useMemo(() => {
    const map = new Map<string, LedgerEntry[]>();
    filtered.forEach(e => {
      const list = map.get(e.date) || [];
      list.push(e);
      map.set(e.date, list);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const hasActiveFilter = month !== 'all' || category !== 'all' || member !== 'all' || source !== 'All';

  return (
    <section className="space-y-4">

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search vendor, category, notes…"
            className="field pl-9"
          />
        </div>
        <button
          onClick={() => setShowFilters(v => !v)}
          className={`p-2.5 rounded-xl border transition-colors ${
            showFilters || hasActiveFilter
              ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
              : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
          }`}
          aria-label="Toggle filters"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
        <button
          onClick={() => onExportCSV(filtered)}
          className="p-2.5 rounded-xl border bg-white border-slate-200 text-slate-500 hover:border-slate-300 transition-colors"
          aria-label="Export filtered entries as CSV"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>

      {showFilters && (
        <div className="card p-4 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {SOURCES.map(s => (
              <button
                key={s}
                onClick={() => setSource(s)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  source === s
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {s === 'All' ? 'All apps' : SOURCE_META[s].label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="field-label" htmlFor="filter-month">Month</label>
              <select id="filter-month" value={month} onChange={e => setMonth(e.target.value)} className="field">
                <option value="all">All months</option>
                {months.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="filter-category">Category</label>
              <select id="filter-category" value={category} onChange={e => setCategory(e.target.value)} className="field">
                <option value="all">All categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="filter-member">Member</label>
              <select id="filter-member" value={member} onChange={e => setMember(e.target.value)} className="field">
                <option value="all">Everyone</option>
                {members.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          {hasActiveFilter && (
            <button
              onClick={() => { setMonth('all'); setCategory('all'); setMember('all'); setSource('All'); }}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      <div className="flex items-baseline justify-between px-1">
        <span className="text-xs font-semibold text-slate-500">
          {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
        </span>
        <span className="text-sm font-bold text-slate-900 tabular">{formatMoney(total)}</span>
      </div>

      {grouped.length === 0 ? (
        <div className="card p-10 text-center">
          <ReceiptText className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">No expenses yet</p>
          <p className="text-xs text-slate-500 mt-1 mb-4">Log your first grocery run, lunch or trip.</p>
          <button
            onClick={onAddExpense}
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add expense
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([date, dayEntries]) => (
            <div key={date} className="card p-2">
              <div className="flex items-baseline justify-between px-3 py-2">
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">{formatDayLabel(date)}</h3>
                <span className="text-xs font-semibold text-slate-400 tabular">
                  {formatMoney(dayEntries.reduce((sum, e) => sum + e.amount, 0))}
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {dayEntries.map(entry => (
                  <EntryRow key={entry.id} entry={entry} onEdit={onEditEntry} onView={onViewEntry} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
