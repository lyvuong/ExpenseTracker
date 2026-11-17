import React, { useMemo, useState } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { getCategoryMeta } from '../../constants/categories';
import { EntryRow } from '../Expenses/EntryRow';
import { buildGroups, GROUP_KINDS, type EntryGroup, type GroupKind } from '../../utils/groups';
import { formatMoney, yearKey } from '../../utils/transactions';
import type { LedgerEntry, Trip } from '../../types';

interface GroupsViewProps {
  entries: LedgerEntry[];
  trips?: Trip[];
  onEditEntry?: (entry: LedgerEntry) => void;
  onViewEntry?: (entry: LedgerEntry) => void;
}

const fmtRange = (a: string, b: string) => (a === b ? a : `${a} → ${b}`);

export const GroupsView: React.FC<GroupsViewProps> = ({ entries, trips = [], onEditEntry, onViewEntry }) => {
  const [kind, setKind] = useState<GroupKind | 'All'>('All');
  const [year, setYear] = useState<string>('All');
  const [openKey, setOpenKey] = useState<string | null>(null);

  // Groups are always built from ALL entries so a trip's total never depends on the year filter;
  // the year selector only chooses which groups to list (by trip start date, as in Statements).
  const groups = useMemo(() => buildGroups(entries, trips), [entries, trips]);

  const years = useMemo(
    () => Array.from(new Set(groups.map(g => yearKey(g.anchorDate)).filter(Boolean))).sort().reverse(),
    [groups]
  );

  const visible = useMemo(
    () => groups.filter(g => (kind === 'All' || g.kind === kind) && (year === 'All' || yearKey(g.anchorDate) === year)).sort((a, b) => b.total - a.total),
    [groups, kind, year]
  );

  const open: EntryGroup | undefined = openKey ? groups.find(g => g.key === openKey) : undefined;

  if (open) {
    const max = Math.max(...open.byCategory.map(c => Math.abs(c.value)), 1);
    return (
      <section className="space-y-4">
        <button onClick={() => setOpenKey(null)} className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> All groups
        </button>
        <div className="card p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{open.kind}</p>
          <h2 className="text-lg font-extrabold text-slate-900">{open.name}</h2>
          <p className="mt-2 text-3xl font-extrabold text-slate-900 tabular">{formatMoney(open.total)}</p>
          <p className="text-xs text-slate-500 mt-1">
            {open.count} {open.count === 1 ? 'transaction' : 'transactions'} · {fmtRange(open.firstDate, open.lastDate)}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">By category</p>
          <div className="space-y-2.5">
            {open.byCategory.map(c => {
              const color = getCategoryMeta(c.name).color;
              return (
                <div key={c.name}>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 truncate mr-2">{c.name}</span>
                    <span className="font-semibold text-slate-900 tabular">{formatMoney(c.value)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 mt-1">
                    <div className="h-full rounded-full" style={{ width: `${Math.max(2, (Math.abs(c.value) / max) * 100)}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card p-2">
          {open.entries.map(e => (
            <EntryRow key={e.id} entry={e} onEdit={onEditEntry} onView={onViewEntry} showDate />
          ))}
        </div>
      </section>
    );
  }

  const present = GROUP_KINDS.filter(k => groups.some(g => g.kind === k));

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {(['All', ...present] as (GroupKind | 'All')[]).map(k => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border whitespace-nowrap ${
                kind === k ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              {k === 'Trip' ? 'Trips' : k === 'Car' ? 'Cars' : k === 'Home' ? 'Homes' : k === 'Office' ? 'Offices' : k === 'Family member' ? 'Family' : 'All'}
            </button>
          ))}
        </div>
        <select value={year} onChange={e => setYear(e.target.value)} className="field w-auto">
          <option value="All">All time</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {visible.length === 0 ? (
        <div className="card p-5 text-sm text-slate-500">
          No grouped expenses yet. Link expenses to a trip, office or family member when logging them; car and home
          expenses appear here once associated with a vehicle or home.
        </div>
      ) : (
        <div className="card p-2">
          {visible.map(g => (
            <button
              key={g.key}
              onClick={() => setOpenKey(g.key)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left hover:bg-slate-50"
            >
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-slate-900 truncate">{g.name}</span>
                <span className="block text-xs text-slate-500">
                  {g.kind} · {g.count} {g.count === 1 ? 'transaction' : 'transactions'} · {fmtRange(g.firstDate, g.lastDate)}
                </span>
              </span>
              <span className="font-bold text-slate-900 tabular">{formatMoney(g.total)}</span>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
};
