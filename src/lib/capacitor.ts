"use client";

import { useEffect, useCallback } from "react";

/* ═══════════════════════════════════════════════════
   VELORA — Capacitor Bridge
   Native integrations: StatusBar, Haptics, Keyboard, App
   Falls back gracefully in browser context.
   ═══════════════════════════════════════════════════ */

/** Detect if running inside Capacitor native shell */
export function isNativePlatform(): boolean {
  return typeof window !== "undefined" && !!(window as unknown as Record<string, unknown>).Capacitor;
}

/** Get platform: 'ios' | 'android' | 'web' */
export function getPlatform(): "ios" | "android" | "web" {
  if (!isNativePlatform()) return "web";
  const cap = (window as unknown as Record<string, unknown>).Capacitor as Record<string, unknown>;
  const fn = cap.getPlatform as (() => string) | undefined;
  return (fn?.() as "ios" | "android") ?? "web";
}

/**
 * Initialize native plugins on mount.
 * Safe to call in browser — all imports are dynamic.
 */
export function useCapacitorInit() {
  useEffect(() => {
    if (!isNativePlatform()) return;

    const init = async () => {
      try {
        // Status bar — transparent overlay
        const { StatusBar, Style } = await import("@capacitor/status-bar");
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: "#00000000" });
        await StatusBar.setOverlaysWebView({ overlay: true });
      } catch {
        // StatusBar not available
      }

      try {
        // Hide splash after our own animation completes
        const { SplashScreen } = await import("@capacitor/splash-screen");
        await SplashScreen.hide({ fadeOutDuration: 300 });
      } catch {
        // SplashScreen not available
      }

      try {
        // Keyboard — handle viewport resize
        const { Keyboard } = await import("@capacitor/keyboard");
        Keyboard.addListener("keyboardWillShow", () => {
          document.body.classList.add("keyboard-open");
        });
        Keyboard.addListener("keyboardWillHide", () => {
          document.body.classList.remove("keyboard-open");
        });
      } catch {
        // Keyboard not available
      }
    };

    init();
  }, []);
}

/**
 * Haptic feedback — premium touch feel.
 * Falls back to no-op in browser.
 */
export function useHaptics() {
  const impact = useCallback(async (style: "light" | "medium" | "heavy" = "light") => {
    if (!isNativePlatform()) return;
    try {
      const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
      const styleMap = {
        light: ImpactStyle.Light,
        medium: ImpactStyle.Medium,
        heavy: ImpactStyle.Heavy,
      };
      await Haptics.impact({ style: styleMap[style] });
    } catch {
      // Haptics not available
    }
  }, []);

  const notification = useCallback(async () => {
    if (!isNativePlatform()) return;
    try {
      const { Haptics, NotificationType } = await import("@capacitor/haptics");
      await Haptics.notification({ type: NotificationType.Success });
    } catch {
      // Haptics not available
    }
  }, []);

  return { impact, notification };
}

/**
 * App lifecycle events.
 */
export function useAppLifecycle(callbacks?: {
  onResume?: () => void;
  onPause?: () => void;
}) {
  useEffect(() => {
    if (!isNativePlatform()) return;

    let cleanup: (() => void) | undefined;

    const init = async () => {
      try {
        const { App } = await import("@capacitor/app");
        const resumeListener = await App.addListener("resume", () => {
          callbacks?.onResume?.();
        });
        const pauseListener = await App.addListener("pause", () => {
          callbacks?.onPause?.();
        });

        cleanup = () => {
          resumeListener.remove();
          pauseListener.remove();
        };
      } catch {
        // App plugin not available
      }
    };

    init();

    return () => cleanup?.();
  }, [callbacks]);
}
