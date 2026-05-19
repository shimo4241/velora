"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useProfileContext } from "@/components/providers/ProfileProvider";
import {
  onPortfolioChange,
  onExperienceChange,
} from "@/lib/firestore";
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

export function usePortfolio() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [state, setState] = useState<{
    uid: string | null;
    portfolio: PortfolioItem[];
  }>({ uid: null, portfolio: [] });

  useEffect(() => {
    let active = true;

    if (!uid) {
      return () => {
        active = false;
      };
    }

    const unsubscribe = onPortfolioChange(uid, (items) => {
      if (!active) return;
      setState({ uid, portfolio: items });
    }, () => {
      if (!active) return;
      setState({ uid, portfolio: [] });
    });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [uid]);

  const isCurrent = state.uid === uid;
  const portfolio = uid && isCurrent ? state.portfolio : [];
  const loading = Boolean(uid && !isCurrent);

  return { portfolio, loading };
}

export function useExperience() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [state, setState] = useState<{
    uid: string | null;
    experience: ExperienceEntry[];
  }>({ uid: null, experience: [] });

  useEffect(() => {
    let active = true;

    if (!uid) {
      return () => {
        active = false;
      };
    }

    const unsubscribe = onExperienceChange(uid, (entries) => {
      if (!active) return;
      setState({ uid, experience: entries });
    }, () => {
      if (!active) return;
      setState({ uid, experience: [] });
    });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [uid]);

  const isCurrent = state.uid === uid;
  const experience = uid && isCurrent ? state.experience : [];
  const loading = Boolean(uid && !isCurrent);

  return { experience, loading };
}
