"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { logger } from "@/lib/logger";
import { useAuth } from "@/providers/AuthProvider";
import { useProfile } from "@/hooks/useProfile";
import { useFirestoreListener } from "@/hooks/useFirestoreListener";
import {
  checkInToEvent,
  getNetworkingSuggestions,
  subscribeToEvent,
  subscribeToEventAttendees,
  toggleEventInterest,
} from "@/services";
import type { EventAttendee, VeloraEvent, VeloraProfile } from "@/types";

const EMPTY_ATTENDEES: EventAttendee[] = [];
const EMPTY_SUGGESTIONS: VeloraProfile[] = [];

export function useEventDetail(eventId: string) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const uid = user?.uid ?? null;
  const [suggestionsState, setSuggestionsState] = useState<{
    key: string;
    suggestions: VeloraProfile[];
  }>({ key: "", suggestions: EMPTY_SUGGESTIONS });
  const [actionLoading, setActionLoading] = useState(false);

  const eventSnapshot = useFirestoreListener<VeloraEvent | null>(
    eventId ? `event:${eventId}` : null,
    eventId ? (onNext, onError) => subscribeToEvent(eventId, onNext, onError) : null,
    null
  );
  const attendeesSnapshot = useFirestoreListener<EventAttendee[]>(
    eventId ? `event:${eventId}:attendees` : null,
    eventId ? (onNext, onError) => subscribeToEventAttendees(eventId, onNext, onError) : null,
    EMPTY_ATTENDEES
  );
  const attendees = attendeesSnapshot.data ?? EMPTY_ATTENDEES;
  const userAttendee = useMemo(
    () => (uid ? attendees.find((attendee) => attendee.userId === uid) ?? null : null),
    [attendees, uid]
  );
  const suggestionRequestKey = uid && profile?.professionalMode
    ? `${uid}:${profile.professionalMode}:${eventId}`
    : "";

  useEffect(() => {
    if (!uid || !profile?.professionalMode) {
      return;
    }

    let active = true;
    const currentUid = uid;
    const professionalMode = profile.professionalMode;

    async function fetchSuggestions() {
      try {
        const suggestions = await getNetworkingSuggestions(currentUid, professionalMode, 5);
        if (active) {
          setSuggestionsState({ key: suggestionRequestKey, suggestions });
        }
      } catch (err) {
        if (!active) return;
        logger.error("[useEventDetail] Error fetching networking suggestions:", err);
        setSuggestionsState({ key: suggestionRequestKey, suggestions: EMPTY_SUGGESTIONS });
      }
    }

    void fetchSuggestions();
    return () => {
      active = false;
    };
  }, [eventId, profile?.professionalMode, suggestionRequestKey, uid]);

  const handleToggleInterest = useCallback(async () => {
    if (!user || !profile || !eventId) return;
    setActionLoading(true);
    try {
      await toggleEventInterest(eventId, user.uid, profile, !userAttendee);
    } catch (err) {
      logger.error("[useEventDetail] Failed to toggle interest:", err);
    } finally {
      setActionLoading(false);
    }
  }, [eventId, profile, user, userAttendee]);

  const handleCheckIn = useCallback(
    async (method: "qr" | "nfc" | "manual") => {
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
    },
    [eventId, profile, user]
  );

  return {
    event: eventSnapshot.data ?? null,
    attendees,
    networkingSuggestions: suggestionRequestKey && suggestionRequestKey === suggestionsState.key
      ? suggestionsState.suggestions
      : EMPTY_SUGGESTIONS,
    loading: eventSnapshot.loading,
    error: eventSnapshot.error,
    isInterested: Boolean(userAttendee),
    isCheckedIn: Boolean(userAttendee?.checkedIn),
    actionLoading,
    toggleInterest: handleToggleInterest,
    checkIn: handleCheckIn,
  };
}
