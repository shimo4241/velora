"use client";

import { db } from "@/lib/firebase";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

export type NotificationPermissionState = "granted" | "denied" | "prompt" | "unsupported";

export interface NativeNotificationToken {
  token: string;
  platform: "android" | "ios" | "web";
  provider: "fcm";
}

export async function getNotificationPermissionState(): Promise<NotificationPermissionState> {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission as NotificationPermissionState;
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  const permission = await Notification.requestPermission();
  return permission as NotificationPermissionState;
}

export async function registerNotificationToken(userId: string, token: NativeNotificationToken): Promise<void> {
  await setDoc(
    doc(db, "users", userId, "private_data", "notification_token"),
    {
      ...token,
      updatedAt: serverTimestamp(),
      enabled: true,
    },
    { merge: true }
  );
}

export async function unregisterNotificationToken(userId: string): Promise<void> {
  await setDoc(
    doc(db, "users", userId, "private_data", "notification_token"),
    {
      enabled: false,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
