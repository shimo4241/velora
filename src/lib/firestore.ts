/* ═══════════════════════════════════════════════════
   VELORA — Firestore Service Layer
   Typed CRUD operations for all collections
   ═══════════════════════════════════════════════════ */

import {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  runTransaction,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  type DocumentData,
  type DocumentSnapshot,
  type Unsubscribe,
  Timestamp,
  startAfter,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase";
import {
  USERNAME_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  createUsernameSeed,
  isReservedUsername,
  normalizeUsernameInput,
  usernameWithCounter,
  validateUsername,
} from "./usernames";
import type {
  VeloraProfile,
  PortfolioItem,
  ProfileService,
  ExperienceEntry,
  VeloraConnection,
  ConnectionMethod,
  DailyStats,
  ActivityItem,
} from "@/types";

const DEFAULT_LOCALE: VeloraProfile["locale"] = "fr";
const DEFAULT_MODE: VeloraProfile["professionalMode"] = "entrepreneur";
const DEFAULT_AVAILABILITY: VeloraProfile["availabilityStatus"] = "available";
const DEFAULT_PROFILE_THEME: VeloraProfile["profileTheme"] = { palette: "gold" };
const DEFAULT_CONTACT_ACTIONS: VeloraProfile["contactActions"] = {
  whatsapp: true,
  email: true,
  phone: true,
  website: true,
  bookingUrl: "",
  primary: "whatsapp",
};

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asBoolean(value: unknown): boolean {
  return Boolean(value);
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asNumber(value: unknown, fallback?: number): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeLocale(value: unknown): VeloraProfile["locale"] {
  return value === "en" || value === "ar" || value === "fr" ? value : DEFAULT_LOCALE;
}

function normalizeProfessionalMode(value: unknown): VeloraProfile["professionalMode"] {
  return value === "corporate" ||
    value === "creative" ||
    value === "nightlife" ||
    value === "luxury" ||
    value === "entrepreneur"
    ? value
    : DEFAULT_MODE;
}

function normalizeOnboarding(value: unknown): VeloraProfile["onboarding"] {
  if (typeof value !== "object" || value === null) return undefined;
  const onboarding = value as Record<string, unknown>;

  return {
    profileSetupComplete: Boolean(onboarding.profileSetupComplete),
    productTourComplete: Boolean(onboarding.productTourComplete),
    initializedAt: onboarding.initializedAt ? dateValueToIso(onboarding.initializedAt) : undefined,
    updatedAt: onboarding.updatedAt ? dateValueToIso(onboarding.updatedAt) : undefined,
  };
}

function normalizeAvailabilityStatus(value: unknown): VeloraProfile["availabilityStatus"] {
  return value === "available" || value === "busy" || value === "offline"
    ? value
    : DEFAULT_AVAILABILITY;
}

function normalizeProfileTheme(value: unknown): VeloraProfile["profileTheme"] {
  if (typeof value !== "object" || value === null) return DEFAULT_PROFILE_THEME;
  const theme = value as Record<string, unknown>;
  const palette = theme.palette;

  return {
    palette:
      palette === "noir" || palette === "gold" || palette === "emerald" || palette === "violet"
        ? palette
        : DEFAULT_PROFILE_THEME.palette,
    accentLabel: asString(theme.accentLabel),
  };
}

function normalizeServices(value: unknown): ProfileService[] {
  if (!Array.isArray(value)) return [];

  const services: ProfileService[] = [];

  value.forEach((service, index) => {
    if (typeof service !== "object" || service === null) return;
    const data = service as Record<string, unknown>;
    const title = asString(data.title).trim();
    if (!title) return;

    services.push({
      id: asString(data.id, `service-${index}`),
      title,
      description: asString(data.description),
      price: asString(data.price),
    });
  });

  return services;
}

function normalizeContactActions(value: unknown): VeloraProfile["contactActions"] {
  if (typeof value !== "object" || value === null) return DEFAULT_CONTACT_ACTIONS;
  const actions = value as Record<string, unknown>;
  const primary = actions.primary;

  return {
    whatsapp: actions.whatsapp !== false,
    email: actions.email !== false,
    phone: actions.phone !== false,
    website: actions.website !== false,
    bookingUrl: asString(actions.bookingUrl),
    primary:
      primary === "whatsapp" ||
      primary === "email" ||
      primary === "phone" ||
      primary === "website" ||
      primary === "booking"
        ? primary
        : DEFAULT_CONTACT_ACTIONS.primary,
  };
}

function normalizeProfile(id: string, data: DocumentData | Partial<VeloraProfile>): VeloraProfile {
  return {
    id,
    username: asString(data.username),
    fullName: asString(data.fullName),
    title: asString(data.title),
    company: asString(data.company),
    location: asString(data.location),
    bio: asString(data.bio),
    phone: asString(data.phone),
    whatsapp: asString(data.whatsapp),
    instagram: asString(data.instagram),
    email: asString(data.email),
    website: asString(data.website),
    avatarUrl: asString(data.avatarUrl),
    coverUrl: asString(data.coverUrl),
    createdAt: data.createdAt ? dateValueToIso(data.createdAt) : "",
    updatedAt: data.updatedAt ? dateValueToIso(data.updatedAt) : "",
    skills: asArray<string>(data.skills).filter((skill) => typeof skill === "string" && skill.trim()),
    services: normalizeServices(data.services),
    availabilityStatus: normalizeAvailabilityStatus(data.availabilityStatus),
    profileTheme: normalizeProfileTheme(data.profileTheme),
    contactActions: normalizeContactActions(data.contactActions),
    socialLinks: asArray(data.socialLinks),
    professionalMode: normalizeProfessionalMode(data.professionalMode),
    role: data.role as VeloraProfile["role"],
    isVerified: asBoolean(data.isVerified),
    isPremium: asBoolean(data.isPremium),
    isNoir: asBoolean(data.isNoir),
    locale: normalizeLocale(data.locale),
    onboarding: normalizeOnboarding(data.onboarding),
  };
}

function dateValueToIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === "object" && value !== null && "toDate" in value) {
    const maybeDate = (value as { toDate?: () => Date }).toDate?.();
    if (maybeDate instanceof Date && !Number.isNaN(maybeDate.getTime())) {
      return maybeDate.toISOString();
    }
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
  }
  return new Date().toISOString();
}

