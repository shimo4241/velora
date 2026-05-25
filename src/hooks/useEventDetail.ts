"use client";
import { logger } from "@/lib/logger";


import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useProfile } from "@/hooks/useProfile";
import {
  subscribeToEvent,
  subscribeToEventAttendees,
  toggleEventInterest,
  checkInToEvent,
  getNetworkingSuggestions,
} from "@/services";
import { VeloraEvent, EventAttendee, VeloraProfile } from "@/types";

export function useEventDetail(eventId: string) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const uid = user?.uid ?? null;
  const [event, setEvent] = useState<VeloraEvent | null>(null);
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [networkingSuggestions, setNetworkingSuggestions] = useState<VeloraProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isInterested, setIsInterested] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Reset state when eventId changes — done via useEffect, not mid-render
  const prevEventIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (eventId !== prevEventIdRef.current) {
      prevEventIdRef.current = eventId;
      setEvent(null);
      setAttendees([]);
      setNetworkingSuggestions([]);
      setLoading(true);
      setError(null);
      setIsInterested(false);
      setIsCheckedIn(false);
    }
  }, [eventId]);

  // Subscribe to single event details
  useEffect(() => {
    if (!eventId) return;
    let active = true;

    const unsubscribe = subscribeToEvent(
      eventId,
      (fetchedEvent) => {
        if (!active) return;
        setEvent(fetchedEvent);
        setLoading(false);
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
  }, [eventId]);

  // Subscribe to event attendees list — depend on uid, not user object
  useEffect(() => {
    if (!eventId) return;
    let active = true;

    const unsubscribe = subscribeToEventAttendees(
      eventId,
      (fetchedAttendees) => {
        if (!active) return;
        setAttendees(fetchedAttendees);

        // Update isInterested and isCheckedIn status based on attendees list
        if (uid) {
          const userAttendee = fetchedAttendees.find((a) => a.userId === uid);
          setIsInterested(!!userAttendee);
          setIsCheckedIn(!!userAttendee?.checkedIn);
        }
      },
      (err) => {
        if (!active) return;
        logger.error(`[useEventDetail] Failed to subscribe to attendees for ${eventId}`, err);
      }
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [eventId, uid]);

  // Fetch networking suggestions based on user professional mode
  useEffect(() => {
    if (!uid || !profile?.professionalMode) {
      return;
    }

    let active = true;
    const fetchSuggestions = async () => {
      try {
        const suggestions = await getNetworkingSuggestions(
          uid,
          profile.professionalMode,
          5
        );
        if (active) {
          setNetworkingSuggestions(suggestions);
        }
      } catch (err) {
        if (!active) return;
        logger.error("[useEventDetail] Error fetching networking suggestions:", err);
      }
    };

    fetchSuggestions();
    return () => {
      active = false;
    };
  }, [uid, profile?.professionalMode, eventId]);

  // Action handlers
  const handleToggleInterest = async () => {
    if (!user || !profile || !eventId) return;
    setActionLoading(true);
    try {
      await toggleEventInterest(eventId, user.uid, profile, !isInterested);
    } catch (err) {
      logger.error("[useEventDetail] Failed to toggle interest:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckIn = async (method: "qr" | "nfc" | "manual") => {
    if (!user || !profile || !eventId) return;
    setActionLoading(true);
    try {
      await checkInToEvent(eventId, user.uid, profile, method);
    } catch (err) {
      logger.error("[useEventDetail] Failed to check in:", err);
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  return {
    event,
    attendees,
    networkingSuggestions: (uid && profile?.professionalMode) ? networkingSuggestions : [],
    loading,
    error,
    isInterested,
    isCheckedIn,
    actionLoading,
    toggleInterest: handleToggleInterest,
    checkIn: handleCheckIn,
  };
}
