import React from 'react';
import { Lock } from 'lucide-react';
import { getCategoryMeta, SOURCE_META } from '../../constants/categories';
import { formatMoney } from '../../utils/transactions';
import type { ExpenseTarget, LedgerEntry } from '../../types';

interface EntryRowProps {
  entry: LedgerEntry;
  onEdit?: (entry: LedgerEntry) => void;
  /** Opens the read-only detail sheet for entries owned by a sibling app. */
  onView?: (entry: LedgerEntry) => void;
}

export const EntryRow: React.FC<EntryRowProps> = ({ entry, onEdit, onView }) => {
  const isExpense = entry.source === 'Expense';
  const meta = getCategoryMeta(entry.label, entry.target as ExpenseTarget);
  const sourceMeta = SOURCE_META[entry.source] || SOURCE_META.Expense;
  const Icon = isExpense ? meta.icon : sourceMeta.icon;
  const color = isExpense ? meta.color : sourceMeta.color;
  const action = isExpense ? onEdit : onView;

  const targetBadge = entry.target === 'Travel'
    ? { text: 'Travel', bg: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300' }
    : entry.target === 'Business'
    ? { text: 'Business', bg: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300' }
    : null;

  return (
    <button
      type="button"
      disabled={!action}
      onClick={action ? () => action(entry) : undefined}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
        action ? 'hover:bg-slate-50' : 'cursor-default'
      }`}
    >
      <span
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}1a` }}
      >
        <Icon className="w-4.5 h-4.5" style={{ color }} />
      </span>

      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-semibold text-slate-900 truncate">{entry.vendor || 'Unknown vendor'}</span>
          {!isExpense && (
            <span
              className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
              style={{ color: sourceMeta.color, backgroundColor: `${sourceMeta.color}1a` }}
            >
              {sourceMeta.label}
            </span>
          )}
          {isExpense && targetBadge && (
            <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${targetBadge.bg}`}>
              {targetBadge.text}
            </span>
          )}
          {entry.targetEntityLabel && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 truncate max-w-[120px]">
              {entry.targetEntityLabel}
            </span>
          )}
          {entry.amount < 0 && (
            <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded text-amber-700 bg-amber-50">
              Refund
            </span>
          )}
          {entry.isTaxDeductible && (
            <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded text-emerald-700 bg-emerald-50">
              Tax
            </span>
          )}
        </span>
        <span className="block text-xs text-slate-500 truncate">
          {[entry.label, entry.detail, entry.user].filter(Boolean).join(' · ')}
        </span>
      </span>

      <span className="text-right shrink-0">
        <span className="block text-sm font-bold text-slate-900 tabular">{formatMoney(entry.amount)}</span>
        <span className="block text-[11px] text-slate-400">
          {entry.time || ''}
          {!isExpense && <Lock className="inline w-2.5 h-2.5 ml-1 -mt-0.5" />}
        </span>
      </span>
    </button>
  );
};
