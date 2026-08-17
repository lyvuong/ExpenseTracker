import React, { useMemo, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { Store, Users } from 'lucide-react';
import { getCategoryMeta } from '../../constants/categories';
import {
  currentMonthKey,
  formatCompactMoney,
  formatMoney,
  monthKey,
  monthLabel,
  recentMonthKeys
} from '../../utils/transactions';
import type { LedgerEntry, Target } from '../../types';

interface InsightsProps {
  entries: LedgerEntry[];
}

const sumBy = (entries: LedgerEntry[], key: (e: LedgerEntry) => string) => {
  const map = new Map<string, number>();
  entries.forEach(e => {
    const k = key(e) || 'Unknown';
    map.set(k, (map.get(k) || 0) + e.amount);
  });
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value);
};

const TARGET_COLORS: Record<string, string> = {
  Family: '#10b981',
  Travel: '#0ea5e9',
  Business: '#6366f1',
  Other: '#94a3b8'
};

export const Insights: React.FC<InsightsProps> = ({ entries }) => {
  const [month, setMonth] = useState<string>(currentMonthKey());
  const [targetScope, setTargetScope] = useState<Target | 'All'>('All');

  const months = useMemo(() => {
    const fromData = Array.from(new Set(entries.map(e => monthKey(e.date)).filter(Boolean)));
    return Array.from(new Set([...recentMonthKeys(6), ...fromData])).sort().reverse();
  }, [entries]);

  const monthEntries = useMemo(() => {
    return entries.filter(e => {
      if (monthKey(e.date) !== month) return false;
      if (targetScope !== 'All') {
        if (targetScope === 'Travel' && e.target !== 'Travel') return false;
        if (targetScope === 'Business' && e.target !== 'Business') return false;
        if (targetScope === 'Family' && e.target !== 'Family') return false;
      }
      return true;
    });
  }, [entries, month, targetScope]);

  const byCategory = useMemo(() => sumBy(monthEntries, e => e.label), [monthEntries]);
  const byTarget = useMemo(() => sumBy(entries.filter(e => monthKey(e.date) === month), e => e.target || 'Family'), [entries, month]);
  const byVendor = useMemo(() => sumBy(monthEntries, e => e.vendor).slice(0, 6), [monthEntries]);
  const byMember = useMemo(() => sumBy(monthEntries, e => e.user), [monthEntries]);

  const trend = useMemo(() => {
    const keys = recentMonthKeys(6).reverse();
    return keys.map(k => {
      const filtered = entries.filter(e => {
        if (monthKey(e.date) !== k) return false;
        if (targetScope !== 'All' && e.target !== targetScope) return false;
        return true;
      });
      return {
        name: monthLabel(k, { short: true }).replace(/ \d{4}$/, ''),
        total: Math.round(filtered.reduce((sum, e) => sum + e.amount, 0) * 100) / 100
      };
    });
  }, [entries, targetScope]);

  const total = monthEntries.reduce((sum, e) => sum + e.amount, 0);

  const tooltipStyle = {
    borderRadius: 12,
    border: '1px solid #e2e8f0',
    fontSize: 12,
    boxShadow: '0 8px 24px -12px rgba(15,23,42,0.3)'
  };

  return (
    <section className="space-y-4">

      {/* Target Domain Scope Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {(['All', 'Family', 'Travel', 'Business'] as (Target | 'All')[]).map(t => {
          const isActive = targetScope === t;
          return (
            <button
              key={t}
              onClick={() => setTargetScope(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {t === 'All' ? 'All Domains' : t}
            </button>
          );
        })}
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              {targetScope === 'All' ? 'Total spent' : `${targetScope} spending`}
            </p>
            <p className="mt-1 text-3xl font-extrabold text-slate-900 tabular">{formatMoney(total)}</p>
            <p className="text-xs text-slate-500 mt-1">{monthEntries.length} entries in {monthLabel(month)}</p>
          </div>
          <select value={month} onChange={e => setMonth(e.target.value)} className="field w-auto">
            {months.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
        </div>

        {/* Target Domain Distribution */}
        {targetScope === 'All' && byTarget.length > 1 && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
            {byTarget.map(t => {
              const color = TARGET_COLORS[t.name] || '#64748b';
              return (
                <span
                  key={t.name}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5"
                  style={{ borderColor: `${color}40`, backgroundColor: `${color}10`, color }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  {t.name}: {formatMoney(t.value)}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* 6-month trend */}
      <div className="card p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-4">Last 6 months</p>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trend} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => formatCompactMoney(v)}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v) => [formatMoney(Number(v) || 0), 'Spent']}
                cursor={{ fill: '#eef2ff' }}
              />
              <Bar dataKey="total" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={44} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category split */}
      <div className="card p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-4">By category</p>
        {byCategory.length === 0 ? (
          <p className="text-sm text-slate-400">Nothing logged in {monthLabel(month)}.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={2}>
                    {byCategory.map(entry => (
                      <Cell key={entry.name} fill={getCategoryMeta(entry.name).color} stroke="#ffffff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatMoney(Number(v) || 0)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {byCategory.slice(0, 8).map(c => (
                <div key={c.name} className="flex items-center gap-2 text-sm">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: getCategoryMeta(c.name).color }} />
                  <span className="flex-1 text-slate-600 truncate">{c.name}</span>
                  <span className="font-semibold text-slate-900 tabular">{formatMoney(c.value)}</span>
                  <span className="w-10 text-right text-xs text-slate-400 tabular">
                    {total > 0 ? `${Math.round((c.value / total) * 100)}%` : '0%'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Top vendors */}
        <div className="card p-5">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">
            <Store className="w-3.5 h-3.5" /> Top merchants & vendors
          </p>
          {byVendor.length === 0 ? (
            <p className="text-sm text-slate-400">No vendors yet.</p>
          ) : (
            <div className="space-y-2">
              {byVendor.map(v => (
                <div key={v.name} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 truncate mr-2">{v.name}</span>
                  <span className="font-semibold text-slate-900 tabular">{formatMoney(v.value)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Members */}
        <div className="card p-5">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">
            <Users className="w-3.5 h-3.5" /> By member
          </p>
          {byMember.length === 0 ? (
            <p className="text-sm text-slate-400">No entries yet.</p>
          ) : (
            <div className="space-y-2">
              {byMember.map(m => (
                <div key={m.name} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700 truncate mr-2">{m.name}</span>
                  <span className="font-semibold text-slate-900 tabular">{formatMoney(m.value)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
