import { logger } from "@/lib/logger";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  type DocumentData,
  type Unsubscribe,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sendPushNotification as fcmSendPushNotification } from "@/lib/fcm";

export async function sendPushNotification(params: {
  toUid: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<void> {
  return fcmSendPushNotification(params);
}

export function onNotificationsChange(
  userId: string,
  callback: (notifications: Array<{ id: string } & DocumentData>) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(50)
  );

  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(list);
  }, (error) => {
    logger.error(`[Firestore Error] Notifications listener failed for: ${userId}`, error);
    onError?.(error);
  });
}
