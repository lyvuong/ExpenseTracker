import { initializeApp, getApps, getApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type {
  AssociableHome,
  AssociableVehicle,
  FirebaseConfig,
  LedgerEntry,
  Office,
  PaymentTypeItem,
  TargetTaxonomyOverride,
  TaxonomyOverrideDoc,
  Transaction,
  Trip,
  UserAuditInfo,
  UserProfile
} from '../types';
import {
  getStoredFirebaseConfig,
  setStoredFirebaseConfig,
  getStoredFamilyCode,
  setStoredFamilyCode,
  saveLocalTaxonomyOverride,
  loadLocalTaxonomyOverride
} from './storage';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: ReturnType<typeof getAuth> | null = null;

const envConfig: FirebaseConfig | null = import.meta.env.VITE_FIREBASE_API_KEY ? {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
} : null;

export const initializeFirebaseService = (customConfig?: FirebaseConfig): boolean => {
  const config = customConfig || getStoredFirebaseConfig() || envConfig;
  if (!config || !config.apiKey || !config.projectId) {
    console.log('[Firebase] Running in Local Demo Mode');
    return false;
  }

  try {
    app = getApps().length ? getApp() : initializeApp(config);
    db = getFirestore(app);
    auth = getAuth(app);
    if (customConfig) {
      setStoredFirebaseConfig(customConfig);
    }
    console.log('[Firebase] Initialized for project:', config.projectId);
    return true;
  } catch (err) {
    console.warn('[Firebase] Initialization failed:', err);
    return false;
  }
};

export const isFirebaseConfigured = (): boolean => db !== null && auth !== null;

export const subscribeAuth = (callback: (user: UserProfile | null) => void) => {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      callback({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'Household Member',
        photoURL: user.photoURL,
        isAnonymous: user.isAnonymous
      });
    } else {
      callback(null);
    }
  });
};

export const loginWithGoogle = async (): Promise<UserProfile | null> => {
  if (!auth) throw new Error('Firebase Auth is not configured.');
  setStoredFamilyCode('');
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const res = await signInWithPopup(auth, provider);
  return {
    uid: res.user.uid,
    email: res.user.email,
    displayName: res.user.displayName,
    photoURL: res.user.photoURL
  };
};

export const logoutFirebase = async (): Promise<void> => {
  setStoredFamilyCode('');
  if (auth) {
    await firebaseSignOut(auth);
  }
};

// Personal ledger by default; a household code switches every read and write
// to the shared households/{code} scope that the other family apps use.
const getStorageTarget = (userId: string, familyCode?: string) => {
  const code = (familyCode || getStoredFamilyCode() || '').trim().toUpperCase();
  if (code) {
    return { root: 'households', id: code };
  }
  return { root: 'users', id: userId };
};

// ==========================================
// Shared Transactions Ledger (Firestore)
// users/{uid}/transactions or households/{code}/transactions — the exact same
// collection HomeTracker, AutoTrack, and Statements write to.
// ==========================================

export const subscribeFirestoreTransactions = (
  userId: string,
  familyCode: string | undefined,
  callback: (transactions: Transaction[]) => void
) => {
  if (!db) return () => {};
  const target = getStorageTarget(userId, familyCode);
  const q = query(collection(db, target.root, target.id, 'transactions'), orderBy('date', 'desc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Transaction)));
  }, (error) => {
    console.error('[Firestore] Transactions sync error:', error);
    if (error.code === 'permission-denied') {
      console.warn('[Firestore] Permission denied. Clearing invalid household code.');
      setStoredFamilyCode('');
    }
  });
};

export const saveFirestoreTransaction = async (
  userId: string,
  transaction: Transaction,
  familyCode?: string
): Promise<void> => {
  if (!db) return;
  try {
    const target = getStorageTarget(userId, familyCode);
    const clean = JSON.parse(JSON.stringify(transaction));
    await setDoc(doc(db, target.root, target.id, 'transactions', transaction.id), clean, { merge: true });
    console.log(`[Firestore] Transaction saved to ${target.root}/${target.id}:`, transaction.id);
  } catch (err) {
    console.error('[Firestore] Error saving transaction:', err);
  }
};

export const deleteFirestoreTransaction = async (
  userId: string,
  transactionId: string,
  familyCode?: string
): Promise<void> => {
  if (!db) return;
  try {
    const target = getStorageTarget(userId, familyCode);
    await deleteDoc(doc(db, target.root, target.id, 'transactions', transactionId));
  } catch (err) {
    console.error('[Firestore] Error deleting transaction:', err);
  }
};

// ==========================================
// Target Entity Collections (Trips, Offices, Family, Properties, Vehicles)
// Shared with Statements PWA: households/{code}/{collectionName}
// ==========================================

export const subscribeFirestoreEntities = <T extends { id: string }>(
  userId: string,
  familyCode: string | undefined,
  collectionName: string,
  callback: (items: T[]) => void
) => {
  if (!db) return () => {};
  const target = getStorageTarget(userId, familyCode);
  const colRef = collection(db, target.root, target.id, collectionName);
  return onSnapshot(colRef, (snapshot) => {
    callback(snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as T)));
  }, (error) => {
    console.error(`[Firestore] ${collectionName} sync error:`, error);
  });
};

