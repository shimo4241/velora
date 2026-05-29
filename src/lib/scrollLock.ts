"use client";

import { useEffect } from "react";

const locks = new Set<string>();

export function lockScroll(id: string) {
  if (typeof document === "undefined") return;
  locks.add(id);
  document.body.style.overflow = "hidden";
  document.body.style.position = "fixed";
  document.body.style.width = "100%";
}

export function unlockScroll(id: string) {
  if (typeof document === "undefined") return;
  locks.delete(id);
  if (locks.size === 0) {
    document.body.style.overflow = "";
    document.body.style.position = "";
    document.body.style.width = "";
  }
}

export function forceUnlockScroll() {
  if (typeof document === "undefined") return;
  locks.clear();
  document.body.style.overflow = "";
  document.body.style.position = "";
  document.body.style.width = "";
}

export function useScrollLock(locked: boolean, id: string) {
  useEffect(() => {
    if (locked) {
      lockScroll(id);
      return () => {
        unlockScroll(id);
      };
    }
  }, [locked, id]);
}
