import React, { useEffect, useMemo, useState } from 'react';
import { Header } from './components/Layout/Header';
import { TabBar } from './components/Layout/TabBar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { ExpenseList } from './components/Expenses/ExpenseList';
import { ExpenseFormModal } from './components/Expenses/ExpenseFormModal';
import { EntryDetailSheet } from './components/Expenses/EntryDetailSheet';
import { Insights } from './components/Insights/Insights';
import { SettingsPanel } from './components/Settings/SettingsPanel';
import { PWAInstallPrompt } from './components/PWA/PWAInstallPrompt';
import { LoginScreen } from './components/Auth/LoginScreen';

import type {
  ActiveTab,
  AssociableHome,
  AssociableVehicle,
  AssociationTarget,
  ExpenseCategory,
  ExpenseDraft,
  LedgerEntry,
  PaymentTypeItem,
  Transaction,
  UserAuditInfo,
  UserProfile
} from './types';
import { buildTransactionCategory, parseTransaction, sortEntries } from './utils/transactions';
import {
  DEMO_PREFIX,
  INITIAL_PAYMENT_TYPES,
  clearDemoData,
  exportEntriesAsCSV,
  exportTransactionsAsJSON,
  getStoredFamilyCode,
  getStoredLastHomeId,
  getStoredLastVehicleId,
  importJSONBackup,
  loadLocalPaymentTypes,
  loadLocalTransactions,
  restoreSampleData,
  saveLocalPaymentTypes,
  saveLocalTransactions,
  setStoredFamilyCode,
  setStoredLastHomeId,
  setStoredLastVehicleId
} from './services/storage';
import {
  createCarRecord,
  createHomeRecord,
  deleteFirestorePaymentType,
  deleteFirestoreTransaction,
  getHomesOnce,
  getVehiclesOnce,
  initializeFirebaseService,
  isFirebaseConfigured,
  loginWithGoogle,
  logoutFirebase,
  saveFirestorePaymentType,
  saveFirestoreTransaction,
  subscribeAuth,
  subscribeFirestorePaymentTypes,
  subscribeFirestoreTransactions,
  subscribeHouseholdMembers,
  verifyOrCreateHousehold
} from './services/firebase';
import { PaymentTypesModal } from './components/Settings/PaymentTypesModal';

