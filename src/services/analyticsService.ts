import { logger } from "@/lib/logger";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getProfile } from "./profileService";
import { sendPushNotification } from "@/lib/fcm";
import type { DailyStats, ActivityItem, ConnectionMethod } from "@/types";

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export async function logShare(data: {
  userId: string;
  method: ConnectionMethod;
  recipientInfo?: string;
}): Promise<void> {
  await addDoc(collection(db, "shares"), {
    ...data,
    timestamp: serverTimestamp(),
  });

  try {
    await updateDoc(doc(db, "users", data.userId), {
      hasShared: true,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    logger.error("Failed to update profile hasShared status:", err);
  }
}

export async function trackAnalyticsEvent(data: {
  userId: string;
  event: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await addDoc(collection(db, "analytics_events"), {
    ...data,
    timestamp: serverTimestamp(),
  });

  if (data.event === "profile_view" && data.metadata?.viewerId) {
    const viewerId = asString(data.metadata.viewerId);
    const vieweeId = data.userId;
    if (viewerId !== vieweeId) {
      try {
        const today = new Date();
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        
        const q = query(
          collection(db, "analytics_events"),
          where("userId", "==", vieweeId),
          where("event", "==", "profile_view"),
          where("metadata.viewerId", "==", viewerId),
          where("timestamp", ">=", Timestamp.fromDate(yesterday)),
          limit(1)
        );
        const snap = await getDocs(q);
        if (snap.empty) {
          const viewerProfile = await getProfile(viewerId);
          const viewerName = viewerProfile?.fullName || "Un professionnel";
          
          await sendPushNotification({
            toUid: vieweeId,
            title: "Nouvelle visite",
            body: `${viewerName} a visité votre profil.`,
            data: {
              type: "profile_view",
              viewerId,
            },
          });
        }
      } catch (err) {
        logger.error("Failed to trigger throttled push for profile view:", err);
      }
    }
  }
}

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

export async function getRecentActivity(uid: string, count = 10): Promise<ActivityItem[]> {
  const q = query(
    collection(db, "analytics_events"),
    where("userId", "==", uid),
    orderBy("timestamp", "desc"),
    limit(count)
  );
  const snap = await getDocs(q);

  return snap.docs.map((d) => {
    const data = d.data();
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
