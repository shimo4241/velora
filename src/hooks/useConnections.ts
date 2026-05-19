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
      return () => {
        active = false;
      };
    }

    const unsubscribe = onConnectionsChange(uid, (conns) => {
      if (!active) return;
      setState({ uid, connections: conns, loading: false });
    }, () => {
      if (!active) return;
      setState({ uid, connections: [], loading: false });
    });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [uid]);

  const isCurrent = state.uid === uid;
  const connections = uid && isCurrent ? state.connections : [];
  const loading = Boolean(uid && (!isCurrent || state.loading));

  return { connections, loading, count: connections.length };
}
