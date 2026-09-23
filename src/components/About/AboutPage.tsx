import React, { useState } from 'react';
import {
  UsersRound,
  Plane,
  Briefcase,
  Layers,
  Scale,
  WifiOff,
  Code2,
  Cpu,
  Sparkles,
  GitBranch,
  ExternalLink,
  Tag,
  CheckCircle2,
  Calendar,
  Server,
  RefreshCw,
  Download,
  Globe
} from 'lucide-react';
import { APP_VERSION, BUILD_DATE, BUILD_HASH, DISPLAY_VERSION } from '../../utils/version';
import { checkForUpdate, installLatestVersion } from '../../utils/updateCheck';

type UpdateState = 'idle' | 'checking' | 'current' | 'available' | 'error' | 'installing';

const KEY_FEATURES = [
  {
    icon: UsersRound,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    title: 'Family & Household Ledger',
    desc: 'Log everyday debits and credits — groceries, transportation, health, education, subscriptions, taxes and income.'
  },
  {
    icon: Plane,
    color: 'text-sky-600 bg-sky-50 border-sky-100',
    title: 'Trips & Travel',
    desc: 'Link expenses to trips, with automatic foreign-currency conversion to USD.'
  },
  {
    icon: Briefcase,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    title: 'Business & Office',
    desc: 'Track office, marketing and professional costs per business entity with deductible flags.'
  },
  {
    icon: Scale,
    color: 'text-orange-600 bg-orange-50 border-orange-100',
    title: 'Tax Guidance',
    desc: 'Every category and subcategory shows how it is treated at tax time and which IRS form applies.'
  },
  {
    icon: Layers,
    color: 'text-purple-600 bg-purple-50 border-purple-100',
    title: 'Unified Household Ledger',
    desc: 'HomeTracker, AutoTrack and Statements entries appear here alongside your own, tagged by source.'
  },
  {
    icon: WifiOff,
    color: 'text-rose-600 bg-rose-50 border-rose-100',
    title: 'Offline-First PWA',
    desc: 'Installable on phone and desktop, keeps working offline and syncs through the household code.'
  }
];

const TECH_STACK = [
  { name: 'React 19', category: 'UI Framework', desc: 'Concurrent rendering & modern hooks' },
  { name: 'Vite 8', category: 'Build Tooling', desc: 'Fast ESM bundler & HMR' },
  { name: 'TypeScript 6', category: 'Language', desc: 'Strict end-to-end type safety' },
  { name: 'Tailwind CSS 4', category: 'Styling', desc: 'Utility-first design system' },
  { name: 'Cloudflare', category: 'Hosting', desc: 'Global edge network deployment' },
  { name: 'Firebase', category: 'Sync Engine', desc: 'Firestore & Google Authentication' }
];

