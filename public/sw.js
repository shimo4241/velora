// Import Workbox from CDN
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

// Lifecycle events for immediate activation
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

if (workbox) {
  console.log('[SW] Workbox is loaded');

  // Cache-first strategy for Cloudinary images
  workbox.routing.registerRoute(
    /^https:\/\/res\.cloudinary\.com\/.*/i,
    new workbox.strategies.CacheFirst({
      cacheName: 'cloudinary-images',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 Days
        }),
      ],
    })
  );

  // Network-first strategy for Firestore API calls
  workbox.routing.registerRoute(
    /^https:\/\/firestore\.googleapis\.com\/.*/i,
    new workbox.strategies.NetworkFirst({
      cacheName: 'firestore-cache',
      networkTimeoutSeconds: 4,
    })
  );

  // Cache static assets (styles, scripts, icons, fonts) with StaleWhileRevalidate
  workbox.routing.registerRoute(
    ({ request }) =>
      request.destination === 'style' ||
      request.destination === 'script' ||
      request.destination === 'image' ||
      request.destination === 'font',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'static-resources',
    })
  );

  // Offline fallback: for HTML navigation requests, use NetworkFirst and fallback to '/'
  const htmlHandler = new workbox.strategies.NetworkFirst({
    cacheName: 'navigation-cache',
    plugins: [
      {
        handlerDidError: async () => {
          return caches.match('/');
        },
      },
    ],
  });

  workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    htmlHandler
  );
}

// ═══════════════════════════════════════════════════
// FIREBASE CLOUD MESSAGING
// ═══════════════════════════════════════════════════
try {
  const urlParams = new URL(self.location.href).searchParams;
  const apiKey = urlParams.get("apiKey");
  
  if (apiKey) {
    self.FIREBASE_API_KEY = apiKey;
    self.FIREBASE_AUTH_DOMAIN = urlParams.get("authDomain") || "";
    self.FIREBASE_PROJECT_ID = urlParams.get("projectId") || "";
    self.FIREBASE_MESSAGING_SENDER_ID = urlParams.get("messagingSenderId") || "";
    self.FIREBASE_APP_ID = urlParams.get("appId") || "";

    importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js');
    importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js');

    firebase.initializeApp({
      apiKey: self.FIREBASE_API_KEY,
      authDomain: self.FIREBASE_AUTH_DOMAIN,
      projectId: self.FIREBASE_PROJECT_ID,
      messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID,
      appId: self.FIREBASE_APP_ID,
    });

    const messaging = firebase.messaging();
    messaging.onBackgroundMessage((payload) => {
      // Robust fallback handling for data-only notifications to prevent crashes
      const title = payload.notification?.title || payload.data?.title || "VELORA";
      const body = payload.notification?.body || payload.data?.body || "";

      if (title || body) {
        self.registration.showNotification(
          title,
          {
            body: body,
            icon: '/icon-192.png',
            data: payload.data
          }
        );
      }
    });
  }
} catch (err) {
  console.error('[SW] Firebase messaging initialization failed', err);
}
