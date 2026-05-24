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

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    async function initializeAuth() {
      try {
        await ensureLocalAuthPersistence();
        await consumeAuthRedirectResult();
      } catch (authError) {
        if (!active) return;
        setErrorCode(getAuthErrorCode(authError));
        setError(getAuthErrorMessage(authError));
        setLoading(false);
        return;
      }

      if (!active) return;

      unsubscribe = onAuthChange(async (firebaseUser) => {
        if (!active) return;

        logger.debug("[Auth] auth hydration", {
          uid: firebaseUser?.uid ?? null,
          isAnonymous: firebaseUser?.isAnonymous ?? false,
        });
        logger.debug("[Auth] current user uid", {
          uid: firebaseUser?.uid ?? null,
        });

        if (firebaseUser?.isAnonymous) {
          setError("Les sessions anonymes ne sont plus prises en charge.");
          setErrorCode(null);
          try {
            await signOutUser();
          } finally {
            if (!active) return;
            setUser(null);
            setLoading(false);
          }
          return;
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
