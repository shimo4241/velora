import { logger } from "@/lib/logger";
import {
  doc,
  collection,
  query,
  where,
  orderBy,
  runTransaction,
  type DocumentData,
  type Unsubscribe,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  VeloraProfile,
  VeloraEvent,
  EventAttendee,
  EventCategory,
  EventStatus,
  ProfessionalMode,
} from "@/types";
import { asString, asBoolean, asArray, asNumber, dateValueToIso } from "@/utils/firestore";


export function normalizeVeloraEvent(id: string, data: DocumentData): VeloraEvent {
  return {
    id,
    title: asString(data.title),
    description: asString(data.description),
    category: (data.category || "networking") as EventCategory,
    imageUrl: asString(data.imageUrl),
    galleryUrls: asArray<string>(data.galleryUrls),
    date: asString(data.date),
    endDate: data.endDate ? asString(data.endDate) : undefined,
    city: asString(data.city),
    venue: asString(data.venue),
    lat: asNumber(data.lat) ?? 0,
    lng: asNumber(data.lng) ?? 0,
    organizer: asString(data.organizer),
    organizerAvatarUrl: data.organizerAvatarUrl ? asString(data.organizerAvatarUrl) : undefined,
    speakers: asArray<Record<string, unknown>>(data.speakers).map(s => ({
      name: asString(s?.name),
      title: asString(s?.title),
      avatarUrl: s?.avatarUrl ? asString(s.avatarUrl) : undefined
    })),
    status: (data.status || "upcoming") as EventStatus,
    capacity: data.capacity ? asNumber(data.capacity) : undefined,
    attendeesCount: asNumber(data.attendeesCount) ?? 0,
    interestedCount: asNumber(data.interestedCount) ?? 0,
    isFeatured: asBoolean(data.isFeatured),
    isSponsored: asBoolean(data.isSponsored),
    tags: asArray<string>(data.tags),
    ticketUrl: data.ticketUrl ? asString(data.ticketUrl) : undefined,
    price: data.price ? asString(data.price) : undefined,
    mapsUrl: data.mapsUrl ? asString(data.mapsUrl) : undefined,
    createdAt: data.createdAt ? dateValueToIso(data.createdAt) : "",
    updatedAt: data.updatedAt ? dateValueToIso(data.updatedAt) : "",
    isApproved: asBoolean(data.isApproved),
    moderationNote: data.moderationNote ? asString(data.moderationNote) : undefined,
  };
}

export function normalizeEventAttendee(id: string, data: DocumentData): EventAttendee {
  return {
    id,
    eventId: asString(data.eventId),
    userId: asString(data.userId),
    userName: asString(data.userName),
    userAvatarUrl: asString(data.userAvatarUrl),
    userTitle: asString(data.userTitle),
    professionalMode: (data.professionalMode || "entrepreneur") as ProfessionalMode,
    status: (data.status || "interested") as "going" | "interested",
    checkedIn: asBoolean(data.checkedIn),
    checkedInAt: data.checkedInAt ? asString(data.checkedInAt) : undefined,
    createdAt: data.createdAt ? dateValueToIso(data.createdAt) : "",
    userUsername: data.userUsername ? asString(data.userUsername) : undefined,
  };
}

export function subscribeToEvents(
  category: string | null,
  callback: (events: VeloraEvent[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  let q = query(
    collection(db, "events"),
    where("isApproved", "==", true),
    orderBy("date", "asc")
  );

  if (category) {
    q = query(
      collection(db, "events"),
      where("isApproved", "==", true),
      where("category", "==", category),
      orderBy("date", "asc")
    );
  }

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((doc) => normalizeVeloraEvent(doc.id, doc.data()));
      callback(list);
    },
    (err) => {
      logger.error("[Firestore Error] Failed subscribing to events", err);
      onError?.(err);
    }
  );
}

export function subscribeToEvent(
  eventId: string,
  callback: (event: VeloraEvent | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const docRef = doc(db, "events", eventId);
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        callback(normalizeVeloraEvent(snap.id, snap.data()));
      } else {
        callback(null);
      }
    },
    (err) => {
      logger.error(`[Firestore Error] Failed subscribing to event ${eventId}`, err);
      onError?.(err);
    }
  );
}

