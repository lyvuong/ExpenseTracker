import React, { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, Download, ReceiptText, UsersRound, Plane, Briefcase } from 'lucide-react';
import { EntryRow } from './EntryRow';
import { getEffectiveCategories, getSubcategoriesFor } from '../../constants/categories';
import { CANONICAL_MEMBERS, currentYearKey, formatDayLabel, formatMoney, normalizeMemberName, yearKey } from '../../utils/transactions';
import type { ExpenseTarget, LedgerEntry, Target, TaxonomyOverrideDoc } from '../../types';

interface ExpenseListProps {
  entries: LedgerEntry[];
  taxonomyOverrideDoc?: TaxonomyOverrideDoc;
  onAddExpense: (target?: ExpenseTarget) => void;
  onEditEntry: (entry: LedgerEntry) => void;
  onViewEntry: (entry: LedgerEntry) => void;
  onExportCSV: (entries: LedgerEntry[]) => void;
}

const TARGET_FILTERS: (Target | 'All')[] = ['All', 'Family', 'Travel', 'Business'];

export const ExpenseList: React.FC<ExpenseListProps> = ({
  entries,
  taxonomyOverrideDoc,
  onAddExpense,
  onEditEntry,
  onViewEntry,
  onExportCSV
}) => {
  const [search, setSearch] = useState('');
  const [dateMode, setDateMode] = useState<'year' | 'range'>('year');
  const [year, setYear] = useState(currentYearKey());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [targetFilter, setTargetFilter] = useState<Target | 'All'>('All');
  const [category, setCategory] = useState('all');
  const [subcategory, setSubcategory] = useState('all');
  const [member, setMember] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const years = useMemo(() => {
    const set = new Set(entries.map(e => yearKey(e.date)).filter(Boolean));
    set.add(currentYearKey());
    return Array.from(set).sort().reverse();
  }, [entries]);

  const switchToRange = () => {
    if (dateMode !== 'range') {
      setStartDate(prev => prev || (year !== 'all' ? `${year}-01-01` : ''));
      setEndDate(prev => prev || (year !== 'all' ? `${year}-12-31` : ''));
      setDateMode('range');
    }
  };

  const isDefaultScope = dateMode === 'year' && year === currentYearKey();
  const resetScope = () => {
    setDateMode('year');
    setYear(currentYearKey());
  };

  const members = useMemo(
    () => Array.from(new Set([...CANONICAL_MEMBERS, ...entries.map(e => normalizeMemberName(e.user)).filter(Boolean)])).sort(),
    [entries]
  );

  const availableCategories = useMemo(() => {
    if (targetFilter !== 'All') {
      return getEffectiveCategories(targetFilter, taxonomyOverrideDoc).map(c => c.id);
    }
    const targets: Target[] = ['Family', 'Travel', 'Business'];
    const all = targets.flatMap(t => getEffectiveCategories(t, taxonomyOverrideDoc).map(c => c.id));
    return Array.from(new Set(all));
  }, [targetFilter, taxonomyOverrideDoc]);

  const availableSubcategories = useMemo(() => {
    if (category === 'all') return [];
    const target = (targetFilter === 'Travel' ? 'Travel' : targetFilter === 'Business' ? 'Business' : 'Family') as ExpenseTarget;
    return getSubcategoriesFor(target, category, taxonomyOverrideDoc);
  }, [category, targetFilter, taxonomyOverrideDoc]);

  const selectCategory = (next: string) => {
    setCategory(next);
    setSubcategory('all');
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return entries.filter(e => {
      if (targetFilter !== 'All') {
        if (targetFilter === 'Travel' && e.target !== 'Travel') return false;
        if (targetFilter === 'Business' && e.target !== 'Business') return false;
        if (targetFilter === 'Family' && e.target !== 'Family') return false;
      }
      if (dateMode === 'year') {
        if (year !== 'all' && yearKey(e.date) !== year) return false;
      } else {
        if (startDate && e.date < startDate) return false;
        if (endDate && e.date > endDate) return false;
      }
      if (category !== 'all' && e.label.toLowerCase() !== category.toLowerCase()) return false;
      if (subcategory !== 'all' && e.detail.toLowerCase() !== subcategory.toLowerCase()) return false;
      if (member !== 'all' && normalizeMemberName(e.user).toLowerCase() !== normalizeMemberName(member).toLowerCase()) return false;
      if (!term) return true;
      return [e.vendor, e.label, e.detail, e.notes, e.user, e.paymentType, e.targetEntityLabel]
        .filter(Boolean)
        .some(v => v!.toLowerCase().includes(term));
    });
  }, [entries, search, dateMode, year, startDate, endDate, targetFilter, category, subcategory, member]);

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

  const hasActiveFilter =
    targetFilter !== 'All' || category !== 'all' || subcategory !== 'all' || member !== 'all';

  return (
    <section className="space-y-4">

      {/* Target Domain Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {TARGET_FILTERS.map(t => {
          const isActive = targetFilter === t;
          return (
            <button
              key={t}
              onClick={() => {
                setTargetFilter(t);
                setCategory('all');
                setSubcategory('all');
              }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {t === 'Family' && <UsersRound className="w-3 h-3 text-emerald-500" />}
              {t === 'Travel' && <Plane className="w-3 h-3 text-sky-500" />}
              {t === 'Business' && <Briefcase className="w-3 h-3 text-indigo-500" />}
              <span>{t === 'All' ? 'All Domains' : t}</span>
            </button>
          );
        })}
      </div>

      {/* Search & Actions */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search transactions, merchants, categories, notes…"
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
          title="Export transactions as CSV"
          aria-label="Export transactions as CSV"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>

      {/* Date scope */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-xl border border-slate-200 bg-white p-0.5">
          <button
            onClick={() => setDateMode('year')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              dateMode === 'year' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Year
          </button>
          <button
            onClick={switchToRange}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              dateMode === 'range' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Date range
          </button>
        </div>
        {dateMode === 'year' ? (
          <select
            value={year}
            onChange={e => setYear(e.target.value)}
            className="field w-auto"
            aria-label="Year"
          >
            <option value="all">All years</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="field w-auto"
              aria-label="Start date"
            />
            <span className="text-xs text-slate-400">→</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="field w-auto"
              aria-label="End date"
            />
          </div>
        )}
        {!isDefaultScope && (
          <button
            onClick={resetScope}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 ml-1"
          >
            Reset to current year
          </button>
        )}
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="card p-4 space-y-3 bg-slate-50 border-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="field-label" htmlFor="filter-cat">Category</label>
              <select
                id="filter-cat"
                value={category}
                onChange={e => selectCategory(e.target.value)}
                className="field bg-white"
              >
                <option value="all">All categories</option>
                {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="filter-sub">Subcategory</label>
              <select
                id="filter-sub"
                value={subcategory}
                onChange={e => setSubcategory(e.target.value)}
                disabled={category === 'all' || availableSubcategories.length === 0}
                className="field bg-white disabled:opacity-50"
              >
                <option value="all">All subcategories</option>
                {availableSubcategories.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="filter-member">Logged by</label>
              <select
                id="filter-member"
                value={member}
                onChange={e => setMember(e.target.value)}
                className="field bg-white"
              >
                <option value="all">Everyone</option>
                {members.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          {hasActiveFilter && (
            <button
              onClick={() => { setTargetFilter('All'); selectCategory('all'); setMember('all'); }}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Entry Count & Total */}
      <div className="flex items-baseline justify-between px-1">
        <span className="text-xs font-semibold text-slate-500">
          {filtered.length} {filtered.length === 1 ? 'transaction' : 'transactions'}
        </span>
        <span className="text-sm font-bold text-slate-900 tabular">{formatMoney(total)}</span>
      </div>

      {grouped.length === 0 ? (
        <div className="card p-10 text-center">
          <ReceiptText className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">No transactions found</p>
          <p className="text-xs text-slate-500 mt-1 mb-4">Log a family, travel or business transaction.</p>
          <div className="flex justify-center gap-2">
            <button
              onClick={() => onAddExpense('Family')}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
            >
              <UsersRound className="w-3.5 h-3.5" />
              Family
            </button>
            <button
              onClick={() => onAddExpense('Travel')}
              className="inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
            >
              <Plane className="w-3.5 h-3.5" />
              Travel
            </button>
            <button
              onClick={() => onAddExpense('Business')}
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
            >
              <Briefcase className="w-3.5 h-3.5" />
              Business
            </button>
          </div>
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