export const saveFirestoreEntity = async <T extends { id: string }>(
  userId: string,
  collectionName: string,
  entity: T,
  familyCode?: string
): Promise<void> => {
  if (!db) return;
  try {
    const target = getStorageTarget(userId, familyCode);
    const clean = JSON.parse(JSON.stringify(entity));
    await setDoc(doc(db, target.root, target.id, collectionName, entity.id), clean, { merge: true });
  } catch (err) {
    console.error(`[Firestore] Error saving ${collectionName}:`, err);
  }
};

export const deleteFirestoreEntity = async (
  userId: string,
  collectionName: string,
  id: string,
  familyCode?: string
): Promise<void> => {
  if (!db) return;
  try {
    const target = getStorageTarget(userId, familyCode);
    await deleteDoc(doc(db, target.root, target.id, collectionName, id));
  } catch (err) {
    console.error(`[Firestore] Error deleting ${collectionName}:`, err);
  }
};

// Specific helper aliases for backwards compatibility
export const subscribeFirestoreTrips = (userId: string, familyCode: string | undefined, cb: (trips: Trip[]) => void) =>
  subscribeFirestoreEntities<Trip>(userId, familyCode, 'trips', cb);

export const saveFirestoreTrip = (userId: string, trip: Trip, familyCode?: string) =>
  saveFirestoreEntity(userId, 'trips', trip, familyCode);

export const deleteFirestoreTrip = (userId: string, tripId: string, familyCode?: string) =>
  deleteFirestoreEntity(userId, 'trips', tripId, familyCode);

export const subscribeFirestoreOffices = (userId: string, familyCode: string | undefined, cb: (offices: Office[]) => void) =>
  subscribeFirestoreEntities<Office>(userId, familyCode, 'offices', cb);

export const saveFirestoreOffice = (userId: string, office: Office, familyCode?: string) =>
  saveFirestoreEntity(userId, 'offices', office, familyCode);

export const deleteFirestoreOffice = (userId: string, officeId: string, familyCode?: string) =>
  deleteFirestoreEntity(userId, 'offices', officeId, familyCode);

// ==========================================
// Taxonomy Override (Custom Categories & Subcategories)
// Stored at: households/{familyCode}/settings/taxonomy
// Shape: { [target]: { categories: Record<string, string[]>, deleted: string[] } }
// ==========================================

export const subscribeFirestoreTaxonomyOverride = (
  familyCode: string,
  callback: (data: TaxonomyOverrideDoc) => void
) => {
  if (!db || !familyCode) {
    callback(loadLocalTaxonomyOverride(familyCode));
    return () => {};
  }
  const ref = doc(db, 'households', familyCode.trim().toUpperCase(), 'settings', 'taxonomy');
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) {
      const data = snap.data() as TaxonomyOverrideDoc;
      saveLocalTaxonomyOverride(familyCode, data);
      callback(data);
    } else {
      callback(loadLocalTaxonomyOverride(familyCode));
    }
  }, (err) => {
    console.warn('[Firestore] Taxonomy override sync error:', err);
    callback(loadLocalTaxonomyOverride(familyCode));
  });
};

export const saveFirestoreTaxonomyOverride = async (
  _userId: string,
  familyCode: string | undefined,
  target: string,
  override: TargetTaxonomyOverride
): Promise<void> => {
  const code = (familyCode || getStoredFamilyCode() || '').trim().toUpperCase();
  const current = loadLocalTaxonomyOverride(code);
  const updated: TaxonomyOverrideDoc = { ...current, [target]: override };
  saveLocalTaxonomyOverride(code, updated);

  if (!db || !code) return;
  try {
    const ref = doc(db, 'households', code, 'settings', 'taxonomy');
    await setDoc(ref, { [target]: JSON.parse(JSON.stringify(override)) }, { merge: true });
  } catch (err) {
    console.error('[Firestore] Error saving taxonomy override:', err);
  }
};

// ==========================================
// Sibling-app association (CarTracker / HomeTracker)
// ==========================================

export const getVehiclesOnce = async (userId: string, familyCode?: string): Promise<AssociableVehicle[]> => {
  if (!db) return [];
  try {
    const target = getStorageTarget(userId, familyCode);
    const snapshot = await getDocs(collection(db, target.root, target.id, 'vehicles'));
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AssociableVehicle));
  } catch (err) {
    console.error('[Firestore] Error fetching vehicles:', err);
    return [];
  }
};

export const getHomesOnce = async (userId: string, familyCode?: string): Promise<AssociableHome[]> => {
  if (!db) return [];
  try {
    const target = getStorageTarget(userId, familyCode);
    const snapshot = await getDocs(collection(db, target.root, target.id, 'houses'));
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AssociableHome));
  } catch (err) {
    console.error('[Firestore] Error fetching homes:', err);
    return [];
  }
};

