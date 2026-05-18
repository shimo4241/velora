/* ═══════════════════════════════════════════════════
   VELORA — Firestore Service Layer
   Typed CRUD operations for all collections
   ═══════════════════════════════════════════════════ */

import {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  type DocumentData,
  type Unsubscribe,
  Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase";
import type {
  VeloraProfile,
  PortfolioItem,
  ExperienceEntry,
  VeloraConnection,
  ConnectionMethod,
  DailyStats,
  ActivityItem,
} from "@/types";

/* ═══════════════════════════════════════════
   PROFILES
   ═══════════════════════════════════════════ */

/** Get user profile by UID */
export async function getProfile(uid: string): Promise<VeloraProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as VeloraProfile;
}

/** Get user profile by username */
export async function getProfileByUsername(username: string): Promise<VeloraProfile | null> {
  const q = query(collection(db, "users"), where("username", "==", username), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as VeloraProfile;
}

/** Real-time profile listener */
export function onProfileChange(
  uid: string,
  callback: (profile: VeloraProfile | null) => void
): Unsubscribe {
  return onSnapshot(doc(db, "users", uid), (snap) => {
    if (!snap.exists()) return callback(null);
    callback({ id: snap.id, ...snap.data() } as VeloraProfile);
  });
}

/** Update profile fields */
export async function updateProfile(
  uid: string,
  data: Partial<Omit<VeloraProfile, "id">>
): Promise<void> {
  await updateDoc(doc(db, "users", uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/** Upload avatar to Storage and update profile */
export async function uploadAvatar(uid: string, file: File): Promise<string> {
  const storageRef = ref(storage, `avatars/${uid}/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  await updateProfile(uid, { avatarUrl: url });
  return url;
}

/** Upload portfolio image */
export async function uploadPortfolioImage(uid: string, file: File): Promise<string> {
  const storageRef = ref(storage, `portfolio/${uid}/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

/* ═══════════════════════════════════════════
   PORTFOLIO (subcollection)
   ═══════════════════════════════════════════ */

export async function getPortfolio(uid: string): Promise<PortfolioItem[]> {
  const q = query(collection(db, "users", uid, "portfolio"), orderBy("order", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PortfolioItem);
}

export function onPortfolioChange(
  uid: string,
  callback: (items: PortfolioItem[]) => void
): Unsubscribe {
  const q = query(collection(db, "users", uid, "portfolio"), orderBy("order", "asc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PortfolioItem));
  });
}

export async function addPortfolioItem(uid: string, item: Omit<PortfolioItem, "id">): Promise<string> {
  const docRef = await addDoc(collection(db, "users", uid, "portfolio"), {
    ...item,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function deletePortfolioItem(uid: string, itemId: string): Promise<void> {
  await deleteDoc(doc(db, "users", uid, "portfolio", itemId));
}

/* ═══════════════════════════════════════════
   EXPERIENCE (subcollection)
   ═══════════════════════════════════════════ */

export async function getExperience(uid: string): Promise<ExperienceEntry[]> {
  const q = query(collection(db, "users", uid, "experience"), orderBy("startYear", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ExperienceEntry);
}

export function onExperienceChange(
  uid: string,
  callback: (entries: ExperienceEntry[]) => void
): Unsubscribe {
  const q = query(collection(db, "users", uid, "experience"), orderBy("startYear", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ExperienceEntry));
  });
}

/* ═══════════════════════════════════════════
   CONNECTIONS (Scan Memory)
   ═══════════════════════════════════════════ */

export function onConnectionsChange(
  uid: string,
  callback: (connections: VeloraConnection[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "connections"),
    where("userId", "==", uid),
    orderBy("metAt", "desc"),
    limit(50)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as unknown as VeloraConnection));
  });
}

export async function createConnection(data: {
  userId: string;
  connectedUserId: string;
  connectedProfile: Partial<VeloraProfile>;
  method: ConnectionMethod;
  contextLabel?: string;
  locationName?: string;
  introducedBy?: string;
  personalNote?: string;
}): Promise<string> {
  const docRef = await addDoc(collection(db, "connections"), {
    ...data,
    followUpSent: false,
    metAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateConnectionFollowUp(
  connectionId: string,
  followUpSent: boolean
): Promise<void> {
  await updateDoc(doc(db, "connections", connectionId), { followUpSent });
}

export async function updateConnectionNote(
  connectionId: string,
  personalNote: string
): Promise<void> {
  await updateDoc(doc(db, "connections", connectionId), { personalNote });
}

/* ═══════════════════════════════════════════
   SHARES
   ═══════════════════════════════════════════ */

export async function logShare(data: {
  userId: string;
  method: ConnectionMethod;
  recipientInfo?: string;
}): Promise<void> {
  await addDoc(collection(db, "shares"), {
    ...data,
    timestamp: serverTimestamp(),
  });
}

/* ═══════════════════════════════════════════
   ANALYTICS EVENTS
   ═══════════════════════════════════════════ */

export async function trackAnalyticsEvent(data: {
  userId: string;
  event: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await addDoc(collection(db, "analytics_events"), {
    ...data,
    timestamp: serverTimestamp(),
  });
}

/** Get aggregated stats for today */
export async function getDailyStats(uid: string): Promise<DailyStats> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = Timestamp.fromDate(today);

  const q = query(
    collection(db, "analytics_events"),
    where("userId", "==", uid),
    where("timestamp", ">=", todayTimestamp)
  );
  const snap = await getDocs(q);

  const stats: DailyStats = { views: 0, taps: 0, scans: 0, clicks: 0 };
  snap.docs.forEach((d) => {
    const data = d.data();
    switch (data.event) {
      case "profile_view": stats.views++; break;
      case "nfc_tap": stats.taps++; break;
      case "qr_scan": stats.scans++; break;
      case "link_click": stats.clicks++; break;
    }
  });
  return stats;
}

/** Get recent activity */
export async function getRecentActivity(uid: string, count = 10): Promise<ActivityItem[]> {
  const q = query(
    collection(db, "analytics_events"),
    where("userId", "==", uid),
    orderBy("timestamp", "desc"),
    limit(count)
  );
  const snap = await getDocs(q);

  return snap.docs.map((d) => {
    const data = d.data() as DocumentData;
    const eventMap: Record<string, { icon: string; type: ActivityItem["type"] }> = {
      profile_view: { icon: "eye", type: "view" },
      nfc_tap: { icon: "nfc", type: "nfc" },
      qr_scan: { icon: "qr", type: "qr" },
      whatsapp_share: { icon: "whatsapp", type: "whatsapp" },
      connection_created: { icon: "users", type: "connect" },
    };
    const mapped = eventMap[data.event] || { icon: "eye", type: "view" as const };
    const ts = data.timestamp?.toDate?.() || new Date();
    const diff = Math.floor((Date.now() - ts.getTime()) / 60000);
    const timeStr = diff < 60 ? `${diff}m` : diff < 1440 ? `${Math.floor(diff / 60)}h` : `${Math.floor(diff / 1440)}d`;

    return {
      id: d.id,
      text: data.metadata?.description || data.event,
      time: timeStr,
      icon: mapped.icon,
      type: mapped.type,
    };
  });
}
