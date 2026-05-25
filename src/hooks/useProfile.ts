"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useProfileContext } from "@/providers/ProfileProvider";
import {
  onPortfolioChange,
  onExperienceChange,
} from "@/services";
import type { PortfolioItem, ExperienceEntry } from "@/types";

/* ═══════════════════════════════════════════════════
   VELORA — useProfile Hook
   Real-time profile data from Firestore
   ═══════════════════════════════════════════════════ */

export function useProfileNullable() {
  return useProfileContext();
}

/**
 * Shared profile context hook.
 * The ProfileProvider owns the only profile document listener.
 */
export function useProfile() {
  return useProfileNullable();
}

/**
 * Generic helper hook to subscribe to any user subcollection (e.g. portfolio, experience).
 */
function useFirestoreSubcollection<T>(
  onSubcollectionChange: (
    uid: string,
    onNext: (items: T[]) => void,
    onError: (err: Error) => void
  ) => (() => void) | undefined
) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [state, setState] = useState<{
    uid: string | null;
    items: T[];
    loading: boolean;
  }>({ uid: null, items: [], loading: false });

  useEffect(() => {
    setState({ uid, items: [], loading: !!uid });
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    let active = true;

    const unsubscribe = onSubcollectionChange(
      uid,
      (items) => {
        if (!active) return;
        setState({ uid, items, loading: false });
      },
      () => {
        if (!active) return;
        setState({ uid, items: [], loading: false });
      }
    );

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [uid, onSubcollectionChange]);

  const isCurrent = state.uid === uid;
  const items = uid && isCurrent ? state.items : [];
  const loading = Boolean(uid && (!isCurrent || state.loading));

  return { items, loading };
}

export function usePortfolio() {
  const { items, loading } = useFirestoreSubcollection<PortfolioItem>(onPortfolioChange);
  return { portfolio: items, loading };
}

export function useExperience() {
  const { items, loading } = useFirestoreSubcollection<ExperienceEntry>(onExperienceChange);
  return { experience: items, loading };
}
