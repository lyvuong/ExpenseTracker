import React from 'react';
import { X, Lock } from 'lucide-react';
import { getCategoryMeta, SOURCE_META } from '../../constants/categories';
import { formatDayLabel, formatMoney } from '../../utils/transactions';
import type { LedgerEntry } from '../../types';

interface EntryDetailSheetProps {
  entry: LedgerEntry | null;
  onClose: () => void;
}

const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-baseline justify-between gap-4 py-2.5">
    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 shrink-0">{label}</span>
    <span className="text-sm text-slate-800 text-right break-words">{value}</span>
  </div>
);

/**
 * Read-only view of a ledger entry owned by a sibling app. Those rows are a
 * projection of a record living in the app that created them — editing them
 * here would be overwritten on that app's next save and would strip the
 * context encoded in their category — so this sheet explains rather than edits.
 */
export const EntryDetailSheet: React.FC<EntryDetailSheetProps> = ({ entry, onClose }) => {
  if (!entry) return null;

  const sourceMeta = SOURCE_META[entry.source];
  const meta = getCategoryMeta(entry.label);
  const Icon = entry.source === 'Expense' ? meta.icon : sourceMeta.icon;
  const color = entry.source === 'Expense' ? meta.color : sourceMeta.color;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-0 sm:p-4 no-print"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900">Entry details</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">

          <div className="flex items-center gap-3.5">
            <span
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${color}1a` }}
            >
              <Icon className="w-6 h-6" style={{ color }} />
            </span>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-slate-900 tabular">{formatMoney(entry.amount)}</p>
              <p className="text-sm text-slate-500 truncate">{entry.vendor || 'Unknown vendor'}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-1.5">
            <span
              className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
              style={{ color: sourceMeta.color, backgroundColor: `${sourceMeta.color}1a` }}
            >
              {sourceMeta.label}
            </span>
            {entry.isTaxDeductible && (
              <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded text-emerald-700 bg-emerald-50">
                Tax deductible
              </span>
            )}
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            <DetailRow label="Date" value={formatDayLabel(entry.date)} />
            {entry.time && <DetailRow label="Time" value={entry.time} />}
            <DetailRow label="Category" value={[entry.label, entry.detail].filter(Boolean).join(' · ')} />
            <DetailRow label="Payment" value={entry.paymentType} />
            {entry.user && <DetailRow label="Paid by" value={entry.user} />}
            {entry.notes && <DetailRow label="Notes" value={entry.notes} />}
          </div>

          <div className="mt-5 flex gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
            <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 leading-relaxed">
              This entry was logged in <span className="font-semibold text-slate-800">{sourceMeta.app}</span> and
              is read-only here. Open {sourceMeta.app} to edit or delete it — changes show up in this
              ledger automatically.
            </p>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
