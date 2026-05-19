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
  type UserCredential,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "./firebase";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

let persistencePromise: Promise<void> | null = null;
let redirectResultPromise: Promise<UserCredential | null> | null = null;

const GOOGLE_REDIRECT_PENDING_KEY = "velora_google_redirect_pending";

function logAuthDebug(message: string, details?: Record<string, unknown>): void {
  if (typeof console === "undefined") return;
  console.debug(`[Auth] ${message}`, details ?? {});
}

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

  if (!persistencePromise) {
    logAuthDebug("persistence restoration:start", {
      mode: "browserLocalPersistence",
      currentUserUid: auth.currentUser?.uid ?? null,
    });
    persistencePromise = setPersistence(auth, browserLocalPersistence)
      .then(() => {
        logAuthDebug("persistence restoration:ready", {
          mode: "browserLocalPersistence",
          currentUserUid: auth.currentUser?.uid ?? null,
        });
      })
      .catch((error) => {
        persistencePromise = null;
        logAuthDebug("persistence restoration:error", {
          code: getFirebaseErrorCode(error),
          currentUserUid: auth.currentUser?.uid ?? null,
        });
        throw error;
      });
  }

  await persistencePromise;
}

function getFirebaseErrorCode(error: unknown): string | null {
  return typeof error === "object" && error !== null && "code" in error
    ? String((error as AuthError).code)
    : null;
}

function getAuthEnvironment() {
  if (typeof window === "undefined") {
    return {
      isMobile: false,
      isStandalone: false,
      isAndroidChrome: false,
      shouldUseRedirect: false,
      userAgent: "",
    };
  }

  const nav = window.navigator as Navigator & { standalone?: boolean };
  const ua = window.navigator.userAgent;
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
    Boolean(window.matchMedia?.("(pointer: coarse)")?.matches);
  const isStandalone =
    Boolean(window.matchMedia?.("(display-mode: standalone)")?.matches) ||
    Boolean(window.matchMedia?.("(display-mode: fullscreen)")?.matches) ||
    Boolean(window.matchMedia?.("(display-mode: minimal-ui)")?.matches) ||
    Boolean(nav.standalone);
  const isAndroidChrome = /Android/i.test(ua) && /Chrome\//i.test(ua);

  return {
    isMobile,
    isStandalone,
    isAndroidChrome,
    shouldUseRedirect: isMobile || isStandalone,
    userAgent: ua,
  };
}

function shouldFallbackToRedirect(error: unknown): boolean {
  if (isAuthCancellation(error)) return false;
  const code = getFirebaseErrorCode(error);
  return code === "auth/popup-blocked" ||
    code === "auth/operation-not-supported-in-this-environment" ||
    code === "auth/web-storage-unsupported";
}

function setRedirectPending(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(GOOGLE_REDIRECT_PENDING_KEY, "1");
  } catch {
    // Session storage can be unavailable in strict privacy modes. Auth still uses local persistence.
  }
}

function consumeRedirectPending(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const pending = window.sessionStorage.getItem(GOOGLE_REDIRECT_PENDING_KEY) === "1";
    window.sessionStorage.removeItem(GOOGLE_REDIRECT_PENDING_KEY);
    return pending;
  } catch {
    return false;
  }
}

export async function signInWithGoogle(): Promise<void> {
  await ensureLocalAuthPersistence();

  const environment = getAuthEnvironment();
  logAuthDebug("sign-in strategy", {
    method: environment.shouldUseRedirect ? "redirect" : "popup",
    isMobile: environment.isMobile,
    isStandalone: environment.isStandalone,
    isAndroidChrome: environment.isAndroidChrome,
    currentUserUid: auth.currentUser?.uid ?? null,
  });

  if (environment.shouldUseRedirect) {
    setRedirectPending();
    await signInWithRedirect(auth, googleProvider);
    return;
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    logAuthDebug("popup result", {
      uid: result.user.uid,
      currentUserUid: auth.currentUser?.uid ?? null,
    });
  } catch (error) {
    if (!shouldFallbackToRedirect(error)) {
      throw error;
    }

    logAuthDebug("popup fallback to redirect", {
      code: getFirebaseErrorCode(error),
      currentUserUid: auth.currentUser?.uid ?? null,
    });
    setRedirectPending();
    await signInWithRedirect(auth, googleProvider);
  }
}

export async function completeGoogleRedirectSignIn(): Promise<UserCredential | null> {
  await ensureLocalAuthPersistence();

  const hadPendingRedirect = consumeRedirectPending();
  redirectResultPromise ??= getRedirectResult(auth)
    .then((result) => {
      logAuthDebug("redirect result", {
        pendingRedirect: hadPendingRedirect,
        uid: result?.user.uid ?? null,
        providerId: result?.providerId ?? null,
        operationType: result?.operationType ?? null,
        currentUserUid: auth.currentUser?.uid ?? null,
      });
      return result;
    })
    .catch((error) => {
      redirectResultPromise = null;
      logAuthDebug("redirect result:error", {
        pendingRedirect: hadPendingRedirect,
        code: getFirebaseErrorCode(error),
        currentUserUid: auth.currentUser?.uid ?? null,
      });
      throw error;
    });

  return redirectResultPromise;
}

export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