function normalizeConnection(id: string, data: DocumentData): VeloraConnection {
  const rawProfile =
    typeof data.connectedProfile === "object" && data.connectedProfile !== null
      ? data.connectedProfile
      : typeof data.profile === "object" && data.profile !== null
        ? data.profile
        : {};

  return {
    id,
    profile: normalizeProfile(asString(data.connectedUserId, id), rawProfile as DocumentData),
    method: (data.method || "link") as ConnectionMethod,
    contextLabel: asString(data.contextLabel, asString(data.locationName)),
    introducedBy: asString(data.introducedBy),
    personalNote: asString(data.personalNote),
    metAt: dateValueToIso(data.metAt || data.createdAt),
    locationName: asString(data.locationName),
    followUpSent: asBoolean(data.followUpSent),
  };
}

function normalizePortfolioItem(id: string, data: DocumentData): PortfolioItem {
  return {
    id,
    title: asString(data.title),
    category: asString(data.category, "General"),
    description: asString(data.description),
    imageUrl: asString(data.imageUrl),
    link: asString(data.link),
    order: asNumber(data.order),
  };
}

function normalizeExperienceEntry(id: string, data: DocumentData): ExperienceEntry {
  return {
    id,
    role: asString(data.role),
    company: asString(data.company),
    description: asString(data.description),
    startYear: typeof data.startYear === "number" ? data.startYear : new Date().getFullYear(),
    endYear: typeof data.endYear === "number" ? data.endYear : undefined,
    isCurrent: asBoolean(data.isCurrent),
    order: asNumber(data.order),
  };
}

/* ═══════════════════════════════════════════
   PROFILES
   ═══════════════════════════════════════════ */

/** Get user profile by UID */
export async function getProfile(uid: string): Promise<VeloraProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return normalizeProfile(snap.id, snap.data());
}

