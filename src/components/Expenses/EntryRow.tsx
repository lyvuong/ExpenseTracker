import React from 'react';
import { Lock } from 'lucide-react';
import { getCategoryMeta, SOURCE_META } from '../../constants/categories';
import { formatMoney } from '../../utils/transactions';
import type { LedgerEntry } from '../../types';

interface EntryRowProps {
  entry: LedgerEntry;
  onEdit?: (entry: LedgerEntry) => void;
  /** Opens the read-only detail sheet for entries owned by a sibling app. */
  onView?: (entry: LedgerEntry) => void;
}

/**
 * One ledger line. Entries created by the sibling apps (HomeTracker,
 * CarTracker) show up read-only with their own badge — they are edited where
 * they were created, so tapping one opens a detail sheet that says so.
 */
export const EntryRow: React.FC<EntryRowProps> = ({ entry, onEdit, onView }) => {
  const isExpense = entry.source === 'Expense';
  const meta = getCategoryMeta(entry.label);
  const sourceMeta = SOURCE_META[entry.source];
  const Icon = isExpense ? meta.icon : sourceMeta.icon;
  const color = isExpense ? meta.color : sourceMeta.color;
  const action = isExpense ? onEdit : onView;

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
        <span className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-slate-900 truncate">{entry.vendor || 'Unknown vendor'}</span>
          {!isExpense && (
            <span
              className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
              style={{ color: sourceMeta.color, backgroundColor: `${sourceMeta.color}1a` }}
            >
              {sourceMeta.label}
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
