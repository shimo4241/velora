import { MetadataRoute } from "next";
import { admin, isFirebaseAdminConfigured } from "@/lib/firebaseAdmin";
import { logger } from "@/lib/logger";

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

  if (!isFirebaseAdminConfigured) {
    logger.warn("[Sitemap Generator] Firebase Admin is not configured. Returning static sitemaps only.");
    return sitemaps;
  }

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
