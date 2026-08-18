import React from 'react';
import { X, Lock, Landmark } from 'lucide-react';
import { getCategoryMeta, SOURCE_META } from '../../constants/categories';
import { formatDayLabel, formatMoney } from '../../utils/transactions';
import { getResolvedTransactionTaxGuidance } from '../../utils/taxGuidance';
import type { ExpenseTarget, LedgerEntry } from '../../types';

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

export const EntryDetailSheet: React.FC<EntryDetailSheetProps> = ({ entry, onClose }) => {
  if (!entry) return null;

  const sourceMeta = SOURCE_META[entry.source] || SOURCE_META.Expense;
  const meta = getCategoryMeta(entry.label, entry.target as ExpenseTarget);
  const Icon = entry.source === 'Expense' ? meta.icon : sourceMeta.icon;
  const color = entry.source === 'Expense' ? meta.color : sourceMeta.color;

  const targetBadge = entry.target === 'Travel'
    ? { text: 'Travel', bg: 'bg-sky-50 text-sky-700' }
    : entry.target === 'Business'
    ? { text: 'Business', bg: 'bg-indigo-50 text-indigo-700' }
    : { text: 'Family', bg: 'bg-emerald-50 text-emerald-700' };

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
          <h2 className="text-base font-bold text-slate-900">Transaction details</h2>
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
              <p className={`text-2xl font-bold tabular ${entry.amount < 0 ? 'text-emerald-700' : 'text-slate-900'}`}>
                {entry.amount < 0 ? `+${formatMoney(Math.abs(entry.amount))}` : formatMoney(entry.amount)}
              </p>
              <p className="text-sm text-slate-500 truncate">{entry.vendor || 'Unknown merchant/party'}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-1.5">
            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${
              entry.amount < 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
            }`}>
              {entry.amount < 0 ? 'Credit / Inflow' : 'Debit / Outflow'}
            </span>
            {entry.source !== 'Expense' && (
              <span
                className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
                style={{ color: sourceMeta.color, backgroundColor: `${sourceMeta.color}1a` }}
              >
                {sourceMeta.label}
              </span>
            )}
            <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${targetBadge.bg}`}>
              {targetBadge.text}
            </span>
            {entry.isTaxDeductible && (
              <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded text-emerald-700 bg-emerald-50 border border-emerald-200">
                Tax deductible
              </span>
            )}
          </div>

          {/* Tax Guidance Banner */}
          {(() => {
            const taxContext = getResolvedTransactionTaxGuidance({
              target: entry.target || 'Family',
              category: entry.label,
              subcategory: entry.detail,
              isRefund: entry.amount < 0
            });
            return (
              <div className={`mt-4 p-3.5 rounded-xl border shadow-xs text-xs flex items-start gap-3 ${taxContext.badgeStyle.bg} ${taxContext.badgeStyle.border}`}>
                <div className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 shadow-xs ${taxContext.badgeStyle.iconBg || 'bg-slate-700 text-white'}`}>
                  <Landmark className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">{taxContext.headline}</span>
                    {taxContext.scheduleOrForm && (
                      <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold border shadow-2xs bg-white dark:bg-slate-900 ${taxContext.badgeStyle.text} ${taxContext.badgeStyle.border}`}>
                        {taxContext.scheduleOrForm}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">{taxContext.purpose}</p>
                </div>
              </div>
            );
          })()}

          <div className="mt-4 divide-y divide-slate-100">
            <DetailRow label="Date" value={formatDayLabel(entry.date)} />
            {entry.time && <DetailRow label="Time" value={entry.time} />}
            <DetailRow label="Target Domain" value={entry.target || 'Family'} />
            {entry.targetEntityLabel && (
              <DetailRow label={entry.target === 'Travel' ? 'Linked Trip' : 'Linked Office'} value={entry.targetEntityLabel} />
            )}
            <DetailRow label="Category" value={[entry.label, entry.detail].filter(Boolean).join(' · ')} />
            <DetailRow label="Payment / Method" value={entry.paymentType} />
            {entry.user && <DetailRow label="Logged by" value={entry.user} />}
            {entry.notes && <DetailRow label="Notes" value={entry.notes} />}
          </div>

          {entry.source !== 'Expense' && (
            <div className="mt-5 flex gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
              <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600 leading-relaxed">
                This entry was logged in <span className="font-semibold text-slate-800">{sourceMeta.app}</span> and
                is read-only here. Open {sourceMeta.app} to edit or delete it — changes show up in this
                ledger automatically.
              </p>
            </div>
          )}
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