/** Get user profile by username */
export async function getProfileByUsername(username: string): Promise<VeloraProfile | null> {
  const normalizedUsername = normalizeUsernameInput(username);
  if (!validateUsername(normalizedUsername).ok) return null;

  const reservationSnap = await getDoc(doc(db, "usernames", normalizedUsername));
  if (reservationSnap.exists()) {
    const uid = asString(reservationSnap.data().uid);
    if (!uid) return null;

    const profile = await getProfile(uid);
    return profile?.username === normalizedUsername ? profile : null;
  }

  const q = query(collection(db, "users"), where("username", "==", normalizedUsername), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return normalizeProfile(docSnap.id, docSnap.data());
}

/** Check if a username is already taken */
export async function checkUsernameExists(username: string): Promise<boolean> {
  const normalizedUsername = normalizeUsernameInput(username);
  if (!validateUsername(normalizedUsername).ok) return false;

  const reservationSnap = await getDoc(doc(db, "usernames", normalizedUsername));
  if (reservationSnap.exists()) return true;

  const q = query(collection(db, "users"), where("username", "==", normalizedUsername), limit(1));
  const snap = await getDocs(q);
  return !snap.empty;
}

/** Generate a unique slug based on fullname */
export async function generateUniqueUsername(fullName: string): Promise<string> {
  let base = createUsernameSeed(fullName);
  if (base.length < USERNAME_MIN_LENGTH) {
    base = `${base}user`.slice(0, USERNAME_MIN_LENGTH);
  }
  if (isReservedUsername(base)) {
    base = `${base.slice(0, USERNAME_MAX_LENGTH - 3)}app`;
  }

  let slug = base;
  let counter = 1;

  while (await checkUsernameExists(slug)) {
    slug = usernameWithCounter(base, counter);
    counter++;
  }
  return slug;
}

export type CreateProfileData = Partial<Omit<VeloraProfile, "id">> &
  Pick<VeloraProfile, "username" | "fullName" | "title">;

/** Create a profile and atomically reserve its immutable public username */
export async function createProfile(uid: string, data: CreateProfileData): Promise<void> {
  const username = normalizeUsernameInput(data.username);
  const validation = validateUsername(username);
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  const usernameRef = doc(db, "usernames", username);
  const userRef = doc(db, "users", uid);

  try {
    await runTransaction(db, async (transaction) => {
      const reservationSnap = await transaction.get(usernameRef);
      const userSnap = await transaction.get(userRef);

      if (reservationSnap.exists()) {
        throw new Error("Username already taken.");
      }

      const existingUsername = userSnap.exists()
        ? asString(userSnap.data().username)
        : "";
      if (existingUsername && existingUsername !== username) {
        throw new Error("Username is immutable after profile creation.");
      }

      transaction.set(usernameRef, {
        uid,
        username,
        createdAt: serverTimestamp(),
      });
      transaction.set(
        userRef,
        {
          ...data,
          username,
          updatedAt: serverTimestamp(),
          createdAt: data.createdAt || serverTimestamp(),
        },
        { merge: true }
      );
    });
  } catch (error) {
    console.error(`[Firestore Error] Failed to create profile for UID: ${uid}`, error);
    throw error;
  }
}

export interface GoogleProfileUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

function getGoogleProfileName(user: GoogleProfileUser): string {
  const displayName = user.displayName?.trim();
  if (displayName) return displayName;

  const emailName = user.email?.split("@")[0]?.replace(/[._-]+/g, " ").trim();
  if (emailName) return emailName;

  return "VELORA Member";
}

function getGoogleUsernameBase(user: GoogleProfileUser): string {
  const rawBase = user.displayName || user.email?.split("@")[0] || user.uid;
  let base = createUsernameSeed(rawBase, "member");

  if (base.length < USERNAME_MIN_LENGTH) {
    base = `${base}user`.slice(0, USERNAME_MIN_LENGTH);
  }

  if (isReservedUsername(base)) {
    base = `${base.slice(0, USERNAME_MAX_LENGTH - 4)}user`;
  }

  return validateUsername(base).ok ? base : "member";
}

function isUsernameCollision(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return /username already taken|already exists|ALREADY_EXISTS/i.test(error.message);
}

export async function ensureGoogleUserProfile(user: GoogleProfileUser): Promise<VeloraProfile> {
  const existingProfile = await getProfile(user.uid);
  if (existingProfile) return existingProfile;

  const base = getGoogleUsernameBase(user);
  const uidSuffix = createUsernameSeed(user.uid, "id").slice(0, 6);
  const collisionBase = `${base}${uidSuffix}`.slice(0, USERNAME_MAX_LENGTH);
  const fullName = getGoogleProfileName(user);
  const now = new Date().toISOString();

  for (let attempt = 0; attempt < 25; attempt++) {
    const username = attempt === 0 ? base : usernameWithCounter(collisionBase, attempt);

    try {
      await createProfile(user.uid, {
        username,
        fullName,
        title: "",
        bio: "",
        location: "",
        email: user.email || "",
        avatarUrl: user.photoURL || "",
        professionalMode: DEFAULT_MODE,
        role: "free",
        isVerified: false,
        isPremium: false,
        isNoir: false,
        locale: DEFAULT_LOCALE,
        skills: [],
        services: [],
        availabilityStatus: DEFAULT_AVAILABILITY,
        profileTheme: DEFAULT_PROFILE_THEME,
        contactActions: DEFAULT_CONTACT_ACTIONS,
        socialLinks: [],
        onboarding: {
          profileSetupComplete: false,
          productTourComplete: false,
          initializedAt: now,
          updatedAt: now,
        },
        createdAt: now,
        updatedAt: now,
      });

      const createdProfile = await getProfile(user.uid);
      if (createdProfile) return createdProfile;
      throw new Error("Profile creation did not return a profile.");
    } catch (error) {
      const concurrentProfile = await getProfile(user.uid);
      if (concurrentProfile) return concurrentProfile;

      if (!isUsernameCollision(error) || attempt === 24) {
        throw error;
      }
    }
  }

  throw new Error("Unable to create a unique username.");
}

/** Real-time profile listener */
export function onProfileChange(
  uid: string,
  callback: (profile: VeloraProfile | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(doc(db, "users", uid), (snap) => {
    if (!snap.exists()) return callback(null);
    callback(normalizeProfile(snap.id, snap.data()));
  }, (error) => {
    console.error(`[Firestore Error] Profile listener failed for UID: ${uid}`, error);
    onError?.(error);
  });
}

/** Update profile fields (creates if it doesn't exist) */
export async function updateProfile(
  uid: string,
  data: Partial<Omit<VeloraProfile, "id" | "username">>
): Promise<void> {
  try {
    await setDoc(
      doc(db, "users", uid),
      {
        ...data,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

  } catch (error) {
    console.error(`[Firestore Error] Failed to update/create profile for UID: ${uid}`, error);
    throw error;
  }
}

/** Compress image using canvas */
async function compressImage(file: File, maxWidth = 800): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not supported"));
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Blob creation failed"));
        },
        "image/jpeg",
        0.85
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Image load error"));
    };
  });
}

