<USER_REQUEST>
You are a senior full-stack engineer working on Velora, a premium professional
networking app (Next.js 16 + React 19 + TypeScript + Firebase + Capacitor).
Implement all 6 enhancements below in a single pass. For each one, write
production-quality code — no TODOs, no stubs, no console.log placeholders.

═══════════════════════════════════════════════════════════════
ENHANCEMENT 1 — Offline Mode + PWA Caching
═══════════════════════════════════════════════════════════════

Goal: app works without internet (show cached profile, connections, last
events). Critical for MENA markets with unstable connections.

Steps:

1. Install: npm install next-pwa

2. Update next.config.ts:
   import withPWA from "next-pwa";
   export default withPWA({
     dest: "public",
     disable: process.env.NODE_ENV === "development",
     runtimeCaching: [
       {
         urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
         handler: "NetworkFirst",
         options: { cacheName: "firestore-cache", networkTimeoutSeconds: 4 },
       },
       {
         urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
         handler: "CacheFirst",
         options: {
           cacheName: "cloudinary-images",
           expiration: { maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 },
         },
       },
     ],
   })(nextConfig);

3. Update public/manifest.json — make sure these fields exist:
   {
     "name": "VELORA",
     "short_name": "Velora",
     "start_url": "/",
     "display": "standalone",
     "background_color": "#070705",
     "theme_color": "#C4A265",
     "orientation": "portrait"
   }

4. Create src/components/ui/OfflineBanner.tsx:
   A slim top banner (40px, amber background) that appears when
   navigator.onLine === false using the existing useOnli
<truncated 15357 bytes>
));
     return [
       { url: process.env.NEXT_PUBLIC_APP_URL!, priority: 1.0 },
       ...profiles,
     ];
   }

4. Delete the static public/sitemap.xml file (now replaced by the dynamic route).

5. Update public/robots.txt:
   User-agent: *
   Allow: /u/
   Disallow: /api/
   Sitemap: https://velora-navy.vercel.app/sitemap.xml

═══════════════════════════════════════════════════════════════
VALIDATION — run these after all changes
═══════════════════════════════════════════════════════════════

1. npm run type-check        → zero errors
2. npm run build             → successful build
3. npm run lint              → zero warnings
4. Test offline: disconnect network → OfflineBanner appears
5. Test profile completion: new profile shows < 100% with correct suggestions
6. Test check-in: event with status "live" shows CheckInButton
7. Test SEO: curl https://your-domain/u/testuser → verify og:title and ld+json
8. No console.log in production build output
</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-05-25T02:18:06+01:00.

The user's current state is as follows:
Active Document: c:\Users\shimo\.gemini\antigravity\scratch\velora\src\app\globals.css (LANGUAGE_CSS)
Cursor is on line: 1
Other open documents:
- c:\Users\shimo\.gemini\antigravity\scratch\velora\src\lib\firestore.ts (LANGUAGE_TYPESCRIPT)
- c:\Users\shimo\.gemini\antigravity\scratch\velora\src\components\screens\DiscoverScreen.tsx (LANGUAGE_TSX)
- c:\Users\shimo\.gemini\antigravity\scratch\velora\src\lib\logger.ts (LANGUAGE_TYPESCRIPT)
- c:\Users\shimo\.gemini\antigravity\scratch\velora\src\components\screens\NetworkScreen.tsx (LANGUAGE_TSX)
- c:\Users\shimo\.gemini\antigravity\scratch\velora\src\app\p\[userId]\PublicProfileByIdClient.tsx (LANGUAGE_TSX)
</ADDITIONAL_METADATA>