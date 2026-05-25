
import { admin } from "@/lib/firebaseAdmin";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      logger.warn("[Cloudinary Server Delete] Missing or invalid authorization header.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    let uid = "";
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      uid = decodedToken.uid;
    } catch (e) {
      logger.warn("[Cloudinary Server Delete] Token verification failed:", e);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { publicId } = await request.json();

    if (!publicId) {
      return NextResponse.json({ error: "Missing publicId" }, { status: 400 });
    }

    // Strict ownership validation: folder structure must contain the user's uid
    // Path format: velora/{avatars|covers|portfolio}/{uid}/...
    const pathParts = publicId.split("/");
    if (pathParts.length >= 3 && pathParts[0] === "velora") {
      const ownerUid = pathParts[2];
      if (ownerUid !== uid) {
        logger.warn(`[Cloudinary Server Delete] User ${uid} attempted to delete asset owned by ${ownerUid}: ${publicId}`);
        return NextResponse.json({ error: "Forbidden: Asset ownership mismatch" }, { status: 403 });
      }
    } else {
      logger.warn(`[Cloudinary Server Delete] Rejected non-standard publicId structure: ${publicId}`);
      return NextResponse.json({ error: "Forbidden: Invalid asset path structure" }, { status: 403 });
    }

    const rawCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
    const rawApiKey = process.env.CLOUDINARY_API_KEY || "";
    const rawApiSecret = process.env.CLOUDINARY_API_SECRET || "";

    const cloudName = rawCloudName.replace(/['"]/g, "").trim();
    const apiKey = rawApiKey.replace(/['"]/g, "").trim();
    const apiSecret = rawApiSecret.replace(/['"]/g, "").trim();

    if (!cloudName || !apiKey || !apiSecret) {
      logger.warn("[Cloudinary Server Delete] Cloudinary credentials not configured in environment. Skipping asset deletion.");
      return NextResponse.json({ message: "Cloudinary credentials not configured. Skipped deletion." }, { status: 200 });
    }

    const timestamp = Math.round(Date.now() / 1000).toString();
    const signatureStr = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash("sha1").update(signatureStr).digest("hex");

    const formData = new URLSearchParams();
    formData.append("public_id", publicId);
    formData.append("timestamp", timestamp);
    formData.append("api_key", apiKey);
    formData.append("signature", signature);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const result = await response.json();

    if (!response.ok || result.result !== "ok") {
      logger.error("[Cloudinary Server Delete] Failed to destroy image:", result.error || result);
      return NextResponse.json({ error: result.error?.message || "Failed to destroy image" }, { status: 500 });
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    logger.error("[Cloudinary Server Delete] Unexpected error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
