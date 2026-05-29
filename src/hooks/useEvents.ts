"use client";

import { useEffect, useMemo, useState } from "react";
import { logger } from "@/lib/logger";
import { subscribeToEvents } from "@/services";
import { useFirestoreListener } from "@/hooks/useFirestoreListener";
import type { AgendaFilter, EventCategory, VeloraEvent } from "@/types";
import { calculateHaversineDistance } from "@/utils/geolocation";
import { useProfile } from "@/hooks/useProfile";

const EMPTY_EVENTS: VeloraEvent[] = [];

export function useEvents(
  activeFilter: AgendaFilter,
  selectedCategory: EventCategory | null,
  selectedCity: string | null = null
) {
  const { profile } = useProfile();
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [events, setEvents] = useState<VeloraEvent[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("velora_cached_events");
        return stored ? JSON.parse(stored) : [];
      } catch (e) {
        logger.error("[useEvents] Failed to parse cached events:", e);
      }
    }
    return [];
  });
  const [loading, setLoading] = useState(() => {
    if (typeof window !== "undefined") {
      return !localStorage.getItem("velora_cached_events");
    }
    return true;
  });
  const [error, setError] = useState<Error | null>(null);
  const professionalMode = profile?.professionalMode ?? null;

  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeToEvents(
      null,
      (fetchedEvents) => {
        if (!active) return;
        setEvents(fetchedEvents);
        if (typeof window !== "undefined") {
          localStorage.setItem("velora_cached_events", JSON.stringify(fetchedEvents));
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        if (!active) return;
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    let active = true;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!active) return;
        setUserCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (geoError) => {
        logger.warn("[useEvents] Local geolocation query failed:", geoError.message);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );

    return () => {
      active = false;
    };
  }, []);

  const processedEvents = useMemo(() => {
    let result = events;

    if (selectedCity && selectedCity !== "All" && selectedCity !== "Tout" && selectedCity !== "Ø§Ù„ÙƒÙ„") {
      result = result.filter(
        (event) => event.city.toLowerCase() === selectedCity.toLowerCase()
      );
    }

    if (selectedCategory) {
      result = result.filter((event) => event.category === selectedCategory);
    }

    if (userCoords) {
      result = result.map((event) => ({
        ...event,
        distance: calculateHaversineDistance(userCoords.lat, userCoords.lng, event.lat, event.lng),
      }));
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
    const endOfWeek = new Date(
      startOfWeek.getFullYear(),
      startOfWeek.getMonth(),
      startOfWeek.getDate() + 7,
      23,
      59,
      59,
      999
    );
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    if (activeFilter === "today") {
      result = result.filter((event) => {
        const start = new Date(event.date);
        const end = event.endDate ? new Date(event.endDate) : start;
        return start <= endOfToday && end >= startOfToday;
      });
    } else if (activeFilter === "this-week") {
      result = result.filter((event) => {
        const start = new Date(event.date);
        const end = event.endDate ? new Date(event.endDate) : start;
        return start <= endOfWeek && end >= startOfWeek;
      });
    } else if (activeFilter === "this-month") {
      result = result.filter((event) => {
        const start = new Date(event.date);
        const end = event.endDate ? new Date(event.endDate) : start;
        return start <= endOfMonth && end >= startOfMonth;
      });
    } else if (activeFilter === "nearby") {
      result = result
        .filter((event) => event.distance !== undefined)
        .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    } else if (activeFilter === "trending") {
      result = [...result].sort((a, b) => (b.interestedCount || 0) - (a.interestedCount || 0));
    }

    if (professionalMode && activeFilter !== "nearby" && activeFilter !== "trending") {
      const isMatch = (event: VeloraEvent) => {
        const category = event.category;
        if (professionalMode === "dentist" && category === "medical-dental") return true;
        if (
          (professionalMode === "entrepreneur" ||
            professionalMode === "business" ||
            professionalMode === "corporate" ||
            professionalMode === "luxury") &&
          (category === "startup" ||
            category === "business-summit" ||
            category === "networking" ||
            category === "tech-conference")
        ) {
          return true;
        }
        if (
          (professionalMode === "nightlife" || professionalMode === "vip") &&
          (category === "nightlife-vip" || category === "concert")
        ) {
          return true;
        }
        return (
          (professionalMode === "creative" ||
            professionalMode === "artist" ||
            professionalMode === "creator") &&
          (category === "art-fashion" || category === "festival" || category === "exposition")
        );
      };

      result = [...result].sort((a, b) => Number(isMatch(b)) - Number(isMatch(a)));
    }

    return result;
  }, [activeFilter, events, professionalMode, selectedCategory, selectedCity, userCoords]);

  return {
    events: processedEvents,
    loading,
    error,
    userCoords,
  };
}
