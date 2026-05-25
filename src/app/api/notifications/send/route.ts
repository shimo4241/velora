import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";
import { logger } from "@/lib/logger";

if (!admin.apps.length) {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (e) {
      logger.error("Failed to parse FIREBASE_SERVICE_ACCOUNT:", e);
      admin.initializeApp();
    }
  } else if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
  } else {
    // Fallback to project ID default if env is partially available
    admin.initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const secret = process.env.NOTIFICATION_SECRET || "";

    if (!secret || authHeader !== `Bearer ${secret}`) {
      logger.warn("[API Notifications] Unauthorized notification request attempt.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token, title, body, data } = await req.json();
    if (!token || !title || !body) {
      return NextResponse.json(
        { error: "Missing required fields (token, title, body)" },
        { status: 400 }
      );
    }

    const message: admin.messaging.Message = {
      token,
      notification: {
        title,
        body,
      },
    };

    if (data) {
      message.data = data;
    }

    const messageId = await admin.messaging().send(message);
    logger.info(`[API Notifications] Sent notification successfully: ${messageId}`);
    return NextResponse.json({ success: true, messageId });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Internal server error";
    logger.error("[API Notifications] Error sending notification:", err);
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}
