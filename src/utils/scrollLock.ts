"use client";

import { useEffect, useId } from "react";

const activeLocks = new Set<string>();

export function lockBodyScroll(id: string) {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  activeLocks.add(id);
  document.documentElement.classList.add("modal-open");
  document.body.classList.add("modal-open");
}

export function unlockBodyScroll(id: string) {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  activeLocks.delete(id);
  if (activeLocks.size === 0) {
    document.documentElement.classList.remove("modal-open");
    document.body.classList.remove("modal-open");
  }
}

/**
 * Hook to manage body scroll lock based on an active flag.
 * Safely handles React 18 strict mode and dynamic state changes.
 */
export function useScrollLock(locked: boolean) {
  const id = useId();
  
  useEffect(() => {
    if (locked) {
      lockBodyScroll(id);
    }
    return () => {
      unlockBodyScroll(id);
    };
  }, [locked, id]);
}