export const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadLocalTransactions());
  const [paymentTypes, setPaymentTypes] = useState<PaymentTypeItem[]>(() => loadLocalPaymentTypes());
  const [familyCode, setFamilyCodeState] = useState<string>(() => getStoredFamilyCode());
  const [householdMembers, setHouseholdMembers] = useState<UserAuditInfo[]>([]);
  const [vehicles, setVehicles] = useState<AssociableVehicle[]>([]);
  const [homes, setHomes] = useState<AssociableHome[]>([]);

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isFirebaseActive, setIsFirebaseActive] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [user, setUser] = useState<UserProfile | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LedgerEntry | null>(null);
  const [viewingEntry, setViewingEntry] = useState<LedgerEntry | null>(null);
  const [presetCategory, setPresetCategory] = useState<ExpenseCategory | undefined>(undefined);

  const memberName = user?.displayName || 'Household Member';

  // Online / offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // PWA manifest shortcuts (/?action=add, /?action=log)
  useEffect(() => {
    const action = new URLSearchParams(window.location.search).get('action');
    if (action === 'add') setIsFormOpen(true);
    if (action === 'log') setActiveTab('log');
  }, []);

  // Firebase init, auth, and the shared transactions subscription
  useEffect(() => {
    const initialized = initializeFirebaseService();
    const active = initialized && isFirebaseConfigured();
    setIsFirebaseActive(active);

    if (!active) {
      setIsAuthLoading(false);
      return;
    }

    let unsubTransactions: (() => void) | null = null;
    let unsubPaymentTypes: (() => void) | null = null;

    const unsubscribeAuth = subscribeAuth((userProfile) => {
      setUser(userProfile);
      setIsAuthLoading(false);
      unsubTransactions?.();
      unsubPaymentTypes?.();
      unsubTransactions = null;
      unsubPaymentTypes = null;

      if (!userProfile) {
        setStoredFamilyCode('');
        setFamilyCodeState('');
        return;
      }

      // Cloud is the source of truth once signed in; anything logged locally
      // before sign-in (demo rows excluded) is seeded up on first sync.
      let hasSeeded = false;
      unsubTransactions = subscribeFirestoreTransactions(userProfile.uid, familyCode, (cloudTransactions) => {
        if (cloudTransactions.length > 0) {
          hasSeeded = true;
          setTransactions(cloudTransactions);
          saveLocalTransactions(cloudTransactions);
          return;
        }
        if (hasSeeded) {
          setTransactions([]);
          saveLocalTransactions([]);
          return;
        }
        hasSeeded = true;
        const local = loadLocalTransactions().filter(t => !t.id.startsWith(DEMO_PREFIX));
        if (local.length > 0) {
          setTransactions(local);
          local.forEach(t => saveFirestoreTransaction(userProfile.uid, t, familyCode));
        } else {
          setTransactions([]);
          saveLocalTransactions([]);
        }
      });

      // Subscribe to payment types in cloud
      let hasSeededPaymentTypes = false;
      unsubPaymentTypes = subscribeFirestorePaymentTypes(userProfile.uid, familyCode, (cloudTypes) => {
        if (cloudTypes.length > 0) {
          hasSeededPaymentTypes = true;
          setPaymentTypes(cloudTypes);
          saveLocalPaymentTypes(cloudTypes);
          return;
        }
        if (hasSeededPaymentTypes) {
          setPaymentTypes([]);
          saveLocalPaymentTypes([]);
          return;
        }
        hasSeededPaymentTypes = true;
        const localTypes = loadLocalPaymentTypes();
        const typesToSeed = localTypes.length > 0 ? localTypes : INITIAL_PAYMENT_TYPES;
        setPaymentTypes(typesToSeed);
        saveLocalPaymentTypes(typesToSeed);
        typesToSeed.forEach(pt => saveFirestorePaymentType(userProfile.uid, pt, familyCode));
      });
    });

    return () => {
      unsubTransactions?.();
      unsubPaymentTypes?.();
      unsubscribeAuth();
    };
  }, [familyCode]);

  // Household roster, so expenses can be attributed to any member
  useEffect(() => {
    if (!isFirebaseActive || !user || !familyCode) {
      setHouseholdMembers([]);
      return;
    }
    return subscribeHouseholdMembers(familyCode, setHouseholdMembers);
  }, [isFirebaseActive, user, familyCode]);

  // Vehicles/homes from the sibling apps, fetched once so an entry can be
  // associated with one of them (see handleAssociateEntry).
  useEffect(() => {
    if (!isFirebaseActive || !user) {
      setVehicles([]);
      setHomes([]);
      return;
    }
    getVehiclesOnce(user.uid, familyCode).then(setVehicles);
    getHomesOnce(user.uid, familyCode).then(setHomes);
  }, [isFirebaseActive, user, familyCode]);

  useEffect(() => {
    saveLocalTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    saveLocalPaymentTypes(paymentTypes);
  }, [paymentTypes]);

  const handleAddPaymentType = (name: string) => {
    const authUserName = user?.displayName || user?.email?.split('@')[0] || memberName;
    const newItem: PaymentTypeItem = {
      id: `pt-${Date.now()}`,
      name,
      ownerUid: user?.uid,
      ownerName: authUserName,
      createdAt: new Date().toISOString()
    };
    setPaymentTypes(prev => [...prev, newItem]);
    if (user && isFirebaseActive) {
      saveFirestorePaymentType(user.uid, newItem, familyCode);
    }
  };

  const handleUpdatePaymentType = (id: string, name: string) => {
    setPaymentTypes(prev => prev.map(pt => {
      if (pt.id === id) {
        const updated = { ...pt, name };
        if (user && isFirebaseActive) {
          saveFirestorePaymentType(user.uid, updated, familyCode);
        }
        return updated;
      }
      return pt;
    }));
  };

  const handleDeletePaymentType = (id: string) => {
    setPaymentTypes(prev => prev.filter(pt => pt.id !== id));
    if (user && isFirebaseActive) {
      deleteFirestorePaymentType(user.uid, id, familyCode);
    }
  };

  const entries: LedgerEntry[] = useMemo(
    () => sortEntries(transactions.map(parseTransaction)),
    [transactions]
  );

  const vendors = useMemo(
    () => Array.from(new Set(entries.map(e => e.vendor).filter(Boolean))).sort(),
    [entries]
  );

  const memberNames = useMemo(() => {
    const fromHousehold = householdMembers.map(m => m.displayName);
    const fromEntries = entries.map(e => e.user).filter(Boolean);
    return Array.from(new Set([...fromHousehold, ...fromEntries]));
  }, [householdMembers, entries]);

  const handleSetFamilyCode = async (code: string): Promise<{ success: boolean; message: string }> => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setStoredFamilyCode('');
      setFamilyCodeState('');
      return { success: true, message: 'Back to your personal ledger.' };
    }

    if (user && isFirebaseActive) {
      const res = await verifyOrCreateHousehold(cleanCode, user);
      if (!res.success) {
        setStoredFamilyCode('');
        setFamilyCodeState('');
        return { success: false, message: res.message };
      }
    }

    setStoredFamilyCode(cleanCode);
    setFamilyCodeState(cleanCode);
    return { success: true, message: `Sharing with household ${cleanCode}.` };
  };

  const openNewExpense = (category?: ExpenseCategory) => {
    setEditingEntry(null);
    setPresetCategory(category);
    setIsFormOpen(true);
  };

  const openEditExpense = (entry: LedgerEntry) => {
    // Entries owned by a sibling app get the read-only sheet instead: editing
    // them here would be overwritten on that app's next save.
    if (!entry.isEditable) {
      setViewingEntry(entry);
      return;
    }
    setEditingEntry(entry);
    setPresetCategory(undefined);
    setIsFormOpen(true);
  };

  const handleSaveExpense = (draft: ExpenseDraft) => {
    const id = draft.id || `exp-${Date.now()}`;
    const transaction: Transaction = {
      id,
      date: draft.date,
      time: draft.time,
      amount: draft.amount,
      vendor: draft.vendor,
      notes: draft.notes || '',
      category: buildTransactionCategory(draft.category, draft.subcategory),
      paymentType: draft.paymentType,
      user: draft.user || memberName,
      isTaxDeductible: draft.isTaxDeductible
    };

    setTransactions(prev => prev.some(t => t.id === id)
      ? prev.map(t => (t.id === id ? transaction : t))
      : [transaction, ...prev]);

    setIsFormOpen(false);
    setEditingEntry(null);
    setPresetCategory(undefined);

    if (user && isFirebaseActive) {
      saveFirestoreTransaction(user.uid, transaction, familyCode);
    }
  };

  const handleDeleteExpense = (id: string) => {
    if (!confirm('Delete this expense entry?')) return;
    setTransactions(prev => prev.filter(t => t.id !== id));
    setIsFormOpen(false);
    setEditingEntry(null);
    if (user && isFirebaseActive) {
      deleteFirestoreTransaction(user.uid, id, familyCode);
    }
  };

  // Associates the entry currently open in the edit modal with a vehicle in
  // CarTracker or a home in HomeTracker, by creating that app's
  // vehicle-/home-specific record (sharing this entry's Transaction ID) and
  // re-namespacing the category so it reads as their row from then on.
  const handleAssociateEntry = async (target: AssociationTarget) => {
    if (!user || !isFirebaseActive || !editingEntry) return;
    const entry = editingEntry;
    let newCategory: string;

    if (target.app === 'car') {
      const vehicle = vehicles.find(v => v.id === target.vehicleId);
      if (!vehicle) return;
      if (!confirm(`Move this expense to CarTracker and associate it with the ${vehicle.year} ${vehicle.make} ${vehicle.model}? It will no longer be editable here.`)) return;
      await createCarRecord(user.uid, vehicle.id, vehicle.currentMileage, entry, familyCode);
      setStoredLastVehicleId(vehicle.id);
      newCategory = `Car - Other - ${vehicle.year} - ${vehicle.make} ${vehicle.model}`;
    } else {
      const home = homes.find(h => h.id === target.homeId);
      if (!home) return;
      if (!confirm(`Move this expense to HomeTracker and associate it with ${home.nickname}? It will no longer be editable here.`)) return;
      await createHomeRecord(user.uid, home.id, entry, familyCode);
      setStoredLastHomeId(home.id);
      newCategory = `Home - Other - ${home.nickname}`;
    }

    const updatedTransaction: Transaction = { ...entry, category: newCategory };
    setTransactions(prev => prev.map(t => (t.id === entry.id ? updatedTransaction : t)));
    await saveFirestoreTransaction(user.uid, updatedTransaction, familyCode);
    setIsFormOpen(false);
    setEditingEntry(null);
  };

  const handleImportJSON = (json: string) => {
    const imported = importJSONBackup(json);
    setTransactions(imported);
    if (user && isFirebaseActive) {
      imported.forEach(t => saveFirestoreTransaction(user.uid, t, familyCode));
    }
  };

  const handleClearDemoData = () => {
    clearDemoData();
    setTransactions(loadLocalTransactions());
  };

  const handleRestoreSampleData = () => {
    restoreSampleData();
    setTransactions(loadLocalTransactions());
  };

  const handleSignOut = async () => {
    await logoutFirebase();
    setUser(null);
    setTransactions([]);
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-sm text-slate-500">
          <div className="w-9 h-9 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
          <span>Loading your expense log…</span>
        </div>
      </div>
    );
  }

  if (isFirebaseActive && !user) {
    return <LoginScreen onGoogleSignIn={loginWithGoogle} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20 sm:pb-0">
      <Header
        user={user}
        familyCode={familyCode}
        isOnline={isOnline}
        isFirebaseActive={isFirebaseActive}
        onAddExpense={() => openNewExpense()}
        onOpenSettings={() => setActiveTab('settings')}
      />

      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-5">
        {activeTab === 'dashboard' && (
          <Dashboard
            entries={entries}
            memberName={memberName}
            familyCode={familyCode}
            onQuickAdd={openNewExpense}
            onViewAll={() => setActiveTab('log')}
            onEditEntry={openEditExpense}
            onViewEntry={setViewingEntry}
          />
        )}

        {activeTab === 'log' && (
          <ExpenseList
            entries={entries}
            onAddExpense={() => openNewExpense()}
            onEditEntry={openEditExpense}
            onViewEntry={setViewingEntry}
            onExportCSV={exportEntriesAsCSV}
          />
        )}

        {activeTab === 'insights' && <Insights entries={entries} />}

        {activeTab === 'settings' && (
          <SettingsPanel
            user={user}
            isFirebaseActive={isFirebaseActive}
            familyCode={familyCode}
            members={householdMembers}
            entries={entries}
            transactions={transactions}
            paymentTypesCount={paymentTypes.length}
            onSetFamilyCode={handleSetFamilyCode}
            onSignOut={handleSignOut}
            onExportCSV={exportEntriesAsCSV}
            onExportJSON={exportTransactionsAsJSON}
            onImportJSON={handleImportJSON}
            onClearDemoData={handleClearDemoData}
            onRestoreSampleData={handleRestoreSampleData}
            onManagePaymentTypes={() => setIsPaymentModalOpen(true)}
          />
        )}
      </main>

      <ExpenseFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingEntry(null);
          setPresetCategory(undefined);
        }}
        onSave={handleSaveExpense}
        onDelete={handleDeleteExpense}
        initialEntry={editingEntry}
        vendors={vendors}
        members={memberNames}
        currentUser={memberName}
        presetCategory={presetCategory}
        paymentTypes={paymentTypes}
        onManagePaymentTypes={() => setIsPaymentModalOpen(true)}
        vehicles={vehicles}
        homes={homes}
        defaultVehicleId={getStoredLastVehicleId()}
        defaultHomeId={getStoredLastHomeId()}
        onAssociate={handleAssociateEntry}
      />

      <PaymentTypesModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        paymentTypes={paymentTypes}
        currentUserUid={user?.uid}
        currentUserName={memberName}
        onAddPaymentType={handleAddPaymentType}
        onUpdatePaymentType={handleUpdatePaymentType}
        onDeletePaymentType={handleDeletePaymentType}
      />

      <EntryDetailSheet entry={viewingEntry} onClose={() => setViewingEntry(null)} />

      <PWAInstallPrompt />

      <footer className="hidden sm:block border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-400 no-print">
        <p>ExpenseTracker · shared household ledger · Cloudflare Pages ready · offline capable</p>
      </footer>
    </div>
  );
};

export default App;
