import React, { useState } from 'react';
import { Lock, LogOut, ShieldAlert, CheckCircle2 } from 'lucide-react';
import type { UserProfile } from '../../types';
import { verifyOrCreateHousehold, logoutFirebase } from '../../services/firebase';

interface HouseholdChallengeScreenProps {
  user: UserProfile;
  onHouseholdVerified: (code: string) => void;
}

// Shown after sign-in, before any data is loaded: the user must enter an
// existing household code. An unknown or rejected code signs them back out.
export const HouseholdChallengeScreen: React.FC<HouseholdChallengeScreenProps> = ({
  user,
  onHouseholdVerified
}) => {
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const signOutSoon = () => {
    setTimeout(() => {
      logoutFirebase().catch(() => {});
    }, 2200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMsg('Please enter your Household Code.');
      return;
    }

    setIsVerifying(true);
    setErrorMsg('');
    try {
      const res = await verifyOrCreateHousehold(cleanCode, user, { createIfMissing: false });
      if (res.success) {
        onHouseholdVerified(cleanCode);
        return;
      }
      setErrorMsg(res.message || `Household Code "${cleanCode}" does not exist.`);
      signOutSoon();
    } catch (err) {
      console.error('Household verification error:', err);
      setErrorMsg('Household Code verification failed.');
      signOutSoon();
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12">
      <div className="max-w-sm w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8 space-y-6 text-slate-900">
        <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-3 min-w-0">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'User'} className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 font-bold flex items-center justify-center">
                {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-xs font-bold truncate">{user.displayName || 'Signed in'}</div>
              <div className="text-slate-500 text-[11px] truncate">{user.email}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => logoutFirebase().catch(() => {})}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        <div className="text-center space-y-2">
          <div className="h-14 w-14 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-extrabold">Household Access</h2>
          <p className="text-slate-500 text-xs">
            Enter your Household Code to open your shared expense data.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <div>
              <div className="font-bold">{errorMsg}</div>
              <div className="text-[10px] opacity-80">Signing you out…</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="household-code-input" className="block text-xs font-semibold mb-1.5">
              Household Code
            </label>
            <input
              id="household-code-input"
              type="text"
              required
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. SMITH2026"
              maxLength={20}
              disabled={isVerifying}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-base tracking-widest font-mono uppercase text-center font-bold focus:outline-none focus:ring-2 ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={isVerifying || !code.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30 text-white shadow-lg disabled:opacity-50 transition-all"
          >
            {isVerifying ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Continue</span>
              </>
            )}
          </button>
        </form>

        <p className="text-slate-500 text-center text-[11px]">
          Codes are issued by your family administrator. An invalid code signs you out.
        </p>
      </div>
    </div>
  );
};
