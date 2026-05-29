"use client";

import { useState, useEffect } from "react";
import { logger } from "@/lib/logger";
import { useAuth } from "@/providers/AuthProvider";
import { useProfileContext } from "@/providers/ProfileProvider";
import { onExperienceChange, onPortfolioChange } from "@/services";
import { useFirestoreListener } from "@/hooks/useFirestoreListener";
import type { ExperienceEntry, PortfolioItem } from "@/types";

export function useProfileNullable() {
  return useProfileContext();
}

/**
 * Shared profile context hook.
 * The ProfileProvider owns the only profile document listener.
 */
export function useProfile() {
  return useProfileNullable();
}

const EMPTY_PORTFOLIO: PortfolioItem[] = [];
const EMPTY_EXPERIENCE: ExperienceEntry[] = [];

function useFirestoreSubcollection<T>(
  name: string,
  onSubcollectionChange: (
    uid: string,
    onNext: (items: T[]) => void,
    onError: (err: Error) => void
  ) => (() => void) | undefined,
  emptyItems: T[]
) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const [cachedItems, setCachedItems] = useState<T[]>(() => {
    if (typeof window !== "undefined" && uid) {
      try {
        const stored = localStorage.getItem(`velora_cached_${name}_${uid}`);
        return stored ? JSON.parse(stored) : emptyItems;
      } catch (e) {
        logger.error(`[useFirestoreSubcollection] Failed to parse cached ${name}:`, e);
      }
    }
    return emptyItems;
  });

  // Watch uid changes to update cached state
  useEffect(() => {
    if (typeof window !== "undefined" && uid) {
      try {
        const stored = localStorage.getItem(`velora_cached_${name}_${uid}`);
        setCachedItems(stored ? JSON.parse(stored) : emptyItems);
      } catch (e) {
        logger.error(`[useFirestoreSubcollection] Failed to parse cached ${name} on uid change:`, e);
      }
    } else {
      setCachedItems(emptyItems);
    }
  }, [uid, name, emptyItems]);

  const { data, loading } = useFirestoreListener<T[]>(
    uid ? `user:${uid}:${name}` : null,
    uid
      ? (onNext, onError) =>
          onSubcollectionChange(
            uid,
            (items) => {
              if (typeof window !== "undefined" && uid) {
                localStorage.setItem(`velora_cached_${name}_${uid}`, JSON.stringify(items));
              }
              setCachedItems(items);
              onNext(items);
            },
            onError
          )
      : null,
    emptyItems
  );

  const items = uid ? (data !== undefined ? data : cachedItems) : emptyItems;

  return {
    items,
    loading: Boolean(uid && loading && items === emptyItems),
  };
}

export function usePortfolio() {
  const { items, loading } = useFirestoreSubcollection<PortfolioItem>(
    "portfolio",
    onPortfolioChange,
    EMPTY_PORTFOLIO
  );
  return { portfolio: items, loading };
}

export function useExperience() {
  const { items, loading } = useFirestoreSubcollection<ExperienceEntry>(
    "experience",
    onExperienceChange,
    EMPTY_EXPERIENCE
  );
  return { experience: items, loading };
}
