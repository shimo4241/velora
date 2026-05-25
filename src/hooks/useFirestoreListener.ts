"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { logger } from "@/lib/logger";

/**
 * Production-grade Firestore subscription hook.
 *
 * Solves:
 * - Post-unmount state updates (active flag)
 * - React StrictMode double-subscription (clean teardown→re-subscribe)
 * - Missing error handlers (always logs, optionally forwards)
 * - Stale closures (subscribeFn is called fresh on each effect run)
 *
 * @param key - Stable string key for logging (e.g. "connections:abc123")
 * @param subscribeFn - Function that sets up the listener and returns an unsubscribe fn.
 *                      Return `undefined` to skip subscription (e.g. when uid is null).
 *                      Receives `onNext` and `onError` callbacks that are already guarded.
 * @param deps - Dependency array for when to re-subscribe.
 */
export function useFirestoreListener<T>(
  key: string,
  subscribeFn:
    | ((
        onNext: (data: T) => void,
        onError: (err: Error) => void
      ) => (() => void) | undefined)
    | null,
  deps: React.DependencyList
): { data: T | undefined; loading: boolean; error: Error | null } {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(!!subscribeFn);
  const [error, setError] = useState<Error | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!subscribeFn) {
      setData(undefined);
      setLoading(false);
      setError(null);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    logger.debug(`[Firestore:${key}] subscribing`);

    const unsubscribe = subscribeFn(
      (nextData) => {
        if (!active) return;
        setData(nextData);
        setLoading(false);
      },
      (err) => {
        if (!active) return;
        logger.error(`[Firestore:${key}] listener error`, err);
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      active = false;
      logger.debug(`[Firestore:${key}] unsubscribing`);
      unsubscribe?.();
    };
  }, deps);

  return { data, loading, error };
}

/**
 * Extracts a stable UID string from a Firebase User object.
 * Use this instead of putting the `user` object in dependency arrays.
 */
export function useStableUid(user: { uid: string } | null | undefined): string | null {
  return user?.uid ?? null;
}

/**
 * Creates a ref-stable version of a callback to avoid dependency churn.
 * The returned function always calls the latest version of `fn`.
 */
export function useStableCallback<T extends (...args: never[]) => unknown>(fn: T): T {
  const ref = useRef<T>(fn);
  ref.current = fn;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(
    ((...args: Parameters<T>) => ref.current(...args)) as T,
    []
  );
}
