import React, { useState } from 'react';
import { Users, ShoppingCart, PieChart } from 'lucide-react';

interface LoginScreenProps {
  onGoogleSignIn: () => Promise<any>;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onGoogleSignIn }) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMsg('');
    try {
      await onGoogleSignIn();
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setErrorMsg(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12">
      <div className="max-w-sm w-full card p-8 space-y-7">

        <div className="text-center space-y-3">
          <img src="/favicon.svg" alt="FinanceTracker app icon" className="w-16 h-16 mx-auto rounded-2xl shadow-lg shadow-indigo-500/20" />
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">FinanceTracker</h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            The shared household finance & transaction ledger — expenses, credits, travel, business, and more.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-xs font-semibold text-red-700 text-center">
            {errorMsg}
          </div>
        )}

        <button
          onClick={handleSignIn}
          disabled={isSigningIn}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm py-3 px-5 rounded-xl border border-slate-300 shadow-sm transition-all disabled:opacity-50"
        >
          {isSigningIn ? (
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
          )}
          <span>{isSigningIn ? 'Connecting…' : 'Sign in with Google'}</span>
        </button>

        <div className="pt-5 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
          <div>
            <ShoppingCart className="w-4 h-4 text-indigo-600 mx-auto mb-1.5" />
            <span className="text-[11px] font-medium text-slate-500 block">Quick logging</span>
          </div>
          <div>
            <Users className="w-4 h-4 text-indigo-600 mx-auto mb-1.5" />
            <span className="text-[11px] font-medium text-slate-500 block">Shared household</span>
          </div>
          <div>
            <PieChart className="w-4 h-4 text-indigo-600 mx-auto mb-1.5" />
            <span className="text-[11px] font-medium text-slate-500 block">Monthly insights</span>
          </div>
        </div>
      </div>

      <footer className="mt-8 text-center text-xs text-slate-400">
        <p>FinanceTracker · Progressive Web App · Works offline</p>
      </footer>
    </div>
  );
};
