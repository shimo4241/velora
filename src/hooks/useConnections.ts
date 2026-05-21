"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { onConnectionsChange } from "@/lib/firestore";
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

  useEffect(() => {
    let active = true;

    if (!uid) {
      setState({ uid: null, connections: [], loading: false });
      return () => {
        active = false;
      };
    }

    // Immediately mark as loading so the UI shows skeletons instead of "0 contacts"
    // while we wait for the first Firestore snapshot.
    setState({ uid, connections: [], loading: true });
    console.info(`[useConnections] Subscribing uid=${uid}`);

    const unsubscribe = onConnectionsChange(
      uid,
      (conns) => {
        if (!active) return;
        console.info(`[useConnections] Received ${conns.length} connection(s) for uid=${uid}`);
        setState({ uid, connections: conns, loading: false });
      },
      (err) => {
        if (!active) return;
        console.error(`[useConnections] Error for uid=${uid}`, err);
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
