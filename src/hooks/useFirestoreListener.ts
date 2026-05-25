"use client";

import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { logger } from "@/lib/logger";

export type FirestoreUnsubscribe = () => void;

export type FirestoreSubscribeFactory<T> = (
  onNext: (data: T) => void,
  onError: (err: Error) => void
) => FirestoreUnsubscribe | undefined;

export interface FirestoreListenerSnapshot<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
}

const TEARDOWN_DELAY_MS = 250;

type StoreListener = () => void;

class FirestoreListenerStore<T> {
  private snapshot: FirestoreListenerSnapshot<T>;
  private readonly serverSnapshot: FirestoreListenerSnapshot<T>;
  private readonly listeners = new Set<StoreListener>();
  private unsubscribe: FirestoreUnsubscribe | undefined;
  private teardownTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private readonly key: string,
    private subscribeFactory: FirestoreSubscribeFactory<T>,
    initialData: T | undefined
  ) {
    this.snapshot = {
      data: initialData,
      loading: true,
      error: null,
    };
    this.serverSnapshot = this.snapshot;
  }

  updateFactory(subscribeFactory: FirestoreSubscribeFactory<T>) {
    this.subscribeFactory = subscribeFactory;
  }

  getSnapshot = () => this.snapshot;

  getServerSnapshot = () => this.serverSnapshot;

  subscribe = (listener: StoreListener) => {
    this.listeners.add(listener);

    if (this.teardownTimer) {
      clearTimeout(this.teardownTimer);
      this.teardownTimer = undefined;
    }

    this.start();

    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.scheduleStop();
      }
    };
  };

  private start() {
    if (this.unsubscribe) return;

    logger.debug(`[FirestoreStore:${this.key}] subscribing`);
    this.setSnapshot({
      data: this.snapshot.data,
      loading: true,
      error: null,
    });

    try {
      const unsubscribe = this.subscribeFactory(
        (data) => {
          this.setSnapshot({ data, loading: false, error: null });
        },
        (error) => {
          logger.error(`[FirestoreStore:${this.key}] listener error`, error);
          this.setSnapshot({
            data: this.snapshot.data,
            loading: false,
            error,
          });
        }
      );

      if (!unsubscribe) {
        this.setSnapshot({
          data: undefined,
          loading: false,
          error: null,
        });
        return;
      }

      this.unsubscribe = unsubscribe;
    } catch (error) {
      const normalizedError =
        error instanceof Error ? error : new Error(String(error));
      logger.error(`[FirestoreStore:${this.key}] subscribe failed`, normalizedError);
      this.setSnapshot({
        data: this.snapshot.data,
        loading: false,
        error: normalizedError,
      });
    }
  }

  private scheduleStop() {
    if (this.teardownTimer) return;

    this.teardownTimer = setTimeout(() => {
      this.teardownTimer = undefined;
      if (this.listeners.size > 0) return;
      this.stop();
      listenerStores.delete(this.key);
    }, TEARDOWN_DELAY_MS);
  }

  private stop() {
    if (!this.unsubscribe) return;
    logger.debug(`[FirestoreStore:${this.key}] unsubscribing`);
    this.unsubscribe();
    this.unsubscribe = undefined;
  }

  private setSnapshot(nextSnapshot: FirestoreListenerSnapshot<T>) {
    if (
      Object.is(this.snapshot.data, nextSnapshot.data) &&
      this.snapshot.loading === nextSnapshot.loading &&
      Object.is(this.snapshot.error, nextSnapshot.error)
    ) {
      return;
    }

    this.snapshot = nextSnapshot;
    this.listeners.forEach((listener) => listener());
  }
}

const listenerStores = new Map<string, FirestoreListenerStore<unknown>>();

function getOrCreateListenerStore<T>(
  key: string,
  subscribeFactory: FirestoreSubscribeFactory<T>,
  initialData: T | undefined
): FirestoreListenerStore<T> {
  const existingStore = listenerStores.get(key);
  if (existingStore) {
    const typedStore = existingStore as FirestoreListenerStore<T>;
    typedStore.updateFactory(subscribeFactory);
    return typedStore;
  }

  const store = new FirestoreListenerStore(key, subscribeFactory, initialData);
  listenerStores.set(key, store as FirestoreListenerStore<unknown>);
  return store;
}

export function useFirestoreListener<T>(
  key: string | null | undefined,
  subscribeFactory: FirestoreSubscribeFactory<T> | null | undefined,
  initialData?: T
): FirestoreListenerSnapshot<T> {
  const store = useMemo(() => {
    if (!key || !subscribeFactory) return null;
    return getOrCreateListenerStore(key, subscribeFactory, initialData);
  }, [key, subscribeFactory, initialData]);

  const disabledSnapshot = useMemo<FirestoreListenerSnapshot<T>>(
    () => ({
      data: initialData,
      loading: false,
      error: null,
    }),
    [initialData]
  );

  return useSyncExternalStore(
    store?.subscribe ?? (() => () => undefined),
    store?.getSnapshot ?? (() => disabledSnapshot),
    store?.getServerSnapshot ?? (() => disabledSnapshot)
  );
}

/**
 * Extracts a stable UID string from a Firebase User object.
 * Use this instead of putting the `user` object in dependency arrays.
 */
export function useStableUid(user: { uid: string } | null | undefined): string | null {
  return user?.uid ?? null;
}

/**
 * Creates a ref-stable callback for event handlers that need the latest closure.
 */
export function useStableCallback<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => TResult
): (...args: TArgs) => TResult {
  const ref = useRef(fn);

  useEffect(() => {
    ref.current = fn;
  }, [fn]);

  return useCallback((...args: TArgs) => ref.current(...args), []);
}
