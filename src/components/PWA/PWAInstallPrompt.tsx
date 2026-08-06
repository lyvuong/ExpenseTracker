import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] Install prompt outcome:', outcome);
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  if (!showInstallBanner) return null;

  return (
    <div className="fixed bottom-24 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-40 no-print">
      <div className="card p-4 shadow-xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img src="/favicon.svg" alt="ExpenseTracker app icon" className="w-10 h-10 rounded-xl shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-slate-900">Install ExpenseTracker</h4>
            <p className="text-[11px] text-slate-500">Add to your home screen for one-tap logging.</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Install
          </button>
          <button
            onClick={() => setShowInstallBanner(false)}
            className="p-1 text-slate-400 hover:text-slate-700"
            aria-label="Dismiss install prompt"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
