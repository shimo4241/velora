"use client";

import { useState, useEffect, useMemo } from "react";
import { subscribeToEvents } from "@/lib/firestore";
import { VeloraEvent, AgendaFilter, EventCategory } from "@/types";
import { calculateHaversineDistance } from "@/lib/geolocation";
import { useProfile } from "@/hooks/useProfile";

export function useEvents(
  activeFilter: AgendaFilter,
  selectedCategory: EventCategory | null,
  selectedCity: string | null = null
) {
  const { profile } = useProfile();
  const [events, setEvents] = useState<VeloraEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Request browser geolocation for local distance calculations
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (err) => {
        console.warn("[useEvents] Local geolocation query failed:", err.message);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  // Subscribe to raw approved events from Firestore
  useEffect(() => {
    const unsubscribe = subscribeToEvents(
      null, // Fetch all approved events and filter client-side
      (fetchedEvents) => {
        setEvents(fetchedEvents);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Process, filter and sort events
  const processedEvents = useMemo(() => {
    let result = [...events];

    // 1. City Filter
    if (selectedCity && selectedCity !== "All" && selectedCity !== "Tout" && selectedCity !== "الكل") {
      result = result.filter(
        (e) => e.city.toLowerCase() === selectedCity.toLowerCase()
      );
    }

    // 2. Category Filter
    if (selectedCategory) {
      result = result.filter((e) => e.category === selectedCategory);
    }

    // 3. Compute distance for all events if coordinates available
    result = result.map((event) => {
      if (userCoords && event.lat !== undefined && event.lng !== undefined) {
        const distanceM = calculateHaversineDistance(
          userCoords.lat,
          userCoords.lng,
          event.lat,
          event.lng
        );
        return { ...event, distance: distanceM };
      }
      return event;
    });

    // 4. Apply Time/Status Filters
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
    const endOfWeek = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + 7, 23, 59, 59, 999);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    if (activeFilter === "today") {
      result = result.filter((e) => {
        const start = new Date(e.date);
        const end = e.endDate ? new Date(e.endDate) : start;
        return start <= endOfToday && end >= startOfToday;
      });
    } else if (activeFilter === "this-week") {
      result = result.filter((e) => {
        const start = new Date(e.date);
        const end = e.endDate ? new Date(e.endDate) : start;
        return start <= endOfWeek && end >= startOfWeek;
      });
    } else if (activeFilter === "this-month") {
      result = result.filter((e) => {
        const start = new Date(e.date);
        const end = e.endDate ? new Date(e.endDate) : start;
        return start <= endOfMonth && end >= startOfMonth;
      });
    } else if (activeFilter === "nearby") {
      // Sort by distance ascending, filtering out those without computed distance
      result = result.filter((e) => e.distance !== undefined);
      result.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    } else if (activeFilter === "trending") {
      // Sort by interestedCount desc
      result.sort((a, b) => (b.interestedCount || 0) - (a.interestedCount || 0));
    }

    // 5. Smart Discovery: Prioritize user's professional mode matches
    // Only apply prioritization if we are not actively sorting by nearby or trending
    if (profile?.professionalMode && activeFilter !== "nearby" && activeFilter !== "trending") {
      const mode = profile.professionalMode;

      const isMatch = (event: VeloraEvent) => {
        const cat = event.category;
        if (mode === "dentist" && cat === "medical-dental") return true;
        if (
          (mode === "entrepreneur" || mode === "business" || mode === "corporate" || mode === "luxury") &&
          (cat === "startup" || cat === "business-summit" || cat === "networking" || cat === "tech-conference")
        )
          return true;
        if ((mode === "nightlife" || mode === "vip") && (cat === "nightlife-vip" || cat === "concert")) return true;
        if (
          (mode === "creative" || mode === "artist" || mode === "creator") &&
          (cat === "art-fashion" || cat === "festival" || cat === "exposition")
        )
          return true;
        return false;
      };

      result.sort((a, b) => {
        const matchA = isMatch(a) ? 1 : 0;
        const matchB = isMatch(b) ? 1 : 0;
        return matchB - matchA; // Put matching events at the top
      });
    }

    return result;
  }, [events, activeFilter, selectedCategory, selectedCity, userCoords, profile]);

  return {
    events: processedEvents,
    loading,
    error,
    userCoords,
  };
}
