"use client";

import { useMemo, useState } from "react";
import { logger } from "@/lib/logger";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useProfile } from "@/hooks/useProfile";
import { useFirestoreListener } from "@/hooks/useFirestoreListener";
import { onDiscoverUsersChange } from "@/services";
import { calculateHaversineDistance } from "@/utils/geolocation";
import type { VeloraProfile } from "@/types";

const EMPTY_USERS: VeloraProfile[] = [];
const DISCOVER_PAGE_SIZE = 100;

export function useDiscover() {
  const { profile, isProfileReady } = useProfile();
  const geo = useGeolocation();
  const [query, setQuery] = useState("");
  const profileId = isProfileReady ? profile?.id ?? null : null;

  const [cachedUsers, setCachedUsers] = useState<VeloraProfile[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("velora_cached_discovered_users");
        return stored ? JSON.parse(stored) : [];
      } catch (e) {
        logger.error("[useDiscover] Failed to parse cached discovered users:", e);
      }
    }
    return [];
  });

  const { data, loading } = useFirestoreListener<VeloraProfile[]>(
    profileId ? `discover:${profileId}:${DISCOVER_PAGE_SIZE}` : null,
    profileId
      ? (onNext, onError) =>
          onDiscoverUsersChange(
            profileId,
            DISCOVER_PAGE_SIZE,
            (users) => {
              if (typeof window !== "undefined") {
                localStorage.setItem("velora_cached_discovered_users", JSON.stringify(users));
              }
              setCachedUsers(users);
              onNext(users);
            },
            onError
          )
      : null,
    EMPTY_USERS
  );

  const discoveredUsers = profileId ? (data !== undefined ? data : cachedUsers) : [];

  const { nearbyUsers, globalUsers } = useMemo(() => {
    if (!profile) return { nearbyUsers: EMPTY_USERS, globalUsers: EMPTY_USERS };

    const myCoarse = profile.location_geo_coarse;
    const isSharing = profile.locationSharing && !profile.ghostMode;
    const nearby: VeloraProfile[] = [];
    const global: VeloraProfile[] = [];

    discoveredUsers.forEach((candidate) => {
      if (candidate.id === profile.id || candidate.ghostMode === true || candidate.isVisible === false) {
        return;
      }

      if (!isSharing || !myCoarse || !candidate.location_geo_coarse) {
        global.push(candidate);
        return;
      }

      const distance = calculateHaversineDistance(
        myCoarse.lat,
        myCoarse.lng,
        candidate.location_geo_coarse.lat,
        candidate.location_geo_coarse.lng
      );

      if (distance < 2000) {
        nearby.push({
          ...candidate,
          proximityZone: distance < 100 ? "close" : distance > 500 ? "far" : "medium",
        });
      } else {
        global.push(candidate);
      }
    });

    const sortByPriority = (a: VeloraProfile, b: VeloraProfile) => {
      const aMode = a.professionalMode === profile.professionalMode ? 1 : 0;
      const bMode = b.professionalMode === profile.professionalMode ? 1 : 0;
      if (aMode !== bMode) return bMode - aMode;

      const aOverlap = a.skills?.filter((skill) => profile.skills?.includes(skill)).length || 0;
      const bOverlap = b.skills?.filter((skill) => profile.skills?.includes(skill)).length || 0;
      return bOverlap - aOverlap;
    };

    nearby.sort(sortByPriority);
    global.sort(sortByPriority);

    return { nearbyUsers: nearby, globalUsers: global };
  }, [discoveredUsers, profile]);

  const normalizedQuery = query.toLowerCase().trim();
  const filteredNearby = useMemo(() => {
    if (!normalizedQuery) return nearbyUsers;
    return nearbyUsers.filter((candidate) => {
      const name = candidate.fullName || "";
      const title = candidate.title || "";
      return name.toLowerCase().includes(normalizedQuery) || title.toLowerCase().includes(normalizedQuery);
    });
  }, [nearbyUsers, normalizedQuery]);

  const filteredGlobal = useMemo(() => {
    if (!normalizedQuery) return globalUsers;
    return globalUsers.filter((candidate) => {
      const name = candidate.fullName || "";
      const title = candidate.title || "";
      return name.toLowerCase().includes(normalizedQuery) || title.toLowerCase().includes(normalizedQuery);
    });
  }, [globalUsers, normalizedQuery]);

  return {
    profile,
    isProfileReady,
    geo,
    query,
    setQuery,
    nearbyUsers: filteredNearby,
    globalUsers: filteredGlobal,
    loadingDiscover: Boolean(profileId && loading),
    rawNearbyUsers: nearbyUsers,
  };
}