export const AboutPage: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [updateState, setUpdateState] = useState<UpdateState>('idle');
  const [latestVersion, setLatestVersion] = useState<string | undefined>(undefined);

  const handleCheckForUpdate = async () => {
    setUpdateState('checking');
    try {
      const result = await checkForUpdate();
      setLatestVersion(result.latestVersion);
      setUpdateState(result.hasUpdate ? 'available' : 'current');
    } catch (e) {
      console.error('Update check failed:', e);
      setUpdateState('error');
    }
  };

  const handleInstallUpdate = async () => {
    setUpdateState('installing');
    await installLatestVersion();
  };

  return (
    <section className="space-y-4">

      {/* Hero */}
      <div className="card p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-600 text-white font-bold text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full">
                Official Release
              </span>
              <span className="text-xs font-mono font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                v{APP_VERSION} Stable
              </span>
            </div>
            <h1 className="flex items-center gap-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              <img src="/favicon.svg" alt="" className="w-10 h-10 rounded-xl" />
              FinanceTracker
            </h1>
            <p className="text-sm text-slate-600 max-w-xl leading-relaxed">
              A Progressive Web App for logging household debits and credits across family, travel and business —
              shared with the whole family and connected to HomeTracker, AutoTrack and Statements.
            </p>
          </div>

          <div className="shrink-0 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-center min-w-[150px]">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">App Version</span>
            <span className="mt-0.5 flex items-center justify-center gap-1.5 text-sm font-bold text-slate-900 font-mono">
              <Tag className="w-3.5 h-3.5 text-indigo-500" />
              v{APP_VERSION}
            </span>
            {BUILD_HASH && (
              <span className="mt-1 block text-[10px] font-mono font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-md px-1.5 py-0.5">
                build #{BUILD_HASH}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Version & updates */}
      <div className="card p-5">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 mb-4">
          <Tag className="w-3.5 h-3.5" /> Version & Updates
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'App Version', value: `v${APP_VERSION}`, icon: Tag },
            { label: 'Build / Commit', value: BUILD_HASH ? `#${BUILD_HASH}` : 'Local', icon: CheckCircle2 },
            { label: 'Build Date', value: BUILD_DATE, icon: Calendar },
            { label: 'Storage', value: 'Firestore + Local', icon: Server }
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1 min-w-0">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">{label}</span>
              <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 font-mono truncate">
                <Icon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                {value}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">App Updates</span>
            <span className={`text-sm font-medium ${
              updateState === 'available' ? 'text-amber-700'
                : updateState === 'current' ? 'text-emerald-700'
                : updateState === 'error' ? 'text-red-600'
                : 'text-slate-700'
            }`}>
              {import.meta.env.DEV
                ? 'Update checks are only available in the deployed production build.'
                : <>
                    {updateState === 'idle' && 'Check for a newer build of the app'}
                    {updateState === 'checking' && 'Checking for updates…'}
                    {updateState === 'current' && `You're on the latest version (${DISPLAY_VERSION})`}
                    {updateState === 'available' && `Update available${latestVersion ? `: v${latestVersion}` : ''}`}
                    {updateState === 'error' && 'Could not check for updates'}
                    {updateState === 'installing' && 'Installing update…'}
                  </>}
            </span>
          </div>

          {!import.meta.env.DEV && (updateState === 'available' || updateState === 'installing' ? (
            <button
              type="button"
              onClick={handleInstallUpdate}
              disabled={updateState === 'installing'}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm disabled:opacity-50 transition-colors shrink-0"
            >
              <Download className="w-4 h-4" />
              {updateState === 'installing' ? 'Updating…' : 'Update Now'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCheckForUpdate}
              disabled={updateState === 'checking'}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 disabled:opacity-50 transition-colors shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${updateState === 'checking' ? 'animate-spin' : ''}`} />
              {updateState === 'error' ? 'Retry' : updateState === 'current' ? 'Check Again' : 'Check for Updates'}
            </button>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="card p-5">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 mb-4">
          <Sparkles className="w-3.5 h-3.5" /> Key Features
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {KEY_FEATURES.map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="rounded-xl border border-slate-200 p-4 space-y-2">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg border ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-sm text-slate-900">{title}</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tech stack */}
      <div className="card p-5">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 mb-4">
          <Cpu className="w-3.5 h-3.5" /> Technology Stack
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TECH_STACK.map(tech => (
            <div key={tech.name} className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-xs text-slate-900">{tech.name}</span>
                <span className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                  {tech.category}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">{tech.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Developer */}
      <div className="card p-5">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 mb-4">
          <Code2 className="w-3.5 h-3.5" /> Developer
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold flex items-center justify-center">
              LV
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Ly Vuong</p>
              <p className="text-xs text-slate-500">Creator & Lead Engineer</p>
            </div>
          </div>
          <a
            href="https://github.com/lyvuong/ExpenseTracker"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 self-start sm:self-auto text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl transition-colors"
          >
            <GitBranch className="w-4 h-4 text-indigo-500" />
            GitHub Repository
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center space-y-1 py-2">
        <p className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600">
          <Globe className="w-3.5 h-3.5 text-indigo-500" />
          FinanceTracker Progressive Web App • {DISPLAY_VERSION}
        </p>
        <p className="text-xs text-slate-400">© {currentYear} Ly Vuong. All rights reserved.</p>
      </div>
    </section>
  );
};

export default AboutPage;
