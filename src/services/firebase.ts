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
  Transaction,
  Trip,
  UserAuditInfo,
  UserProfile
} from '../types';
import {
  getStoredFirebaseConfig,
  setStoredFirebaseConfig,
  getStoredFamilyCode,
  setStoredFamilyCode
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
// Target Entity Collections (Trips & Offices)
// Shared with Statements PWA: households/{code}/trips and households/{code}/offices
// ==========================================

export const subscribeFirestoreTrips = (
  userId: string,
  familyCode: string | undefined,
  callback: (trips: Trip[]) => void
) => {
  if (!db) return () => {};
  const target = getStorageTarget(userId, familyCode);
  const colRef = collection(db, target.root, target.id, 'trips');
  return onSnapshot(colRef, (snapshot) => {
    callback(snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Trip)));
  }, (error) => {
    console.error('[Firestore] Trips sync error:', error);
  });
};

export const saveFirestoreTrip = async (
  userId: string,
  trip: Trip,
  familyCode?: string
): Promise<void> => {
  if (!db) return;
  try {
    const target = getStorageTarget(userId, familyCode);
    const clean = JSON.parse(JSON.stringify(trip));
    await setDoc(doc(db, target.root, target.id, 'trips', trip.id), clean, { merge: true });
  } catch (err) {
    console.error('[Firestore] Error saving trip:', err);
  }
};

export const deleteFirestoreTrip = async (
  userId: string,
  tripId: string,
  familyCode?: string
): Promise<void> => {
  if (!db) return;
  try {
    const target = getStorageTarget(userId, familyCode);
    await deleteDoc(doc(db, target.root, target.id, 'trips', tripId));
  } catch (err) {
    console.error('[Firestore] Error deleting trip:', err);
  }
};

export const subscribeFirestoreOffices = (
  userId: string,
  familyCode: string | undefined,
  callback: (offices: Office[]) => void
) => {
  if (!db) return () => {};
  const target = getStorageTarget(userId, familyCode);
  const colRef = collection(db, target.root, target.id, 'offices');
  return onSnapshot(colRef, (snapshot) => {
    callback(snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Office)));
  }, (error) => {
    console.error('[Firestore] Offices sync error:', error);
  });
};

export const saveFirestoreOffice = async (
  userId: string,
  office: Office,
  familyCode?: string
): Promise<void> => {
  if (!db) return;
  try {
    const target = getStorageTarget(userId, familyCode);
    const clean = JSON.parse(JSON.stringify(office));
    await setDoc(doc(db, target.root, target.id, 'offices', office.id), clean, { merge: true });
  } catch (err) {
    console.error('[Firestore] Error saving office:', err);
  }
};

export const deleteFirestoreOffice = async (
  userId: string,
  officeId: string,
  familyCode?: string
): Promise<void> => {
  if (!db) return;
  try {
    const target = getStorageTarget(userId, familyCode);
    await deleteDoc(doc(db, target.root, target.id, 'offices', officeId));
  } catch (err) {
    console.error('[Firestore] Error deleting office:', err);
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
