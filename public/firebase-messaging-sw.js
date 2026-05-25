// Parse configuration query parameters from the registration URL dynamically
try {
  const urlParams = new URL(self.location.href).searchParams;
  self.FIREBASE_API_KEY = urlParams.get("apiKey") || "";
  self.FIREBASE_AUTH_DOMAIN = urlParams.get("authDomain") || "";
  self.FIREBASE_PROJECT_ID = urlParams.get("projectId") || "";
  self.FIREBASE_MESSAGING_SENDER_ID = urlParams.get("messagingSenderId") || "";
  self.FIREBASE_APP_ID = urlParams.get("appId") || "";
} catch {
  // Fallback for older environments
}

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
  self.registration.showNotification(
    payload.notification.title,
    { body: payload.notification.body, icon: '/icons/icon-192.png' }
  );
});