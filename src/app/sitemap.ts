import { MetadataRoute } from "next";
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
      logger.error("Failed to parse FIREBASE_SERVICE_ACCOUNT in sitemap:", e);
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
    admin.initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://velora.app";
  
  const sitemaps: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/agenda`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/discover`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  try {
    const db = admin.firestore();
    const usersSnap = await db.collection("users").get();

    usersSnap.forEach((doc) => {
      const data = doc.data();
      const username = data.username;
      
      // Respect indexing privacy settings
      const allowIndexing = data.settings?.privacy?.allowIndexing !== false;
      const isVisible = data.isVisible !== false;
      const ghostMode = data.ghostMode === true;

      if (username && allowIndexing && isVisible && !ghostMode) {
        sitemaps.push({
          url: `${baseUrl}/u/${username}`,
          lastModified: data.updatedAt ? new Date(data.updatedAt) : new Date(),
          changeFrequency: "weekly",
          priority: 0.6,
        });
      }
    });
  } catch (err) {
    logger.error("[Sitemap Generator] Failed to fetch users for sitemap:", err);
  }

  return sitemaps;
}
