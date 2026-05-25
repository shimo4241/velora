"use client";

import { getMessaging, getToken, type Messaging } from "firebase/messaging";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { app, db } from "./firebase";
import { logger } from "./logger";
import { sendPushNotificationServer } from "./fcmServer";

// Initialize Firebase Messaging on client if supported
export let messaging: Messaging | null = null;
if (typeof window !== "undefined" && typeof window.navigator !== "undefined") {
  try {
    messaging = getMessaging(app);
  } catch (err) {
    logger.error("Failed to initialize Firebase Messaging on client:", err);
  }
}

/**
 * Request notification permission from the user.
 * If granted, retrieve the FCM token and persist it to Firestore.
 */
export async function requestPushPermission(uid: string): Promise<boolean> {
  if (typeof window === "undefined" || !messaging) {
    logger.warn("Push notifications are not supported in this environment.");
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      logger.info("Notification permission was denied.");
      return false;
    }

    const vapidKey = process.env.NEXT_PUBLIC_FCM_VAPID_KEY;
    if (!vapidKey) {
      logger.error("NEXT_PUBLIC_FCM_VAPID_KEY is not defined in environment.");
      return false;
    }

    // Register service worker with dynamic Firebase configuration params
    let serviceWorkerRegistration: ServiceWorkerRegistration | undefined;
    if ("serviceWorker" in navigator) {
      const configParams = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
      };
      const query = new URLSearchParams(configParams).toString();
      const swUrl = `/firebase-messaging-sw.js?${query}`;
      serviceWorkerRegistration = await navigator.serviceWorker.register(swUrl);
      logger.info("FCM Service Worker registered/verified in fcm.ts:", serviceWorkerRegistration.scope);
    }

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration,
    });
    if (!token) {
      logger.error("No registration token received from FCM.");
      return false;
    }

    // Save token to Firestore users/{uid}/private_data/fcm_token
    const tokenRef = doc(db, "users", uid, "private_data", "fcm_token");
    await setDoc(tokenRef, {
      token,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    logger.info("Successfully registered FCM token.");
    return true;
  } catch (err) {
    logger.error("Error requesting push permission:", err);
    return false;
  }
}

/**
 * Send a push notification by calling a secure server action.
 */
export async function sendPushNotification(params: {
  toUid: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<void> {
  try {
    await sendPushNotificationServer(params);
  } catch (err) {
    logger.error("Failed to send push notification:", err);
  }
}
