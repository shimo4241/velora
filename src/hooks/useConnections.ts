"use client";
import { logger } from "@/lib/logger";


import { useState, useEffect } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { onConnectionsChange } from "@/services";
import type { VeloraConnection } from "@/types";

/* ═══════════════════════════════════════════════════
   VELORA — useConnections Hook
   Real-time scan memory from Firestore
   ═══════════════════════════════════════════════════ */

export function useConnections() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [state, setState] = useState<{
    uid: string | null;
    connections: VeloraConnection[];
    loading: boolean;
  }>({ uid: null, connections: [], loading: false });

  // Reset connections state when the authenticated user changes.
  // This replaces the former mid-render setState which React 18+ flags as unstable.
  useEffect(() => {
    setState({ uid, connections: [], loading: !!uid });
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    let active = true;

    logger.info(`[useConnections] Subscribing uid=${uid}`);

    const unsubscribe = onConnectionsChange(
      uid,
      (conns) => {
        if (!active) return;
        logger.info(`[useConnections] Received ${conns.length} connection(s) for uid=${uid}`);
        setState({ uid, connections: conns, loading: false });
      },
      (err) => {
        if (!active) return;
        logger.error(`[useConnections] Error for uid=${uid}`, err);
        setState({ uid, connections: [], loading: false });
      }
    );

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [uid]);

  const isCurrent = state.uid === uid;
  const connections = uid && isCurrent ? state.connections : [];
  // Show loading when uid exists but state hasn't settled for this uid yet
  const loading = Boolean(uid && (!isCurrent || state.loading));

  return { connections, loading, count: connections.length };
}
