"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  getDailyStats,
  getRecentActivity,
  trackAnalyticsEvent,
} from "@/lib/firestore";
import type { DailyStats, ActivityItem } from "@/types";

const EMPTY_STATS: DailyStats = { views: 0, taps: 0, scans: 0, clicks: 0 };

/* ═══════════════════════════════════════════════════
   VELORA — useStats / useActivity Hooks
   ═══════════════════════════════════════════════════ */

export function useStats() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [state, setState] = useState<{
    uid: string | null;
    stats: DailyStats;
  }>({ uid: null, stats: EMPTY_STATS });

  useEffect(() => {
    let active = true;

    if (!uid) {
      return () => {
        active = false;
      };
    }

    getDailyStats(uid)
      .then((s) => {
        if (!active) return;
        setState({ uid, stats: s });
      })
      .catch((error) => {
        if (!active) return;
        console.error("Failed to load daily stats:", error);
        setState({ uid, stats: EMPTY_STATS });
      });

    return () => {
      active = false;
    };
  }, [uid]);

  const trackEvent = useCallback(
    async (event: string, metadata?: Record<string, unknown>) => {
      if (!uid) return;
      await trackAnalyticsEvent({ userId: uid, event, metadata });
    },
    [uid]
  );

  const isCurrent = state.uid === uid;
  const stats = uid && isCurrent ? state.stats : EMPTY_STATS;
  const loading = Boolean(uid && !isCurrent);

  return { stats, loading, trackEvent };
}

export function useActivity() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [state, setState] = useState<{
    uid: string | null;
    activity: ActivityItem[];
  }>({ uid: null, activity: [] });

  useEffect(() => {
    let active = true;

    if (!uid) {
      return () => {
        active = false;
      };
    }

    getRecentActivity(uid)
      .then((a) => {
        if (!active) return;
        setState({ uid, activity: a });
      })
      .catch((error) => {
        if (!active) return;
        console.error("Failed to load recent activity:", error);
        setState({ uid, activity: [] });
      });

    return () => {
      active = false;
    };
  }, [uid]);

  const isCurrent = state.uid === uid;
  const activity = uid && isCurrent ? state.activity : [];
  const loading = Boolean(uid && !isCurrent);

  return { activity, loading };
}