/** Upload avatar image without mutating the profile document */
export async function uploadAvatarImage(uid: string, file: File): Promise<string> {
  const compressedBlob = await compressImage(file, 600);
  const storageRef = ref(storage, `avatars/${uid}/${Date.now()}.jpg`);
  await uploadBytes(storageRef, compressedBlob);
  return getDownloadURL(storageRef);
}

/** Upload avatar to Storage and update profile */
export async function uploadAvatar(uid: string, file: File): Promise<string> {
  try {
    const url = await uploadAvatarImage(uid, file);
    await updateProfile(uid, { avatarUrl: url });
    return url;
  } catch (error) {
    console.error("Avatar upload failed:", error);
    throw error;
  }
}

/** Upload cover/banner image without mutating the profile document */
export async function uploadCoverImage(uid: string, file: File): Promise<string> {
  const compressedBlob = await compressImage(file, 1600);
  const storageRef = ref(storage, `covers/${uid}/${Date.now()}.jpg`);
  await uploadBytes(storageRef, compressedBlob);
  return getDownloadURL(storageRef);
}

/** Upload cover/banner image to Storage and update profile */
export async function uploadCover(uid: string, file: File): Promise<string> {
  try {
    const url = await uploadCoverImage(uid, file);
    await updateProfile(uid, { coverUrl: url });
    return url;
  } catch (error) {
    console.error("Cover upload failed:", error);
    throw error;
  }
}

/** Upload portfolio image */
export async function uploadPortfolioImage(uid: string, file: File): Promise<string> {
  const compressedBlob = await compressImage(file, 1200);
  const storageRef = ref(storage, `portfolio/${uid}/${Date.now()}.jpg`);
  await uploadBytes(storageRef, compressedBlob);
  return getDownloadURL(storageRef);
}