export const createCarRecord = async (
  userId: string,
  vehicleId: string,
  mileage: number,
  entry: LedgerEntry,
  familyCode?: string
): Promise<void> => {
  if (!db) return;
  try {
    const target = getStorageTarget(userId, familyCode);
    const record = {
      id: entry.id,
      vehicleId,
      mileage,
      category: 'Other',
      type: 'Other Expense',
      createdAt: new Date().toISOString(),
      isTaxDeductible: Boolean(entry.isTaxDeductible)
    };
    await setDoc(doc(db, target.root, target.id, 'records', entry.id), record, { merge: true });
  } catch (err) {
    console.error('[Firestore] Error creating car record:', err);
  }
};

export const createHomeRecord = async (
  userId: string,
  homeId: string,
  entry: LedgerEntry,
  familyCode?: string
): Promise<void> => {
  if (!db) return;
  try {
    const target = getStorageTarget(userId, familyCode);
    const record = {
      id: entry.id,
      homeId,
      category: 'Other',
      type: 'Expense',
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, target.root, target.id, 'homeRecords', entry.id), record, { merge: true });
  } catch (err) {
    console.error('[Firestore] Error creating home record:', err);
  }
};

// ==========================================
// Household membership
// ==========================================

export const verifyOrCreateHousehold = async (
  familyCode: string,
  userProfile: UserProfile
): Promise<{ success: boolean; message: string; isNew?: boolean }> => {
  if (!db) return { success: true, message: 'Offline mode active.' };

  const code = familyCode.trim().toUpperCase();
  if (!code) return { success: false, message: 'Please enter a Household Code.' };

  try {
    const metaRef = doc(db, 'households', code, 'metadata', 'info');
    const docSnap = await getDoc(metaRef);

    const auditUser: UserAuditInfo = {
      uid: userProfile.uid,
      displayName: userProfile.displayName || 'Household Member',
      email: userProfile.email || undefined
    };

    if (docSnap.exists()) {
      const data = docSnap.data();
      const members: UserAuditInfo[] = data.members || [];
      const memberUids: Record<string, boolean> = data.memberUids || {};

      if (!members.some(m => m.uid === userProfile.uid) || !memberUids[userProfile.uid]) {
        if (!members.some(m => m.uid === userProfile.uid)) {
          members.push(auditUser);
        }
        memberUids[userProfile.uid] = true;
        await setDoc(metaRef, { members, memberUids }, { merge: true });
      }

      return { success: true, isNew: false, message: `Joined household ${code}.` };
    }

    const newHousehold = {
      code,
      createdBy: auditUser,
      createdAt: new Date().toISOString(),
      members: [auditUser],
      memberUids: { [userProfile.uid]: true }
    };
    await setDoc(metaRef, newHousehold);
    return { success: true, isNew: true, message: `Created new household ${code}.` };
  } catch (err: any) {
    console.error('[Firestore] Error verifying household:', err);
    if (err.code === 'permission-denied' || err.message?.includes('insufficient permissions')) {
      return {
        success: false,
        message: 'Creating new household codes is restricted to administrators. Ask your admin for an existing code.'
      };
    }
    return { success: false, message: err.message || 'Error joining household code.' };
  }
};

export const subscribeHouseholdMembers = (
  familyCode: string,
  callback: (members: UserAuditInfo[]) => void
) => {
  if (!db || !familyCode) {
    callback([]);
    return () => {};
  }
  const metaRef = doc(db, 'households', familyCode.trim().toUpperCase(), 'metadata', 'info');
  return onSnapshot(metaRef, (snap) => {
    callback(snap.exists() ? (snap.data().members || []) : []);
  }, (error) => {
    console.error('[Firestore] Household members sync error:', error);
    callback([]);
  });
};

// ==========================================
// Household / User Payment Types Collection
// ==========================================

export const subscribeFirestorePaymentTypes = (
  userId: string,
  familyCode: string | undefined,
  callback: (paymentTypes: PaymentTypeItem[]) => void
) => {
  if (!db) return () => {};
  const target = getStorageTarget(userId, familyCode);
  const q = collection(db, target.root, target.id, 'payment_types');
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as PaymentTypeItem)));
  }, (error) => {
    console.error('[Firestore] Payment types sync error:', error);
  });
};

export const saveFirestorePaymentType = async (
  userId: string,
  paymentType: PaymentTypeItem,
  familyCode?: string
): Promise<void> => {
  if (!db) return;
  try {
    const target = getStorageTarget(userId, familyCode);
    const clean = JSON.parse(JSON.stringify(paymentType));
    await setDoc(doc(db, target.root, target.id, 'payment_types', paymentType.id), clean, { merge: true });
    console.log(`[Firestore] Payment type saved to ${target.root}/${target.id}:`, paymentType.name);
  } catch (err) {
    console.error('[Firestore] Error saving payment type:', err);
  }
};

export const deleteFirestorePaymentType = async (
  userId: string,
  paymentTypeId: string,
  familyCode?: string
): Promise<void> => {
  if (!db) return;
  try {
    const target = getStorageTarget(userId, familyCode);
    await deleteDoc(doc(db, target.root, target.id, 'payment_types', paymentTypeId));
  } catch (err) {
    console.error('[Firestore] Error deleting payment type:', err);
  }
};
