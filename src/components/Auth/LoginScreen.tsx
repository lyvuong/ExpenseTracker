import React, { useState } from 'react';
import { Users, ShoppingCart, PieChart, Mail, Key } from 'lucide-react';

interface LoginScreenProps {
  onGoogleSignIn: () => Promise<any>;
  onEmailSignIn?: (email: string, pass: string) => Promise<any>;
  onEmailRegister?: (email: string, pass: string) => Promise<any>;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onGoogleSignIn,
  onEmailSignIn,
  onEmailRegister
}) => {
  const [authMode, setAuthMode] = useState<'google' | 'email' | 'register'>('google');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGoogleSignIn = async () => {
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

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    setIsSigningIn(true);
    setErrorMsg('');
    try {
      if (authMode === 'register' && onEmailRegister) {
        await onEmailRegister(email.trim(), password);
      } else if (onEmailSignIn) {
        await onEmailSignIn(email.trim(), password);
      }
    } catch (err: any) {
      console.error('Email auth error:', err);
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12">
      <div className="max-w-sm w-full card p-8 space-y-6">

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

        {/* Auth Method Buttons */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm py-3 px-5 rounded-xl border border-slate-300 shadow-sm transition-all disabled:opacity-50"
          >
            {isSigningIn && authMode === 'google' ? (
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            )}
            <span>{isSigningIn && authMode === 'google' ? 'Connecting…' : 'Sign in with Google'}</span>
          </button>

          {(onEmailSignIn || onEmailRegister) && (
            <>
              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider absolute">or</span>
              </div>

              {authMode === 'google' ? (
                <button
                  type="button"
                  onClick={() => setAuthMode('email')}
                  className="w-full text-xs font-semibold text-indigo-600 hover:text-indigo-700 py-1"
                >
                  Sign in with Email & Password
                </button>
              ) : (
                <form onSubmit={handleEmailSubmit} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Email</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="field pl-9 text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Password</label>
                    <div className="relative">
                      <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="field pl-9 text-sm"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSigningIn}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-2.5 px-4 rounded-xl shadow-sm transition-colors disabled:opacity-50"
                  >
                    {isSigningIn ? 'Processing…' : (authMode === 'register' ? 'Create Account' : 'Sign In')}
                  </button>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => setAuthMode(authMode === 'register' ? 'email' : 'register')}
                      className="text-indigo-600 hover:underline font-medium"
                    >
                      {authMode === 'register' ? 'Already have an account? Sign In' : 'Need an account? Register'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMode('google')}
                      className="text-slate-500 hover:underline"
                    >
                      Back
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>

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
