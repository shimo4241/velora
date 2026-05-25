import admin from "firebase-admin";
import { logger } from "@/lib/logger";

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const isFirebaseAdminConfigured = Boolean(
  process.env.FIREBASE_SERVICE_ACCOUNT ||
    (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) ||
    (projectId && !projectId.startsWith("dummy"))
);

if (isFirebaseAdminConfigured && !admin.apps.length) {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      logger.info("[Firebase Admin] Initialized with Service Account cert.");
    } catch (e) {
      logger.error("[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT:", e);
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
    logger.info("[Firebase Admin] Initialized with explicit credentials key.");
  } else if (projectId) {
    admin.initializeApp({
      projectId,
    });
    logger.info(`[Firebase Admin] Initialized with default projectId: ${projectId}`);
  }
}

export { admin, isFirebaseAdminConfigured };
