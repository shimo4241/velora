"use client";
import { logger } from "@/lib/logger";


import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { type User } from "firebase/auth";
import {
  ensureLocalAuthPersistence,
  consumeAuthRedirectResult,
  getAuthErrorCode,
  getAuthErrorMessage,
  onAuthChange,
  signInWithGoogle as firebaseSignInWithGoogle,
  signOutUser,
} from "@/lib/auth";
import { auth } from "@/lib/firebase";

/* ═══════════════════════════════════════════════════
   VELORA — Auth Provider
   Wraps entire app with auth state
   ═══════════════════════════════════════════════════ */

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAuthReady: boolean;
  isSigningIn: boolean;
  error: string | null;
  errorCode: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  isAuthReady: false,
  isSigningIn: false,
  error: null,
  errorCode: null,
  signInWithGoogle: async () => undefined,
  signOut: async () => undefined,
  clearError: () => undefined,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  // Synchronously hydrate cached user on client mount to avoid layout shift
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("velora_cached_user");
        if (stored) {
          const parsed = JSON.parse(stored);
          logger.debug("[Auth] Hydrated cached user session on mount:", parsed.uid);
          setUser(parsed as User);
          setLoading(false);
        }
      } catch (e) {
        logger.error("[Auth] Failed to restore cached user session on mount:", e);
      }
    }
  }, []);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    async function initializeAuth() {
      let isResolved = false;

      // Timeout safety: if Firebase initialization hangs (e.g. offline redirect checks), bypass loading state
      const timeoutId = setTimeout(() => {
        if (isResolved || !active) return;
        logger.warn("[Auth] Boot initialization timed out. Using local/fallback states.");
        if (auth.currentUser) {
          const u = auth.currentUser;
          const cacheData = {
            uid: u.uid,
            email: u.email,
            displayName: u.displayName,
            photoURL: u.photoURL,
          };
          setUser(u);
          localStorage.setItem("velora_cached_user", JSON.stringify(cacheData));
        }
        setLoading(false);
        isResolved = true;
      }, 3500);

      try {
        // Race each step with a 2-second timeout to prevent indefinite offline blockages
        await Promise.race([
          ensureLocalAuthPersistence(),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Persistence Timeout")), 2000))
        ]);
        await Promise.race([
          consumeAuthRedirectResult(),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Redirect Timeout")), 2000))
        ]);
      } catch (authError) {
        logger.warn("[Auth] Boot initialization step failed or timed out:", authError);
      }

      if (!active) {
        clearTimeout(timeoutId);
        return;
      }

      unsubscribe = onAuthChange(async (firebaseUser) => {
        if (!active) return;
        clearTimeout(timeoutId);
        isResolved = true;

        logger.debug("[Auth] auth hydration", {
          uid: firebaseUser?.uid ?? null,
          isAnonymous: firebaseUser?.isAnonymous ?? false,
        });

        if (firebaseUser?.isAnonymous) {
          setError("Les sessions anonymes ne sont plus prises en charge.");
          setErrorCode(null);
          try {
            await signOutUser();
          } finally {
            if (!active) return;
            setUser(null);
            localStorage.removeItem("velora_cached_user");
            setLoading(false);
          }
          return;
        }

        if (firebaseUser) {
          const cacheData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          };
          localStorage.setItem("velora_cached_user", JSON.stringify(cacheData));
        } else {
          localStorage.removeItem("velora_cached_user");
        }

        setUser(firebaseUser);
        setErrorCode(null);
        setLoading(false);
      });
    }

    void initializeAuth();

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setErrorCode(null);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    setErrorCode(null);
    setIsSigningIn(true);
    try {
      await firebaseSignInWithGoogle();
    } catch (authError) {
      setErrorCode(getAuthErrorCode(authError));
      setError(getAuthErrorMessage(authError));
      throw authError;
    } finally {
      setIsSigningIn(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    setErrorCode(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("velora_cached_user");
      localStorage.removeItem("velora_cached_profile");
    }
    await signOutUser();
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthReady: !loading,
      isSigningIn,
      error,
      errorCode,
      signInWithGoogle,
      signOut,
      clearError,
    }),
    [user, loading, isSigningIn, error, errorCode, signInWithGoogle, signOut, clearError]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
