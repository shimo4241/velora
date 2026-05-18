"use client";

import { useState, useEffect, useCallback } from "react";

/* ═══════════════════════════════════════════════════
   VELORA — Beta Launch Hooks
   Offline detection, analytics, invite gating
   ═══════════════════════════════════════════════════ */

/** Detect online/offline status */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Analytics event tracker.
 * Logs to console in dev; pipe to PostHog/Amplitude in production.
 */
export function useAnalytics() {
  const track = useCallback((event: string, properties?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[VELORA Analytics] ${event}`, properties);
      return;
    }

    // Phase 4: PostHog integration
    // posthog?.capture(event, properties);
  }, []);

  const identify = useCallback((userId: string, traits?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[VELORA Identify] ${userId}`, traits);
      return;
    }

    // Phase 4: PostHog integration
    // posthog?.identify(userId, traits);
  }, []);

  const page = useCallback((name: string) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[VELORA Page] ${name}`);
      return;
    }

    // Phase 4: PostHog integration
    // posthog?.capture('$pageview', { page: name });
  }, []);

  return { track, identify, page };
}

/**
 * Invite-only gating.
 * Checks localStorage for valid invite code.
 */
export function useInviteAccess() {
  const [hasAccess, setHasAccess] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Phase 1: bypass — all users have access
    // In production, check for invite code
    const bypass = true; // Toggle for beta launch
    const storedCode = localStorage.getItem("velora_invite_code");

    if (bypass || storedCode) {
      setHasAccess(true);
    }
    setIsChecking(false);
  }, []);

  const validateCode = useCallback((code: string): boolean => {
    // Phase 4: Validate against backend
    const validCodes = ["FOUNDING-ACCESS", "VELORA-BETA", "MENA-2026"];
    const isValid = validCodes.includes(code.toUpperCase());

    if (isValid) {
      localStorage.setItem("velora_invite_code", code.toUpperCase());
      setHasAccess(true);
    }

    return isValid;
  }, []);

  return { hasAccess, isChecking, validateCode };
}

/**
 * Error boundary reporting.
 * Logs to console in dev; pipe to Sentry in production.
 */
export function reportError(error: Error, context?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "development") {
    console.error("[VELORA Error]", error, context);
    return;
  }

  // Phase 4: Sentry integration
  // Sentry.captureException(error, { extra: context });
}
