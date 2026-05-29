"use client";
import { logger } from "@/lib/logger";


import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/providers/AuthProvider";
import {
  getDailyStats,
  getRecentActivity,
  trackAnalyticsEvent,
} from "@/services";
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
  }>(() => {
    if (typeof window !== "undefined" && uid) {
      try {
        const stored = localStorage.getItem(`velora_cached_stats_${uid}`);
        return { uid, stats: stored ? JSON.parse(stored) : EMPTY_STATS };
      } catch (e) {
        logger.error("[useStats] Failed to parse cached stats:", e);
      }
    }
    return { uid: null, stats: EMPTY_STATS };
  });

  // Restore cached stats on user change
  useEffect(() => {
    if (typeof window !== "undefined" && uid) {
      try {
        const stored = localStorage.getItem(`velora_cached_stats_${uid}`);
        setState({ uid, stats: stored ? JSON.parse(stored) : EMPTY_STATS });
      } catch (e) {
        logger.error("[useStats] Failed to restore cached stats on user change:", e);
      }
    } else {
      setState({ uid: null, stats: EMPTY_STATS });
    }
  }, [uid]);

  useEffect(() => {
    let active = true;

    if (!uid) return;

    getDailyStats(uid)
      .then((s) => {
        if (!active) return;
        setState({ uid, stats: s });
        if (typeof window !== "undefined") {
          localStorage.setItem(`velora_cached_stats_${uid}`, JSON.stringify(s));
        }
      })
      .catch((error) => {
        if (!active) return;
        logger.error("Failed to load daily stats:", error);
      });

    return () => {
      active = false;
    };
  }, [uid]);

  const trackEvent = useCallback(
    async (event: string, metadata?: Record<string, unknown>) => {
      if (!uid) return;
      try {
        await trackAnalyticsEvent({ userId: uid, event, metadata });
      } catch (e) {
        logger.warn("[useStats:trackEvent] Failed tracking event offline:", e);
      }
    },
    [uid]
  );

  const isCurrent = state.uid === uid;
  const stats = uid && isCurrent ? state.stats : EMPTY_STATS;
  const loading = Boolean(uid && !isCurrent && stats === EMPTY_STATS);

  return { stats, loading, trackEvent };
}

export function useActivity() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [state, setState] = useState<{
    uid: string | null;
    activity: ActivityItem[];
  }>(() => {
    if (typeof window !== "undefined" && uid) {
      try {
        const stored = localStorage.getItem(`velora_cached_activity_${uid}`);
        return { uid, activity: stored ? JSON.parse(stored) : [] };
      } catch (e) {
        logger.error("[useActivity] Failed to parse cached activity:", e);
      }
    }
    return { uid: null, activity: [] };
  });

  // Restore cached activity on user change
  useEffect(() => {
    if (typeof window !== "undefined" && uid) {
      try {
        const stored = localStorage.getItem(`velora_cached_activity_${uid}`);
        setState({ uid, activity: stored ? JSON.parse(stored) : [] });
      } catch (e) {
        logger.error("[useActivity] Failed to restore cached activity on user change:", e);
      }
    } else {
      setState({ uid: null, activity: [] });
    }
  }, [uid]);

  useEffect(() => {
    let active = true;

    if (!uid) return;

    getRecentActivity(uid)
      .then((a) => {
        if (!active) return;
        setState({ uid, activity: a });
        if (typeof window !== "undefined") {
          localStorage.setItem(`velora_cached_activity_${uid}`, JSON.stringify(a));
        }
      })
      .catch((error) => {
        if (!active) return;
        logger.error("Failed to load recent activity:", error);
      });

    return () => {
      active = false;
    };
  }, [uid]);

  const isCurrent = state.uid === uid;
  const activity = uid && isCurrent ? state.activity : [];
  const loading = Boolean(uid && !isCurrent && activity.length === 0);

  return { activity, loading };
}
