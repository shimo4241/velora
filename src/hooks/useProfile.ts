"use client";

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
  const { data, loading } = useFirestoreListener<T[]>(
    uid ? `user:${uid}:${name}` : null,
    uid ? (onNext, onError) => onSubcollectionChange(uid, onNext, onError) : null,
    emptyItems
  );

  return {
    items: uid ? data ?? emptyItems : emptyItems,
    loading: Boolean(uid && loading),
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
