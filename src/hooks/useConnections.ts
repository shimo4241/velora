"use client";

import { useAuth } from "@/providers/AuthProvider";
import { onConnectionsChange } from "@/services";
import { useFirestoreListener } from "@/hooks/useFirestoreListener";
import type { VeloraConnection } from "@/types";

const EMPTY_CONNECTIONS: VeloraConnection[] = [];

export function useConnections() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const { data, loading } = useFirestoreListener<VeloraConnection[]>(
    uid ? `connections:${uid}` : null,
    uid ? (onNext, onError) => onConnectionsChange(uid, onNext, onError) : null,
    EMPTY_CONNECTIONS
  );

  const connections = uid ? data ?? EMPTY_CONNECTIONS : EMPTY_CONNECTIONS;

  return { connections, loading: Boolean(uid && loading), count: connections.length };
}
