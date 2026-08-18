import React from 'react';
import { LayoutDashboard, ReceiptText, PieChart, Settings } from 'lucide-react';
import type { ActiveTab } from '../../types';

const TABS: { id: ActiveTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'log', label: 'Transactions', icon: ReceiptText },
  { id: 'insights', label: 'Insights', icon: PieChart },
  { id: 'settings', label: 'Settings', icon: Settings }
];

interface TabBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

/** Pill row under the header on desktop, fixed bottom bar on phones. */
export const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange }) => (
  <>
    <nav className="hidden sm:block border-b border-slate-200 bg-white no-print">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex gap-1 py-2">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === id
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>
    </nav>

    <nav className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-slate-200 safe-bottom no-print">
      <div className="grid grid-cols-4">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors ${
              activeTab === id ? 'text-indigo-600' : 'text-slate-400'
            }`}
          >
            <Icon className="w-5 h-5" />
            {label}
          </button>
        ))}
      </div>
    </nav>
  </>
);
