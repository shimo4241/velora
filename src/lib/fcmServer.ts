"use server";

import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

export async function sendPushNotificationServer(params: {
  toUid: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<void> {
  const { toUid, title, body, data } = params;

  try {
    // Read FCM token from Firestore users/{toUid}/private_data/fcm_token
    const tokenRef = doc(db, "users", toUid, "private_data", "fcm_token");
    const tokenSnap = await getDoc(tokenRef);
    if (!tokenSnap.exists()) {
      return;
    }

    const tokenData = tokenSnap.data();
    const token = tokenData?.token;
    if (!token) {
      return;
    }

    // Call Next.js API route to send notification via firebase-admin
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const secret = process.env.NOTIFICATION_SECRET || "";

    const response = await fetch(`${appUrl}/api/notifications/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${secret}`,
      },
      body: JSON.stringify({ token, title, body, data }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[FCM Server Action] HTTP error ${response.status}: ${errText}`);
    }
  } catch (err) {
    console.error("[FCM Server Action] Error sending push:", err);
  }
}
