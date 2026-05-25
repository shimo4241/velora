import { logger } from "@/lib/logger";
import {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  runTransaction,
  query,
  where,
  limit,
  serverTimestamp,
  type DocumentData,
  type Unsubscribe,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
  onSnapshot,
  orderBy,
  startAfter,
  type DocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  USERNAME_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  createUsernameSeed,
  isReservedUsername,
  normalizeUsernameInput,
  usernameWithCounter,
  validateUsername,
} from "@/utils/usernames";
import type { VeloraProfile, ProfileService as ProfileServiceType } from "@/types";
import {
  uploadAvatarImage,
  uploadCoverImage,
  type UploadOptions,
} from "./cloudinaryService";
import { deleteImageFromCloudinary } from "@/lib/cloudinary";
import { asString, asBoolean, asArray, asNumber, dateValueToIso } from "@/utils/firestore";

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


function normalizeCoarseLocation(value: unknown): VeloraProfile["location_geo_coarse"] {
  if (typeof value !== "object" || value === null) return null;
  const location = value as Record<string, unknown>;
  const lat = asNumber(location.lat);
  const lng = asNumber(location.lng);
  if (lat === undefined || lng === undefined) return null;
  return {
    lat,
    lng,
    lastActive: location.lastActive ? dateValueToIso(location.lastActive) : new Date().toISOString(),
  };
}

function normalizeLocale(value: unknown): VeloraProfile["locale"] {
  return value === "en" || value === "ar" || value === "fr" ? value : DEFAULT_LOCALE;
}

const VALID_PROFESSIONAL_MODES = new Set<VeloraProfile["professionalMode"]>([
  "entrepreneur",
  "corporate",
  "creative",
  "nightlife",
  "luxury",
  "dentist",
  "creator",
  "artist",
  "business",
  "vip",
]);

function normalizeProfessionalMode(value: unknown): VeloraProfile["professionalMode"] {
  return VALID_PROFESSIONAL_MODES.has(value as VeloraProfile["professionalMode"])
    ? (value as VeloraProfile["professionalMode"])
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

function normalizeServices(value: unknown): ProfileServiceType[] {
  if (!Array.isArray(value)) return [];

  const services: ProfileServiceType[] = [];

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

export function normalizeProfile(id: string, data: DocumentData | Partial<VeloraProfile>): VeloraProfile {
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
    isDemo: asBoolean(data.isDemo),
    locale: normalizeLocale(data.locale),
    onboarding: normalizeOnboarding(data.onboarding),
    specialty: asString(data.specialty),
    clinicName: asString(data.clinicName),
    orderNumber: asString(data.orderNumber),
    fixedPhone: asString(data.fixedPhone),
    googleMapsLink: asString(data.googleMapsLink),
    googleReviewsLink: asString(data.googleReviewsLink),
    appointmentLink: asString(data.appointmentLink),
    clinicAddress: asString(data.clinicAddress),
    workHours: asString(data.workHours),
    emergencyContact: asString(data.emergencyContact),
    emergencyAvailable: asBoolean(data.emergencyAvailable),
    yearsOfExperience: asNumber(data.yearsOfExperience),
    languagesSpoken: asArray<string>(data.languagesSpoken).filter((item) => typeof item === "string" && item.trim()),
    clinicGallery: asArray<string>(data.clinicGallery).filter((item) => typeof item === "string" && item.trim()),
    beforeAfterGallery: asArray<string>(data.beforeAfterGallery).filter((item) => typeof item === "string" && item.trim()),
    location_geo_coarse: normalizeCoarseLocation(data.location_geo_coarse),
    locationSharing: asBoolean(data.locationSharing),
    ghostMode: asBoolean(data.ghostMode),
    isVisible: data.isVisible !== undefined ? asBoolean(data.isVisible) : true,
    visualTheme: asString(data.visualTheme) || "gold",
    syncThemeToPublic: asBoolean(data.syncThemeToPublic),
  };
}

export const profileConverter: FirestoreDataConverter<VeloraProfile> = {
  toFirestore(profile: VeloraProfile): DocumentData {
    return profile;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): VeloraProfile {
    return normalizeProfile(snapshot.id, snapshot.data(options || {}));
  },
};

export async function getProfile(uid: string): Promise<VeloraProfile | null> {
  const snap = await getDoc(doc(db, "users", uid).withConverter(profileConverter));
  return snap.data() ?? null;
}

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

  const q = query(
    collection(db, "users").withConverter(profileConverter),
    where("username", "==", normalizedUsername),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() ?? null;
}

export async function checkUsernameExists(username: string): Promise<boolean> {
  const normalizedUsername = normalizeUsernameInput(username);
  if (!validateUsername(normalizedUsername).ok) return false;

  const reservationSnap = await getDoc(doc(db, "usernames", normalizedUsername));
  if (reservationSnap.exists()) return true;

  const q = query(collection(db, "users"), where("username", "==", normalizedUsername), limit(1));
  const snap = await getDocs(q);
  return !snap.empty;
}

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
    logger.error(`[Firestore Error] Failed to create profile for UID: ${uid}`, error);
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

export function onProfileChange(
  uid: string,
  callback: (profile: VeloraProfile | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(doc(db, "users", uid).withConverter(profileConverter), (snap) => {
    callback(snap.data() ?? null);
  }, (error) => {
    logger.error(`[Firestore Error] Profile listener failed for UID: ${uid}`, error);
    onError?.(error);
  });
}

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
    logger.error(`[Firestore Error] Failed to update/create profile for UID: ${uid}`, error);
    throw error;
  }
}

