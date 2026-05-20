import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { publicId } = await request.json();

    if (!publicId) {
      return NextResponse.json({ error: "Missing publicId" }, { status: 400 });
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.warn("[Cloudinary Server Delete] Cloudinary credentials not configured in environment. Skipping asset deletion.");
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
      console.error("[Cloudinary Server Delete] Failed to destroy image:", result.error || result);
      return NextResponse.json({ error: result.error?.message || "Failed to destroy image" }, { status: 500 });
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("[Cloudinary Server Delete] Unexpected error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
