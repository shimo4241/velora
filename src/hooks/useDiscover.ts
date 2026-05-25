"use client";
import { logger } from "@/lib/logger";
import { useState, useEffect, useMemo } from "react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useProfile } from "@/hooks/useProfile";
import { onDiscoverUsersChange } from "@/services";
import { calculateHaversineDistance } from "@/utils/geolocation";
import type { VeloraProfile } from "@/types";

/* ═══════════════════════════════════════════════════
   VELORA — useDiscover Hook
   Extracts live discovery query, filtering, mapping,
   sorting, and geolocation computations from UI views.
   ═══════════════════════════════════════════════════ */

export function useDiscover() {
  const { profile, isProfileReady } = useProfile();
  const geo = useGeolocation();
  const [query, setQuery] = useState("");
  const [discoveredUsers, setDiscoveredUsers] = useState<VeloraProfile[]>([]);
  const [loadingDiscover, setLoadingDiscover] = useState(true);

  useEffect(() => {
    if (!isProfileReady || !profile?.id) return;
    
    let active = true;
    logger.info(`[useDiscover] Subscribing discovery candidates for profileId=${profile.id}`);
    const unsub = onDiscoverUsersChange(
      profile.id,
      100, // Fetch more candidates so we have enough for both local and global networks
      (users: VeloraProfile[]) => {
        if (!active) return;
        setDiscoveredUsers(users);
        setLoadingDiscover(false);
      },
      (err: unknown) => {
        if (!active) return;
        logger.error("[useDiscover:onDiscoverUsersChange] failed:", err);
        setLoadingDiscover(false);
      }
    );
    return () => {
      active = false;
      logger.info(`[useDiscover] Unsubscribing discovery candidates for profileId=${profile.id}`);
      unsub();
    };
  }, [profile?.id, isProfileReady]);

  // Split discovered users into Nearby and Global suggestions
  const { nearbyUsers, globalUsers } = useMemo(() => {
    if (!profile) return { nearbyUsers: [], globalUsers: [] };
    
    const myCoarse = profile.location_geo_coarse;
    const isSharing = profile.locationSharing && !profile.ghostMode;

    const nearby: VeloraProfile[] = [];
    const global: VeloraProfile[] = [];

    discoveredUsers.forEach((u) => {
      // Security: Exclude self, ghosts, and invisible users
      if (u.id === profile.id || u.ghostMode === true || u.isVisible === false) {
        return;
      }

      if (!isSharing || !myCoarse || !u.location_geo_coarse) {
        global.push(u);
        return;
      }

      const dist = calculateHaversineDistance(
        myCoarse.lat,
        myCoarse.lng,
        u.location_geo_coarse.lat,
        u.location_geo_coarse.lng
      );

      // Truly local discovery threshold (2 km)
      if (dist < 2000) {
        let proximity: "close" | "medium" | "far" = "medium";
        if (dist < 100) proximity = "close";
        else if (dist > 500) proximity = "far";

        nearby.push({
          ...u,
          proximityZone: proximity,
        });
      } else {
        global.push(u);
      }
    });

    // Sort by compatibility priorities (Professional Mode alignment, then shared skills/interests)
    const sortByPriority = (a: VeloraProfile, b: VeloraProfile) => {
      const aMode = a.professionalMode === profile.professionalMode ? 1 : 0;
      const bMode = b.professionalMode === profile.professionalMode ? 1 : 0;
      if (aMode !== bMode) return bMode - aMode;

      const aOverlap = a.skills?.filter(s => profile.skills?.includes(s)).length || 0;
      const bOverlap = b.skills?.filter(s => profile.skills?.includes(s)).length || 0;
      if (aOverlap !== bOverlap) return bOverlap - aOverlap;

      return 0;
    };

    nearby.sort(sortByPriority);
    global.sort(sortByPriority);

    return { nearbyUsers: nearby, globalUsers: global };
  }, [discoveredUsers, profile]);

  // Filter lists based on search query
  const filteredNearby = useMemo(() => {
    return nearbyUsers.filter((u) => {
      const search = query.toLowerCase().trim();
      if (!search) return true;
      const name = u.fullName || "";
      const title = u.title || "";
      return name.toLowerCase().includes(search) || title.toLowerCase().includes(search);
    });
  }, [nearbyUsers, query]);

  const filteredGlobal = useMemo(() => {
    return globalUsers.filter((u) => {
      const search = query.toLowerCase().trim();
      if (!search) return true;
      const name = u.fullName || "";
      const title = u.title || "";
      return name.toLowerCase().includes(search) || title.toLowerCase().includes(search);
    });
  }, [globalUsers, query]);

  return {
    profile,
    isProfileReady,
    geo,
    query,
    setQuery,
    nearbyUsers: filteredNearby,
    globalUsers: filteredGlobal,
    loadingDiscover,
    rawNearbyUsers: nearbyUsers, // In case raw proximity visualization or carousel needs unmodified list
  };
}