export async function uploadAvatar(uid: string, file: File, options?: UploadOptions): Promise<string> {
  try {
    const profile = await getProfile(uid);
    const oldAvatarUrl = profile?.avatarUrl;

    const url = await uploadAvatarImage(uid, file, options);
    await updateProfile(uid, { avatarUrl: url });

    if (oldAvatarUrl) {
      deleteImageFromCloudinary(oldAvatarUrl).catch((err) =>
        logger.warn("[Cloudinary Delete] Failed to clean up old avatar:", err)
      );
    }

    return url;
  } catch (error) {
    logger.error("[Upload:avatar] pipeline failed", error);
    throw error;
  }
}

export async function uploadCover(uid: string, file: File, options?: UploadOptions): Promise<string> {
  try {
    const profile = await getProfile(uid);
    const oldCoverUrl = profile?.coverUrl;

    const url = await uploadCoverImage(uid, file, options);
    await updateProfile(uid, { coverUrl: url });

    if (oldCoverUrl) {
      deleteImageFromCloudinary(oldCoverUrl).catch((err) =>
        logger.warn("[Cloudinary Delete] Failed to clean up old cover:", err)
      );
    }

    return url;
  } catch (error) {
    logger.error("[Upload:cover] pipeline failed", error);
    throw error;
  }
}

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
  
  snap.forEach((docSnap) => {
    const profile = normalizeProfile(docSnap.id, docSnap.data());
    if (
      docSnap.id !== currentUserId &&
      profile.ghostMode !== true &&
      profile.isVisible !== false &&
      users.length < pageSize
    ) {
      users.push(profile);
    }
  });

  return {
    users,
    lastDoc: snap.docs[snap.docs.length - 1] || null,
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

    snap.forEach((docSnap) => {
      const profile = normalizeProfile(docSnap.id, docSnap.data());
      if (
        docSnap.id !== currentUserId &&
        profile.ghostMode !== true &&
        profile.isVisible !== false &&
        users.length < pageSize
      ) {
        users.push(profile);
      }
    });

    callback(users);
  }, (error) => {
    logger.error(`[Firestore Error] Discover listener failed for UID: ${currentUserId}`, error);
    onError?.(error);
  });
}
