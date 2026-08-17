import React, { useRef, useState } from 'react';
import {
  Users,
  LogOut,
  Download,
  Upload,
  Cloud,
  CloudOff,
  Trash2,
  Sparkles,
  Info,
  Check,
  CreditCard,
  ChevronRight,
  Layers
} from 'lucide-react';
import type { LedgerEntry, Transaction, UserAuditInfo, UserProfile } from '../../types';

interface SettingsPanelProps {
  user: UserProfile | null;
  isFirebaseActive: boolean;
  familyCode: string;
  members: UserAuditInfo[];
  entries: LedgerEntry[];
  transactions: Transaction[];
  paymentTypesCount?: number;
  onSetFamilyCode: (code: string) => Promise<{ success: boolean; message: string }>;
  onSignOut: () => void;
  onExportCSV: (entries: LedgerEntry[]) => void;
  onExportJSON: (transactions: Transaction[]) => void;
  onImportJSON: (json: string) => void;
  onClearDemoData: () => void;
  onRestoreSampleData: () => void;
  onManagePaymentTypes?: () => void;
  onManageTaxonomy?: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  user,
  isFirebaseActive,
  familyCode,
  members,
  entries,
  transactions,
  paymentTypesCount = 0,
  onSetFamilyCode,
  onSignOut,
  onExportCSV,
  onExportJSON,
  onImportJSON,
  onClearDemoData,
  onRestoreSampleData,
  onManagePaymentTypes,
  onManageTaxonomy
}) => {
  const [codeInput, setCodeInput] = useState(familyCode);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleJoin = async () => {
    setIsJoining(true);
    setStatus(null);
    const res = await onSetFamilyCode(codeInput);
    setStatus({ ok: res.success, message: res.message });
    setIsJoining(false);
  };

  const handleLeave = async () => {
    setCodeInput('');
    const res = await onSetFamilyCode('');
    setStatus({ ok: res.success, message: res.message });
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        onImportJSON(String(reader.result));
        setStatus({ ok: true, message: 'Backup imported.' });
      } catch (err: any) {
        setStatus({ ok: false, message: err.message || 'Import failed.' });
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <section className="space-y-4">

      {/* Account */}
      <div className="card p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-4">Account</p>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-indigo-50 border border-indigo-100 overflow-hidden flex items-center justify-center text-indigo-600 font-bold">
            {user?.photoURL
              ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              : (user?.displayName || 'Me').slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{user?.displayName || 'Local user'}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email || 'Not signed in'}</p>
          </div>
          {user && (
            <button
              onClick={onSignOut}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
          {isFirebaseActive
            ? <><Cloud className="w-4 h-4 text-indigo-500" /> Cloud sync active — entries save to the shared ledger.</>
            : <><CloudOff className="w-4 h-4" /> Local mode — entries stay on this device.</>}
        </div>
      </div>

      {/* Household */}
      <div className="card p-5">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
          <Users className="w-3.5 h-3.5" /> Household sharing
        </p>
        <p className="text-xs text-slate-500 leading-relaxed mb-4">
          Everyone using the same household code writes to one shared ledger — the same one HomeTracker and AutoTrack use,
          so home and car costs appear here too.
        </p>

        <div className="flex gap-2">
          <input
            value={codeInput}
            onChange={e => setCodeInput(e.target.value.toUpperCase())}
            placeholder="e.g. SMITH2026"
            className="field uppercase"
          />
          <button
            onClick={handleJoin}
            disabled={isJoining || !codeInput.trim()}
            className="px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-bold transition-colors whitespace-nowrap"
          >
            {isJoining ? 'Joining…' : 'Join'}
          </button>
        </div>

        {familyCode && (
          <div className="mt-3 flex items-center justify-between rounded-xl bg-indigo-50 border border-indigo-100 px-3.5 py-2.5">
            <span className="text-xs font-semibold text-indigo-700 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> Sharing with household {familyCode}
            </span>
            <button onClick={handleLeave} className="text-xs font-semibold text-slate-500 hover:text-red-600">
              Leave
            </button>
          </div>
        )}

        {status && (
          <p className={`mt-3 text-xs font-semibold rounded-lg px-3 py-2 ${
            status.ok ? 'text-emerald-700 bg-emerald-50' : 'text-red-600 bg-red-50'
          }`}>
            {status.message}
          </p>
        )}

        {members.length > 0 && (
          <div className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-2">
              Members ({members.length})
            </p>
            <div className="space-y-1.5">
              {members.map(m => (
                <div key={m.uid} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700 truncate">{m.displayName}</span>
                  <span className="text-xs text-slate-400 truncate ml-2">{m.email}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Domains, Entities & Taxonomy */}
      <div className="card p-5">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
          <Layers className="w-3.5 h-3.5" /> Domains, Entities & Category Taxonomy
        </p>
        <p className="text-xs text-slate-500 leading-relaxed mb-4">
          Manage targets (Family, Travel, Business, Property, Fleet), create custom categories, add subcategories, and manage Trips or Offices.
        </p>
        <button
          onClick={onManageTaxonomy}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-sm font-semibold text-slate-700 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            Manage Domains, Entities & Categories
          </span>
          <span className="flex items-center gap-1 text-xs text-indigo-600 font-bold">
            Configure <ChevronRight className="w-4 h-4" />
          </span>
        </button>
      </div>

      {/* Payment Methods */}
      <div className="card p-5">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
          <CreditCard className="w-3.5 h-3.5" /> Household Payment Methods
        </p>
        <p className="text-xs text-slate-500 leading-relaxed mb-4">
          Manage payment options like cards, cash, or gift cards available for household logging.
        </p>
        <button
          onClick={onManagePaymentTypes}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-sm font-semibold text-slate-700 transition-colors"
        >
          <span className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-indigo-600" />
            Manage Payment Types
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-500">
            {paymentTypesCount} active <ChevronRight className="w-4 h-4" />
          </span>
        </button>
      </div>

      {/* Data */}
      <div className="card p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-4">Data</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            onClick={() => onExportCSV(entries)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 text-sm font-semibold text-slate-700 transition-colors"
          >
            <Download className="w-4 h-4 text-slate-400" /> Export CSV
          </button>
          <button
            onClick={() => onExportJSON(transactions)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 text-sm font-semibold text-slate-700 transition-colors"
          >
            <Download className="w-4 h-4 text-slate-400" /> Export JSON backup
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 text-sm font-semibold text-slate-700 transition-colors"
          >
            <Upload className="w-4 h-4 text-slate-400" /> Import JSON backup
          </button>
          <input ref={fileInputRef} type="file" accept="application/json" onChange={handleImportFile} className="hidden" />
          <button
            onClick={onRestoreSampleData}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 text-sm font-semibold text-slate-700 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-slate-400" /> Load sample data
          </button>
          <button
            onClick={onClearDemoData}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 hover:border-red-200 hover:bg-red-50 text-sm font-semibold text-red-600 transition-colors sm:col-span-2"
          >
            <Trash2 className="w-4 h-4" /> Remove sample data
          </button>
        </div>
      </div>

      {/* About */}
      <div className="card p-5">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">
          <Info className="w-3.5 h-3.5" /> About
        </p>
        <p className="text-xs text-slate-500 leading-relaxed">
          <strong className="text-slate-700">Expense</strong> logs everyday household spending into the shared
          <code className="mx-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">transactions</code>
          collection, alongside HomeTracker and AutoTrack. Entries created in those apps are shown here read-only and are
          edited where they were created.
        </p>
        <p className="mt-3 text-[11px] text-slate-400">
          {entries.length} entries visible · Progressive Web App · Works offline
        </p>
      </div>
    </section>
  );
};
