import {
  browserLocalPersistence,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  type AuthError,
  type User,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "./firebase";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

let persistencePromise: Promise<void> | null = null;

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof Error && /firebase client configuration is missing/i.test(error.message)) {
    return "Configuration Firebase manquante. La connexion Google n'est pas disponible.";
  }

  const code = typeof error === "object" && error !== null && "code" in error
    ? String((error as AuthError).code)
    : "";

  switch (code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Connexion annulee. Reessayez lorsque vous etes pret.";
    case "auth/popup-blocked":
      return "La fenetre de connexion a ete bloquee. Reessayez ou utilisez le navigateur principal.";
    case "auth/unauthorized-domain":
      return "Ce domaine n'est pas autorise dans Firebase Auth.";
    case "auth/network-request-failed":
      return "Connexion reseau indisponible. Verifiez votre connexion puis reessayez.";
    default:
      return "Impossible de se connecter avec Google pour le moment.";
  }
}

export function isAuthCancellation(error: unknown): boolean {
  const code = typeof error === "object" && error !== null && "code" in error
    ? String((error as AuthError).code)
    : "";
  return code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request";
}

export async function ensureLocalAuthPersistence(): Promise<void> {
  if (typeof window === "undefined") return;
  if (!isFirebaseConfigured) {
    throw new Error("Firebase client configuration is missing.");
  }
  persistencePromise ??= setPersistence(auth, browserLocalPersistence);
  await persistencePromise;
}

function shouldUseRedirectSignIn(): boolean {
  if (typeof window === "undefined") return false;

  const ua = window.navigator.userAgent;
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
    window.matchMedia("(pointer: coarse)").matches;
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator && Boolean(window.navigator.standalone));

  return isMobile || isStandalone;
}

function shouldFallbackToRedirect(error: unknown): boolean {
  if (isAuthCancellation(error)) return false;
  const code = typeof error === "object" && error !== null && "code" in error
    ? String((error as AuthError).code)
    : "";
  return code === "auth/popup-blocked" ||
    code === "auth/operation-not-supported-in-this-environment" ||
    code === "auth/web-storage-unsupported";
}

export async function signInWithGoogle(): Promise<void> {
  await ensureLocalAuthPersistence();

  if (shouldUseRedirectSignIn()) {
    await signInWithRedirect(auth, googleProvider);
    return;
  }

  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    if (!shouldFallbackToRedirect(error)) {
      throw error;
    }
    await signInWithRedirect(auth, googleProvider);
  }
}

export async function completeGoogleRedirectSignIn(): Promise<void> {
  await ensureLocalAuthPersistence();
  await getRedirectResult(auth);
}

export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
