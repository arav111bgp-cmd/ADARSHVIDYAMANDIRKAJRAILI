import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword as fbSignInWithEmailAndPassword,
  createUserWithEmailAndPassword as fbCreateUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  Auth
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  onSnapshot,
  Timestamp,
  Firestore
} from 'firebase/firestore';

export interface FirebaseConfigOptions {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

// Default Client Config for Project ID: adarsh-vidya-mandir-53445
export const DEFAULT_FIREBASE_CONFIG: FirebaseConfigOptions = {
  apiKey: (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FIREBASE_API_KEY)
    ? String(import.meta.env.VITE_FIREBASE_API_KEY)
    : '',
  authDomain: (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FIREBASE_AUTH_DOMAIN)
    ? String(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN)
    : 'adarsh-vidya-mandir-53445.firebaseapp.com',
  projectId: (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FIREBASE_PROJECT_ID)
    ? String(import.meta.env.VITE_FIREBASE_PROJECT_ID)
    : 'adarsh-vidya-mandir-53445',
  storageBucket: (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FIREBASE_STORAGE_BUCKET)
    ? String(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET)
    : 'adarsh-vidya-mandir-53445.firebasestorage.app',
  messagingSenderId: (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID)
    ? String(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID)
    : '312937269412',
  appId: (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FIREBASE_APP_ID)
    ? String(import.meta.env.VITE_FIREBASE_APP_ID)
    : '1:312937269412:web:87a2524424c2108edc7e31'
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export const firebaseService = {
  /**
   * Initializes Firebase App, Auth and Firestore safely
   */
  initializeFirebase(customConfig?: FirebaseConfigOptions): { app: FirebaseApp; auth: Auth; db: Firestore } {
    if (!app) {
      const config = { ...DEFAULT_FIREBASE_CONFIG, ...customConfig };
      if (!config.apiKey && typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.PROD) {
        throw new Error('Firebase Configuration Error: VITE_FIREBASE_API_KEY environment variable is missing.');
      }
      if (getApps().length === 0) {
        app = initializeApp(config);
      } else {
        app = getApp();
      }
      auth = getAuth(app);
      db = getFirestore(app);
    }
    return { app, auth: auth!, db: db! };
  },

  getFirebaseAuth(): Auth {
    if (!auth) this.initializeFirebase();
    return auth!;
  },

  getFirestore(): Firestore {
    if (!db) this.initializeFirebase();
    return db!;
  },

  get firebaseApp(): FirebaseApp {
    if (!app) this.initializeFirebase();
    return app!;
  },

  get firebaseAuth(): Auth {
    return this.getFirebaseAuth();
  },

  get firestoreDb(): Firestore {
    return this.getFirestore();
  },

  // Auth Helpers
  async signInWithEmailPassword(email: string, pass: string) {
    const authInstance = this.getFirebaseAuth();
    return fbSignInWithEmailAndPassword(authInstance, email, pass);
  },

  async signInWithEmailAndPassword(email: string, pass: string) {
    return this.signInWithEmailPassword(email, pass);
  },

  async createUserAccount(email: string, pass: string) {
    const authInstance = this.getFirebaseAuth();
    return fbCreateUserWithEmailAndPassword(authInstance, email, pass);
  },

  async signOut() {
    const authInstance = this.getFirebaseAuth();
    return fbSignOut(authInstance);
  },

  getCurrentUser(): FirebaseUser | null {
    return this.getFirebaseAuth().currentUser;
  },

  onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(this.getFirebaseAuth(), callback);
  },

  // Firestore Helpers
  async createDocument<T = any>(collectionName: string, arg2: any, arg3?: any): Promise<void> {
    let documentId: string;
    let data: any;
    if (typeof arg2 === 'string') {
      documentId = arg2;
      data = arg3 || {};
    } else if (typeof arg3 === 'string') {
      documentId = arg3;
      data = arg2 || {};
    } else {
      documentId = (arg2 && arg2.id) ? String(arg2.id) : `doc_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      data = arg2 || {};
    }
    const docRef = doc(this.getFirestore(), collectionName, documentId);
    return setDoc(docRef, { ...data, id: documentId, createdAt: Timestamp.now(), updatedAt: Timestamp.now() }, { merge: true });
  },

  async getDocument<T = any>(collectionName: string, documentId: string): Promise<T | null> {
    const docRef = doc(this.getFirestore(), collectionName, documentId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as T;
    }
    return null;
  },

  async updateDocument(collectionName: string, documentId: string, data: any): Promise<void> {
    const docRef = doc(this.getFirestore(), collectionName, documentId);
    return updateDoc(docRef, { ...data, updatedAt: Timestamp.now() });
  },

  async deleteDocument(collectionName: string, documentId: string): Promise<void> {
    const docRef = doc(this.getFirestore(), collectionName, documentId);
    return deleteDoc(docRef);
  },

  async queryDocuments<T = any>(collectionName: string, field?: string, operator?: any, value?: any): Promise<T[]> {
    const colRef = collection(this.getFirestore(), collectionName);
    let q = query(colRef);
    if (field && operator && value !== undefined) {
      q = query(colRef, where(field, operator, value));
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as T);
  },

  subscribeToCollection<T = any>(
    collectionName: string,
    callback: (docs: T[]) => void,
    field?: string,
    operator?: any,
    value?: any
  ) {
    const colRef = collection(this.getFirestore(), collectionName);
    let q = query(colRef);
    if (field && operator && value !== undefined) {
      q = query(colRef, where(field, operator, value));
    }
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }) as T);
      callback(list);
    });
  },

  /**
   * Connection diagnostic test: verify Auth SDK & Firestore Connection
   */
  async runConnectionTest(): Promise<{
    initialized: boolean;
    projectId: string;
    authAvailable: boolean;
    firestoreAvailable: boolean;
    testDocWritten: boolean;
    testDocRead: boolean;
    message: string;
    details?: any;
  }> {
    try {
      const { app, auth, db } = this.initializeFirebase();
      const testPath = '_system';
      const testDocId = 'firebaseConnectionTest';

      let testDocWritten = false;
      let testDocRead = false;
      let writeError = '';

      try {
        const testRef = doc(db, testPath, testDocId);
        await setDoc(testRef, {
          timestamp: new Date().toISOString(),
          status: 'SUCCESS',
          testName: 'AVM Firebase Connection Test',
          environment: 'Vite / Capacitor Foundation'
        }, { merge: true });
        testDocWritten = true;

        const snap = await getDoc(testRef);
        if (snap.exists()) {
          testDocRead = true;
        }
      } catch (err: any) {
        writeError = err?.message || String(err);
      }

      return {
        initialized: !!app,
        projectId: 'adarsh-vidya-mandir-53445',
        authAvailable: !!auth,
        firestoreAvailable: !!db,
        testDocWritten,
        testDocRead,
        message: testDocWritten && testDocRead
          ? 'Firebase Authentication & Cloud Firestore connected successfully!'
          : writeError
            ? `Firebase SDK initialized. Firestore write check: ${writeError}`
            : 'Firebase SDK initialized successfully.',
        details: {
          appOptions: app.options,
          currentUser: auth.currentUser ? auth.currentUser.email : 'No active Firebase Auth session'
        }
      };
    } catch (e: any) {
      return {
        initialized: false,
        projectId: 'adarsh-vidya-mandir-53445',
        authAvailable: false,
        firestoreAvailable: false,
        testDocWritten: false,
        testDocRead: false,
        message: `Firebase initialization error: ${e?.message || e}`
      };
    }
  }
};

export async function createDocument<T = any>(collectionName: string, arg2: any, arg3?: any): Promise<void> {
  return firebaseService.createDocument<T>(collectionName, arg2, arg3);
}

export async function getDocument<T = any>(collectionName: string, documentId: string): Promise<T | null> {
  return firebaseService.getDocument<T>(collectionName, documentId);
}

export async function updateDocument<T = any>(collectionName: string, documentId: string, data: any): Promise<void> {
  return firebaseService.updateDocument(collectionName, documentId, data);
}

export async function deleteDocument(collectionName: string, documentId: string): Promise<void> {
  return firebaseService.deleteDocument(collectionName, documentId);
}

export async function queryDocuments<T = any>(collectionName: string, field?: string, operator?: any, value?: any): Promise<T[]> {
  return firebaseService.queryDocuments<T>(collectionName, field, operator, value);
}

export function subscribeToCollection<T = any>(
  collectionName: string,
  callback: (docs: T[]) => void,
  field?: string,
  operator?: any,
  value?: any
) {
  return firebaseService.subscribeToCollection<T>(collectionName, callback, field, operator, value);
}