/* ═══════════════════════════════════════════
   PORTFOLIO (subcollection)
   ═══════════════════════════════════════════ */

export async function getPortfolio(uid: string): Promise<PortfolioItem[]> {
  const q = query(collection(db, "users", uid, "portfolio"), orderBy("order", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => normalizePortfolioItem(d.id, d.data()));
}

export function onPortfolioChange(
  uid: string,
  callback: (items: PortfolioItem[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(collection(db, "users", uid, "portfolio"), orderBy("order", "asc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => normalizePortfolioItem(d.id, d.data())));
  }, (error) => {
    console.error(`[Firestore Error] Portfolio listener failed for UID: ${uid}`, error);
    onError?.(error);
  });
}

export async function addPortfolioItem(uid: string, item: Omit<PortfolioItem, "id">): Promise<string> {
  const docRef = await addDoc(collection(db, "users", uid, "portfolio"), {
    ...item,
    order: item.order ?? Date.now(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updatePortfolioItem(
  uid: string,
  itemId: string,
  item: Partial<Omit<PortfolioItem, "id">>
): Promise<void> {
  await setDoc(
    doc(db, "users", uid, "portfolio", itemId),
    {
      ...item,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function deletePortfolioItem(uid: string, itemId: string): Promise<void> {
  await deleteDoc(doc(db, "users", uid, "portfolio", itemId));
}

/* ═══════════════════════════════════════════
   EXPERIENCE (subcollection)
   ═══════════════════════════════════════════ */

export async function getExperience(uid: string): Promise<ExperienceEntry[]> {
  const q = query(collection(db, "users", uid, "experience"), orderBy("startYear", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => normalizeExperienceEntry(d.id, d.data()));
}

export function onExperienceChange(
  uid: string,
  callback: (entries: ExperienceEntry[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(collection(db, "users", uid, "experience"), orderBy("startYear", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => normalizeExperienceEntry(d.id, d.data())));
  }, (error) => {
    console.error(`[Firestore Error] Experience listener failed for UID: ${uid}`, error);
    onError?.(error);
  });
}

export async function addExperienceEntry(
  uid: string,
  entry: Omit<ExperienceEntry, "id">
): Promise<string> {
  const docRef = await addDoc(collection(db, "users", uid, "experience"), {
    ...entry,
    order: entry.order ?? Date.now(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateExperienceEntry(
  uid: string,
  entryId: string,
  entry: Partial<Omit<ExperienceEntry, "id">>
): Promise<void> {
  await setDoc(
    doc(db, "users", uid, "experience", entryId),
    {
      ...entry,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function deleteExperienceEntry(uid: string, entryId: string): Promise<void> {
  await deleteDoc(doc(db, "users", uid, "experience", entryId));
}

/* ═══════════════════════════════════════════
   CONNECTIONS (Scan Memory)
   ═══════════════════════════════════════════ */

export function onConnectionsChange(
  uid: string,
  callback: (connections: VeloraConnection[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, "connections"),
    where("userId", "==", uid),
    orderBy("metAt", "desc"),
    limit(50)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => normalizeConnection(d.id, d.data())));
  }, (error) => {
    console.error(`[Firestore Error] Connections listener failed for UID: ${uid}`, error);
    onError?.(error);
  });
}

export async function createConnection(data: {
  userId: string;
  connectedUserId: string;
  connectedProfile: Partial<VeloraProfile>;
  method: ConnectionMethod;
  contextLabel?: string;
  locationName?: string;
  introducedBy?: string;
  personalNote?: string;
}): Promise<string> {
  const docRef = await addDoc(collection(db, "connections"), {
    ...data,
    followUpSent: false,
    metAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateConnectionFollowUp(
  connectionId: string,
  followUpSent: boolean
): Promise<void> {
  await updateDoc(doc(db, "connections", connectionId), { followUpSent });
}

export async function updateConnectionNote(
  connectionId: string,
  personalNote: string
): Promise<void> {
  await updateDoc(doc(db, "connections", connectionId), { personalNote });
}

/* ═══════════════════════════════════════════
   SHARES
   ═══════════════════════════════════════════ */

export async function logShare(data: {
  userId: string;
  method: ConnectionMethod;
  recipientInfo?: string;
}): Promise<void> {
  await addDoc(collection(db, "shares"), {
    ...data,
    timestamp: serverTimestamp(),
  });
}

/* ═══════════════════════════════════════════
   ANALYTICS EVENTS
   ═══════════════════════════════════════════ */

export async function trackAnalyticsEvent(data: {
  userId: string;
  event: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await addDoc(collection(db, "analytics_events"), {
    ...data,
    timestamp: serverTimestamp(),
  });
}

/** Get aggregated stats for today */
export async function getDailyStats(uid: string): Promise<DailyStats> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = Timestamp.fromDate(today);

  const q = query(
    collection(db, "analytics_events"),
    where("userId", "==", uid),
    where("timestamp", ">=", todayTimestamp)
  );
  const snap = await getDocs(q);

  const stats: DailyStats = { views: 0, taps: 0, scans: 0, clicks: 0 };
  snap.docs.forEach((d) => {
    const data = d.data();
    switch (data.event) {
      case "profile_view": stats.views++; break;
      case "nfc_tap": stats.taps++; break;
      case "qr_scan": stats.scans++; break;
      case "link_click": stats.clicks++; break;
    }
  });
  return stats;
}

/** Get recent activity */
export async function getRecentActivity(uid: string, count = 10): Promise<ActivityItem[]> {
  const q = query(
    collection(db, "analytics_events"),
    where("userId", "==", uid),
    orderBy("timestamp", "desc"),
    limit(count)
  );
  const snap = await getDocs(q);

  return snap.docs.map((d) => {
    const data = d.data() as DocumentData;
    const eventMap: Record<string, { icon: string; type: ActivityItem["type"] }> = {
      profile_view: { icon: "eye", type: "view" },
      nfc_tap: { icon: "nfc", type: "nfc" },
      qr_scan: { icon: "qr", type: "qr" },
      whatsapp_share: { icon: "whatsapp", type: "whatsapp" },
      connection_created: { icon: "users", type: "connect" },
    };
    const mapped = eventMap[data.event] || { icon: "eye", type: "view" as const };
    const ts = data.timestamp?.toDate?.() || new Date();
    const diff = Math.floor((Date.now() - ts.getTime()) / 60000);
    const timeStr = diff < 60 ? `${diff}m` : diff < 1440 ? `${Math.floor(diff / 60)}h` : `${Math.floor(diff / 1440)}d`;

    return {
      id: d.id,
      text: data.metadata?.description || data.event,
      time: timeStr,
      icon: mapped.icon,
      type: mapped.type,
    };
  });
}

/**
 * Get users for the Discover screen
 */
export async function getDiscoverUsers(
  currentUserId: string,
  pageSize = 10,
  lastDocSnap?: DocumentSnapshot
): Promise<{ users: VeloraProfile[]; lastDoc: DocumentSnapshot | null }> {
  let q = query(
    collection(db, "users"),
    orderBy("fullName"),
    limit(pageSize + 1)
  );

  if (lastDocSnap) {
    q = query(
      collection(db, "users"),
      orderBy("fullName"),
      startAfter(lastDocSnap),
      limit(pageSize + 1)
    );
  }

  const snap = await getDocs(q);
  const users: VeloraProfile[] = [];
  
  snap.forEach((doc) => {
    if (doc.id !== currentUserId && users.length < pageSize) {
      users.push(normalizeProfile(doc.id, doc.data()));
    }
  });

  return {
    users,
    lastDoc: snap.docs[snap.docs.length - 1],
  };
}

export function onDiscoverUsersChange(
  currentUserId: string,
  pageSize = 10,
  callback: (users: VeloraProfile[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, "users"),
    orderBy("fullName"),
    limit(pageSize + 1)
  );

  return onSnapshot(q, (snap) => {
    const users: VeloraProfile[] = [];

    snap.forEach((doc) => {
      if (doc.id !== currentUserId && users.length < pageSize) {
        users.push(normalizeProfile(doc.id, doc.data()));
      }
    });

    callback(users);
  }, (error) => {
    console.error(`[Firestore Error] Discover listener failed for UID: ${currentUserId}`, error);
    onError?.(error);
  });
}
