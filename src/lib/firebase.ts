
import { logger } from "@/lib/logger";
/* ═══════════════════════════════════════════════════
   VELORA — Firebase Client SDK
   Modular initialization. Singleton pattern.
   ═══════════════════════════════════════════════════ */

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { 
  getAuth, 
  initializeAuth, 
  browserLocalPersistence, 
  browserSessionPersistence, 
  inMemoryPersistence, 
  type Auth 
} from "firebase/auth";
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager, 
  type Firestore 
} from "firebase/firestore";
import { getAnalytics, type Analytics } from "firebase/analytics";

const requiredFirebaseEnv = [
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
];

export const isFirebaseConfigured = requiredFirebaseEnv.every(Boolean);

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "dummy-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "dummy-auth-domain",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "dummy-project-id",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "dummy-sender-id",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "dummy-app-id",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

/* ── Singleton App ── */
function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) return getApp();
  return initializeApp(firebaseConfig);
}

/* ── Exports ── */
export const app: FirebaseApp = getFirebaseApp();

function getFirebaseAuth(app: FirebaseApp): Auth {
  if (typeof window === "undefined") {
    try {
      return getAuth(app);
    } catch {
      return initializeAuth(app, {
        persistence: inMemoryPersistence
      });
    }
  }

  try {
    return getAuth(app);
  } catch {
    try {
      return initializeAuth(app, {
        persistence: [browserLocalPersistence, browserSessionPersistence, inMemoryPersistence]
      });
    } catch (err) {
      logger.error("initializeAuth failed, falling back to getAuth", err);
      return getAuth(app);
    }
  }
}

export const auth: Auth = getFirebaseAuth(app);
function getFirebaseFirestore(app: FirebaseApp): Firestore {
  if (typeof window === "undefined") {
    return getFirestore(app);
  }
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch (err) {
    logger.warn("[Firebase] Failed to initialize Firestore with persistent cache, falling back to standard getFirestore:", err);
    return getFirestore(app);
  }
}

export const db: Firestore = getFirebaseFirestore(app);

export let analytics: Analytics | null = null;
if (typeof window !== "undefined" && isFirebaseConfigured) {
  analytics = getAnalytics(app);
}

/* ── Analytics (browser-only, lazy) ── */
export async function getAnalyticsInstance() {
  if (typeof window === "undefined") return null;
  try {
    const { getAnalytics, isSupported } = await import("firebase/analytics");
    const supported = await isSupported();
    if (!supported) return null;
    return getAnalytics(app);
  } catch {
    return null;
  }
}
