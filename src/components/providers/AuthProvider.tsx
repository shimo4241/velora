"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { type User } from "firebase/auth";
import { onAuthChange } from "@/lib/auth";

/* ═══════════════════════════════════════════════════
   VELORA — Auth Provider
   Wraps entire app with auth state
   ═══════════════════════════════════════════════════ */

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAuthReady: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  isAuthReady: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthChange((firebaseUser) => {
      if (!active) return;
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthReady: !loading,
    }),
    [user, loading]
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
