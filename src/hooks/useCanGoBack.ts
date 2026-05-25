"use client";

import { useSyncExternalStore } from "react";

function subscribeToHistoryLength() {
  return () => undefined;
}

function getCanGoBackSnapshot() {
  return typeof window !== "undefined" && window.history.length > 1;
}

export function useCanGoBack() {
  return useSyncExternalStore(
    subscribeToHistoryLength,
    getCanGoBackSnapshot,
    () => false
  );
}
