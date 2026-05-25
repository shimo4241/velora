import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/firebaseAdmin";
import { logger } from "@/lib/logger";

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
