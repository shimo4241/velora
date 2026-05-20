import {
  browserLocalPersistence,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut as firebaseSignOut,
  type AuthError,
  type User,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "./firebase";

let persistencePromise: Promise<void> | null = null;
let persistenceReady = false;

function logAuthDebug(message: string, details?: Record<string, unknown>): void {
  if (typeof console === "undefined") return;
  console.debug(`[Auth] ${message}`, details ?? {});
}

export function getAuthErrorCode(error: unknown): string | null {
  return typeof error === "object" && error !== null && "code" in error
    ? String((error as AuthError).code)
    : null;
}

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof Error && /firebase client configuration is missing/i.test(error.message)) {
    return "Configuration Firebase manquante. La connexion Google n'est pas disponible.";
  }

  const code = getAuthErrorCode(error);

  switch (code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Connexion annulee. Reessayez lorsque vous etes pret.";
    case "auth/popup-blocked":
      return "La fenetre Google a ete bloquee. Touchez le bouton pour reessayer et autorisez les fenetres contextuelles si Chrome le demande.";
    case "auth/operation-not-supported-in-this-environment":
      return "Ce mode d'affichage bloque la fenetre Google. Ouvrez VELORA dans Chrome puis reessayez.";
    case "auth/web-storage-unsupported":
      return "Chrome bloque le stockage requis pour garder votre session. Autorisez les cookies et le stockage du site puis reessayez.";
    case "auth/unauthorized-domain":
      return "Ce domaine n'est pas autorise dans Firebase Auth.";
    case "auth/network-request-failed":
      return "Connexion reseau indisponible. Verifiez votre connexion puis reessayez.";
    default:
      return "Impossible de se connecter avec Google pour le moment.";
  }
}

export function isAuthCancellation(error: unknown): boolean {
  const code = getAuthErrorCode(error);
  return code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request";
}

export function isPopupBlockedErrorCode(code: string | null): boolean {
  return code === "auth/popup-blocked" ||
    code === "auth/operation-not-supported-in-this-environment" ||
    code === "auth/web-storage-unsupported";
}

export async function ensureLocalAuthPersistence(): Promise<void> {
  if (typeof window === "undefined") return;
  if (!isFirebaseConfigured) {
    throw new Error("Firebase client configuration is missing.");
  }

  if (!persistencePromise) {
    logAuthDebug("persistence restoration:start", {
      mode: "browserLocalPersistence",
      currentUserUid: auth.currentUser?.uid ?? null,
    });
    persistencePromise = setPersistence(auth, browserLocalPersistence)
      .then(() => {
        persistenceReady = true;
        logAuthDebug("persistence restoration:ready", {
          mode: "browserLocalPersistence",
          currentUserUid: auth.currentUser?.uid ?? null,
        });
      })
      .catch((error) => {
        persistencePromise = null;
        persistenceReady = false;
        logAuthDebug("persistence restoration:error", {
          code: getAuthErrorCode(error),
          currentUserUid: auth.currentUser?.uid ?? null,
        });
        throw error;
      });
  }

  await persistencePromise;
}

function createGoogleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}

export async function signInWithGoogle(): Promise<void> {
  if (!persistenceReady) {
    await ensureLocalAuthPersistence();
  }

  try {
    logAuthDebug("popup sign-in:start", {
      persistenceReady,
      currentUserUid: auth.currentUser?.uid ?? null,
    });

    const result = await signInWithPopup(auth, createGoogleProvider());
    logAuthDebug("popup result", {
      uid: result.user.uid,
      currentUserUid: auth.currentUser?.uid ?? null,
    });
  } catch (error) {
    logAuthDebug("popup result:error", {
      code: getAuthErrorCode(error),
      currentUserUid: auth.currentUser?.uid ?? null,
    });
    throw error;
  }
}

export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
