import React from 'react';
import { Plus, Users, Cloud, CloudOff, Wifi, WifiOff } from 'lucide-react';
import type { UserProfile } from '../../types';

interface HeaderProps {
  user: UserProfile | null;
  familyCode: string;
  isOnline: boolean;
  isFirebaseActive: boolean;
  onAddExpense: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  familyCode,
  isOnline,
  isFirebaseActive,
  onAddExpense,
  onOpenSettings
}) => {
  const initials = (user?.displayName || user?.email || 'Me')
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('');

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200 no-print">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">

        <div className="flex items-center gap-2.5 min-w-0">
          <img src="/favicon.svg" alt="" className="w-9 h-9 rounded-xl shrink-0" />
          <div className="min-w-0">
            <h1 className="text-base font-extrabold tracking-tight text-slate-900 leading-none">FinanceTracker</h1>
            <button
              onClick={onOpenSettings}
              className="mt-1 flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-indigo-600 transition-colors"
            >
              {familyCode ? (
                <>
                  <Users className="w-3 h-3" />
                  <span className="truncate">Household {familyCode}</span>
                </>
              ) : (
                <span className="truncate">Personal ledger</span>
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 text-slate-400">
            <span title={isOnline ? 'Online' : 'Offline'}>
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4 text-amber-500" />}
            </span>
            <span title={isFirebaseActive ? 'Cloud sync active' : 'Local only'}>
              {isFirebaseActive ? <Cloud className="w-4 h-4 text-indigo-500" /> : <CloudOff className="w-4 h-4" />}
            </span>
          </div>

          <button
            onClick={onAddExpense}
            title="Log new transaction"
            aria-label="Log new transaction"
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold pl-3 pr-4 py-2 rounded-xl shadow-sm shadow-indigo-600/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline sm:inline">Add</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center overflow-hidden hover:border-indigo-300 transition-colors"
            title={user?.displayName || 'Account'}
          >
            {user?.photoURL
              ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              : initials || 'ME'}
          </button>
        </div>
      </div>
    </header>
  );
};
