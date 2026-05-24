"use client";
import { logger } from "@/lib/logger";
import { useCallback, useState, useSyncExternalStore } from "react";
import { analytics } from "./firebase";
import { logEvent } from "firebase/analytics";
import * as Sentry from "@sentry/nextjs";

export function useOnlineStatus() {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") return () => undefined;

      const handleOnline = () => onStoreChange();
      const handleOffline = () => onStoreChange();

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    },
    () => (typeof navigator === "undefined" ? true : navigator.onLine),
    () => true
  );
}

export function useAnalytics() {
  const track = useCallback((event: string, properties?: Record<string, unknown>) => {
    if (analytics) {
      logEvent(analytics, event, properties);
    }
    if (process.env.NODE_ENV === "development") {
      logger.debug(`[VELORA Analytics] ${event}`, properties);
    }
  }, []);

  const identify = useCallback((userId: string) => {
    if (analytics) {
      logEvent(analytics, "login", { userId });
    }
  }, []);

  const page = useCallback((name: string) => {
    if (analytics) {
      logEvent(analytics, "page_view", { page_title: name });
    }
  }, []);

  return { track, identify, page };
}

export function useInviteAccess() {
  const [validatedAccess, setValidatedAccess] = useState(false);
  const storedAccess = useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") return () => undefined;
      window.addEventListener("storage", onStoreChange);
      return () => window.removeEventListener("storage", onStoreChange);
    },
    () => {
      return Boolean(localStorage.getItem("velora_invite_code"));
    },
    () => true
  );

  const validateCode = useCallback((code: string): boolean => {
    const validCodes = ["FOUNDING-ACCESS", "VELORA-BETA", "MENA-2026"];
    const normalizedCode = code.toUpperCase();
    const isValid = validCodes.includes(normalizedCode);

    if (isValid) {
      localStorage.setItem("velora_invite_code", normalizedCode);
      setValidatedAccess(true);
    }

    return isValid;
  }, []);

  return { hasAccess: storedAccess || validatedAccess, isChecking: false, validateCode };
}

export function reportError(error: Error, context?: Record<string, unknown>) {
  Sentry.captureException(error, { extra: context });
  if (process.env.NODE_ENV === "development") {
    logger.error("[VELORA Error]", error, context);
  }
}
