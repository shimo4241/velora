"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useProfile } from "@/hooks/useProfile";
import {
  subscribeToEvent,
  subscribeToEventAttendees,
  toggleEventInterest,
  checkInToEvent,
  getNetworkingSuggestions,
} from "@/lib/firestore";
import { VeloraEvent, EventAttendee, VeloraProfile } from "@/types";

export function useEventDetail(eventId: string) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [event, setEvent] = useState<VeloraEvent | null>(null);
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [networkingSuggestions, setNetworkingSuggestions] = useState<VeloraProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isInterested, setIsInterested] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [prevEventId, setPrevEventId] = useState<string | null>(null);

  if (eventId !== prevEventId) {
    setPrevEventId(eventId);
    setEvent(null);
    setAttendees([]);
    setNetworkingSuggestions([]);
    setLoading(true);
    setError(null);
    setIsInterested(false);
    setIsCheckedIn(false);
  }

  // Subscribe to single event details
  useEffect(() => {
    if (!eventId) return;

    const unsubscribe = subscribeToEvent(
      eventId,
      (fetchedEvent) => {
        setEvent(fetchedEvent);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [eventId]);

  // Subscribe to event attendees list
  useEffect(() => {
    if (!eventId) return;

    const unsubscribe = subscribeToEventAttendees(
      eventId,
      (fetchedAttendees) => {
        setAttendees(fetchedAttendees);

        // Update isInterested and isCheckedIn status based on attendees list
        if (user) {
          const userAttendee = fetchedAttendees.find((a) => a.userId === user.uid);
          setIsInterested(!!userAttendee);
          setIsCheckedIn(!!userAttendee?.checkedIn);
        }
      },
      (err) => {
        console.error(`[useEventDetail] Failed to subscribe to attendees for ${eventId}`, err);
      }
    );

    return () => unsubscribe();
  }, [eventId, user]);

  // Fetch networking suggestions based on user professional mode
  useEffect(() => {
    if (!user || !profile?.professionalMode) {
      return;
    }

    let active = true;
    const fetchSuggestions = async () => {
      try {
        const suggestions = await getNetworkingSuggestions(
          user.uid,
          profile.professionalMode,
          5
        );
        if (active) {
          setNetworkingSuggestions(suggestions);
        }
      } catch (err) {
        console.error("[useEventDetail] Error fetching networking suggestions:", err);
      }
    };

    fetchSuggestions();
    return () => {
      active = false;
    };
  }, [user, profile?.professionalMode, eventId]);

  // Action handlers
  const handleToggleInterest = async () => {
    if (!user || !profile || !eventId) return;
    setActionLoading(true);
    try {
      await toggleEventInterest(eventId, user.uid, profile, !isInterested);
    } catch (err) {
      console.error("[useEventDetail] Failed to toggle interest:", err);
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
      console.error("[useEventDetail] Failed to check in:", err);
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  return {
    event,
    attendees,
    networkingSuggestions: (user && profile?.professionalMode) ? networkingSuggestions : [],
    loading,
    error,
    isInterested,
    isCheckedIn,
    actionLoading,
    toggleInterest: handleToggleInterest,
    checkIn: handleCheckIn,
  };
}
