"use client";

import { isNativePlatform, useAppLifecycle, useCapacitorInit } from "@/lib/capacitor";
import { useEffect, useMemo } from "react";

function routeFromNativeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "velora:" && parsed.pathname) return parsed.pathname;
    if (parsed.hostname === "velora-navy.vercel.app" || parsed.hostname.endsWith(".vercel.app")) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {
    return null;
  }
  return null;
}

export function useNativeRuntime() {
  useCapacitorInit();

  const lifecycleCallbacks = useMemo(
    () => ({
      onResume: () => {
        document.body.classList.remove("native-paused");
        document.body.classList.add("native-resumed");
        window.setTimeout(() => document.body.classList.remove("native-resumed"), 800);
      },
      onPause: () => {
        document.body.classList.add("native-paused");
      },
    }),
    []
  );

  useAppLifecycle(lifecycleCallbacks);

  useEffect(() => {
    if (!isNativePlatform()) return;
    document.documentElement.classList.add("capacitor-native");
  }, []);

  return {
    isNative: typeof window !== "undefined" && isNativePlatform(),
    routeFromNativeUrl,
  };
}
