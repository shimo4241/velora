"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import {
  getNotificationPermissionState,
  registerNotificationToken,
  requestNotificationPermission,
  type NativeNotificationToken,
  type NotificationPermissionState,
} from "@/lib/nativeNotifications";

export function useNativeNotifications() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [permission, setPermission] = useState<NotificationPermissionState>("prompt");
  const [token, setToken] = useState<NativeNotificationToken | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    getNotificationPermissionState().then((state) => {
      if (active) setPermission(state);
    });
    return () => {
      active = false;
    };
  }, []);

  const requestPermission = useCallback(async () => {
    setLoading(true);
    try {
      const state = await requestNotificationPermission();
      setPermission(state);
      return state;
    } finally {
      setLoading(false);
    }
  }, []);

  const saveToken = useCallback(
    async (nextToken: NativeNotificationToken) => {
      if (!uid) throw new Error("Unauthenticated");
      await registerNotificationToken(uid, nextToken);
      setToken(nextToken);
    },
    [uid]
  );

  return {
    permission,
    token,
    loading,
    requestPermission,
    saveToken,
    isPrepared: true,
  };
}
