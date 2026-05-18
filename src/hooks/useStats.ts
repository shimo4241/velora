"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  getDailyStats,
  getRecentActivity,
  trackAnalyticsEvent,
} from "@/lib/firestore";
import type { DailyStats, ActivityItem } from "@/types";

/* ═══════════════════════════════════════════════════
   VELORA — useStats / useActivity Hooks
   ═══════════════════════════════════════════════════ */

export function useStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DailyStats>({ views: 0, taps: 0, scans: 0, clicks: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getDailyStats(user.uid).then((s) => { setStats(s); setLoading(false); });
  }, [user]);

  const trackEvent = useCallback(
    async (event: string, metadata?: Record<string, unknown>) => {
      if (!user) return;
      await trackAnalyticsEvent({ userId: user.uid, event, metadata });
    },
    [user]
  );

  return { stats, loading, trackEvent };
}

export function useActivity() {
  const { user } = useAuth();
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setActivity([]); setLoading(false); return; }
    getRecentActivity(user.uid).then((a) => { setActivity(a); setLoading(false); });
  }, [user]);

  return { activity, loading };
}
