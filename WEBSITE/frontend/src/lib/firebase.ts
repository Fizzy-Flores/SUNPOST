import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const getEnvValue = (value: string | undefined) => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed && trimmed !== 'undefined' ? trimmed : undefined;
};

const firebaseConfig = {
  apiKey: getEnvValue(import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: getEnvValue(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: getEnvValue(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: getEnvValue(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: getEnvValue(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: getEnvValue(import.meta.env.VITE_FIREBASE_APP_ID),
  measurementId: getEnvValue(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID),
};

const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.storageBucket &&
  firebaseConfig.messagingSenderId &&
  firebaseConfig.appId
);

function initializeFirebaseApp() {
  if (!isFirebaseConfigured) {
    return null;
  }

  return !getApps().length ? initializeApp(firebaseConfig) : getApp();
}

const app: FirebaseApp | null = initializeFirebaseApp();

export const auth: Auth | null = app ? getAuth(app) : null;
export const db: Firestore | null = app ? getFirestore(app) : null;

export const googleProvider = new GoogleAuthProvider();
if (auth) {
  googleProvider.setCustomParameters({ prompt: 'select_account' });
}

export const firebaseReady = isFirebaseConfigured;