export function subscribeToEventAttendees(
  eventId: string,
  callback: (attendees: EventAttendee[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, "event_attendees"),
    where("eventId", "==", eventId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((doc) => normalizeEventAttendee(doc.id, doc.data()));
      callback(list);
    },
    (err) => {
      logger.error(`[Firestore Error] Failed subscribing to attendees for event ${eventId}`, err);
      onError?.(err);
    }
  );
}

export async function toggleEventInterest(
  eventId: string,
  userId: string,
  profile: VeloraProfile,
  isInterested: boolean
): Promise<void> {
  if (!eventId || !userId || !profile) return;
  const attendeeId = `${eventId}_${userId}`;
  const attendeeRef = doc(db, "event_attendees", attendeeId);
  const eventRef = doc(db, "events", eventId);

  await runTransaction(db, async (transaction) => {
    const attendeeSnap = await transaction.get(attendeeRef);
    const eventSnap = await transaction.get(eventRef);

    if (!eventSnap.exists()) {
      throw new Error("Event does not exist");
    }

    const wasInterested = attendeeSnap.exists();
    if (isInterested && !wasInterested) {
      transaction.set(attendeeRef, {
        id: attendeeId,
        eventId,
        userId,
        userName: profile.fullName,
        userAvatarUrl: profile.avatarUrl || "",
        userTitle: profile.title || "",
        professionalMode: profile.professionalMode || "entrepreneur",
        status: "interested",
        checkedIn: false,
        createdAt: new Date().toISOString(),
        userUsername: profile.username || "",
      });
      transaction.update(eventRef, {
        interestedCount: (eventSnap.data().interestedCount || 0) + 1,
      });
    } else if (!isInterested && wasInterested) {
      transaction.delete(attendeeRef);
      transaction.update(eventRef, {
        interestedCount: Math.max(0, (eventSnap.data().interestedCount || 1) - 1),
      });
    }
  });
}

export async function checkInToEvent(
  eventId: string,
  userId: string,
  profile: VeloraProfile,
  method: "qr" | "nfc" | "manual"
): Promise<void> {
  if (!eventId || !userId || !profile) return;
  const attendeeId = `${eventId}_${userId}`;
  const attendeeRef = doc(db, "event_attendees", attendeeId);
  const eventRef = doc(db, "events", eventId);
  const checkinId = `${eventId}_${userId}_checkin`;
  const checkinRef = doc(db, "event_checkins", checkinId);

  await runTransaction(db, async (transaction) => {
    const attendeeSnap = await transaction.get(attendeeRef);
    const eventSnap = await transaction.get(eventRef);
    const checkinSnap = await transaction.get(checkinRef);

    if (!eventSnap.exists()) {
      throw new Error("Event does not exist");
    }
    if (checkinSnap.exists()) {
      return;
    }

    const isoString = new Date().toISOString();

    transaction.set(checkinRef, {
      id: checkinId,
      eventId,
      userId,
      method,
      timestamp: isoString,
    });

    if (attendeeSnap.exists()) {
      transaction.update(attendeeRef, {
        checkedIn: true,
        checkedInAt: isoString,
        status: "going",
        userUsername: profile.username || "",
      });
    } else {
      transaction.set(attendeeRef, {
        id: attendeeId,
        eventId,
        userId,
        userName: profile.fullName,
        userAvatarUrl: profile.avatarUrl || "",
        userTitle: profile.title || "",
        professionalMode: profile.professionalMode || "entrepreneur",
        status: "going",
        checkedIn: true,
        checkedInAt: isoString,
        createdAt: isoString,
        userUsername: profile.username || "",
      });
    }

    const eventData = eventSnap.data();
    const currentAttendees = eventData.attendeesCount || 0;
    const currentInterested = eventData.interestedCount || 0;
    
    const updates: { attendeesCount: number; interestedCount?: number } = {
      attendeesCount: currentAttendees + 1,
    };

    if (!attendeeSnap.exists()) {
      updates.interestedCount = currentInterested + 1;
    }

    transaction.update(eventRef, updates);
  });
}

export function subscribeToAttendeeStatus(
  eventId: string,
  userId: string,
  callback: (attendee: EventAttendee | null) => void
): Unsubscribe {
  const docRef = doc(db, "event_attendees", `${eventId}_${userId}`);
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        callback(normalizeEventAttendee(snap.id, snap.data()));
      } else {
        callback(null);
      }
    },
    (error) => {
      logger.error(`[Firestore Error] subscribeToAttendeeStatus failed for eventId=${eventId} userId=${userId}`, error);
    }
  );
}
