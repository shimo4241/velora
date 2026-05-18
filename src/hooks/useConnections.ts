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
  const [connections, setConnections] = useState<VeloraConnection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setConnections([]); setLoading(false); return; }
    const unsub = onConnectionsChange(user.uid, (conns) => {
      setConnections(conns);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  return { connections, loading, count: connections.length };
}
