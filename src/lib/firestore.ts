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
  writeBatch,
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
import {
  uploadImageToCloudinary,
  deleteImageFromCloudinary,
  validateImageFile,
} from "./cloudinary";
import { db, auth } from "./firebase";
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
  ConnectionType,
  ConnectionMethod,
  DailyStats,
  ActivityItem,
  ContactRequest,
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

type UploadKind = "avatar" | "cover" | "portfolio";
type UploadStage =
  | "image-picker"
  | "auth-state"
  | "auth-token-refresh"
  | "image-decode"
  | "canvas-compression"
  | "blob-conversion"
  | "storage-path"
  | "firebase-storage-upload"
  | "firebase-storage-upload-retry"
  | "download-url"
  | "firestore-profile-update";

export type UploadProgressStage =
  | "validating"
  | "authenticating"
  | "compressing"
  | "uploading"
  | "updating-profile"
  | "complete";

export interface UploadProgress {
  stage: UploadProgressStage;
  percent: number;
  bytesTransferred?: number;
  totalBytes?: number;
}

export interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  timeoutMs?: number;
}

interface UploadConfig {
  kind: UploadKind;
  folder: "avatars" | "covers" | "portfolio";
  maxWidth: number;
  maxSourceBytes: number;
  maxUploadedBytes: number;
}

interface UploadContext {
  kind: UploadKind;
  uid: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  path?: string;
}

const UPLOAD_CONFIG: Record<UploadKind, UploadConfig> = {
  avatar: {
    kind: "avatar",
    folder: "avatars",
    maxWidth: 600,
    maxSourceBytes: 15 * 1024 * 1024,
    maxUploadedBytes: 5 * 1024 * 1024,
  },
  cover: {
    kind: "cover",
    folder: "covers",
    maxWidth: 1600,
    maxSourceBytes: 20 * 1024 * 1024,
    maxUploadedBytes: 10 * 1024 * 1024,
  },
  portfolio: {
    kind: "portfolio",
    folder: "portfolio",
    maxWidth: 1200,
    maxSourceBytes: 20 * 1024 * 1024,
    maxUploadedBytes: 10 * 1024 * 1024,
  },
};

const SUPPORTED_UPLOAD_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);


export class UploadPipelineError extends Error {
  code?: string;
  stage?: UploadStage;

  constructor(message: string, options?: { code?: string; stage?: UploadStage; cause?: unknown }) {
    super(message);
    this.name = "UploadPipelineError";
    this.code = options?.code;
    this.stage = options?.stage;
    this.cause = options?.cause;
  }
}

function uploadContext(config: UploadConfig, uid: string, file?: File): UploadContext {
  return {
    kind: config.kind,
    uid,
    fileName: file?.name,
    fileSize: file?.size,
    fileType: file?.type,
  };
}

function logUploadStage(stage: UploadStage, state: "start" | "success" | "failure", context: UploadContext, extra?: Record<string, unknown>) {
  const payload = {
    uid: context.uid,
    kind: context.kind,
    fileName: context.fileName,
    fileSize: context.fileSize,
    fileType: context.fileType,
    path: context.path,
    ...extra,
  };

  if (state === "failure") {
    console.error(`[Upload:${context.kind}] ${stage}:failure`, payload);
    return;
  }

  console.info(`[Upload:${context.kind}] ${stage}:${state}`, payload);
}

async function runUploadStage<T>(
  stage: UploadStage,
  context: UploadContext,
  action: () => Promise<T> | T,
  extra?: Record<string, unknown>
): Promise<T> {
  logUploadStage(stage, "start", context, extra);
  try {
    const result = await action();
    logUploadStage(stage, "success", context, extra);
    return result;
  } catch (error) {
    logUploadStage(stage, "failure", context, {
      ...extra,
      error: describeUploadError(error),
    });
    throw toUploadPipelineError(error, stage, context.kind);
  }
}

function describeUploadError(error: unknown) {
  if (error instanceof UploadPipelineError) {
    return { name: error.name, message: error.message, code: error.code, stage: error.stage };
  }

  if (error instanceof Error) {
    const maybeCode = "code" in error ? String((error as { code?: unknown }).code || "") : "";
    return { name: error.name, message: error.message, code: maybeCode || undefined };
  }

  return { message: String(error) };
}

function toUploadPipelineError(error: unknown, stage: UploadStage, kind: UploadKind): UploadPipelineError {
  if (error instanceof UploadPipelineError) {
    error.stage = error.stage || stage;
    return error;
  }

  if (error && typeof error === "object" && "name" in error && (error as { name?: string }).name === "CloudinaryUploadError") {
    const err = error as { message?: string; code?: string; stage?: string; cause?: unknown };
    return new UploadPipelineError(err.message || "Upload failed", {
      code: err.code || "upload/failed",
      stage: (err.stage as UploadStage) || stage,
      cause: err.cause,
    });
  }

  const code = getFirebaseErrorCode(error);
  const message = getUploadErrorMessage(error, kind);
  return new UploadPipelineError(message, { code, stage, cause: error });
}

function getFirebaseErrorCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === "string" ? code : undefined;
  }
  return undefined;
}

export function getUploadErrorMessage(error: unknown, kind: UploadKind = "avatar"): string {
  if (error instanceof UploadPipelineError) return error.message;

  if (error && typeof error === "object" && "name" in error && (error as { name?: string }).name === "CloudinaryUploadError") {
    return (error as { message?: string }).message || "Upload failed";
  }

  if (error instanceof Error && error.message) return error.message;

  return `${kind[0].toUpperCase()}${kind.slice(1)} upload failed. Please try again.`;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.ceil(bytes / 1024)} KB`;
}

function reportProgress(options: UploadOptions | undefined, progress: UploadProgress) {
  options?.onProgress?.({
    ...progress,
    percent: Math.max(0, Math.min(100, Math.round(progress.percent))),
  });
}

export function validateUploadImageFile(file: File | null | undefined, kind: UploadKind = "avatar"): asserts file is File {
  const config = UPLOAD_CONFIG[kind];

  if (!file) {
    throw new UploadPipelineError("No image was selected. Please choose an image and try again.", {
      code: "upload/no-file",
      stage: "image-picker",
    });
  }

  if (!(file instanceof File)) {
    throw new UploadPipelineError("The selected image could not be read. Please choose it again.", {
      code: "upload/invalid-file",
      stage: "image-picker",
    });
  }

  if (!SUPPORTED_UPLOAD_MIME_TYPES.has(file.type)) {
    throw new UploadPipelineError("Please choose a JPG, PNG, or WebP image.", {
      code: "upload/unsupported-type",
      stage: "image-picker",
    });
  }

  if (file.size <= 0) {
    throw new UploadPipelineError("The selected image is empty. Please choose another image.", {
      code: "upload/empty-file",
      stage: "image-picker",
    });
  }

  if (file.size > config.maxSourceBytes) {
    throw new UploadPipelineError(
      `That image is too large. Please choose an image under ${formatBytes(config.maxSourceBytes)}.`,
      {
        code: "upload/source-too-large",
        stage: "image-picker",
      }
    );
  }
}



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

  const profile = normalizeProfile(asString(data.connectedUserId, id), rawProfile as DocumentData);

  return {
    id,
    profile,
    method: (data.method || "link") as ConnectionMethod,
    userId: asString(data.userId),
    connectedUserId: asString(data.connectedUserId),
    connectionType: data.connectionType as ConnectionType | undefined,
    contextLabel: asString(data.contextLabel, asString(data.locationName)),
    introducedBy: asString(data.introducedBy),
    personalNote: asString(data.personalNote || data.notes),
    notes: asString(data.notes || data.personalNote),
    metAt: dateValueToIso(data.metAt || data.createdAt),
    eventName: asString(data.eventName || data.event),
    locationName: asString(data.locationName),
    followUpSent: asBoolean(data.followUpSent),
    tags: Array.isArray(data.tags) ? data.tags.map(t => String(t)) : [],
    event: asString(data.event),
    favorite: asBoolean(data.favorite || data.isFavorite),
    isFavorite: asBoolean(data.favorite || data.isFavorite),
    lastInteractionAt: data.lastInteractionAt ? dateValueToIso(data.lastInteractionAt) : undefined,
    connectionStrength: asNumber(data.connectionStrength, 50),
    uid: profile.id,
    username: profile.username || "",
    displayName: profile.fullName || "Membre Velora",
    photoURL: profile.avatarUrl || "",
    status: data.status || "accepted",
  };
}

function normalizeNetworkDoc(id: string, data: DocumentData): VeloraConnection {
  const profile = normalizeProfile(data.id || id, data);

  return {
    id,
    profile,
    method: (data.method || "link") as ConnectionMethod,
    userId: asString(data.userId),
    connectedUserId: asString(data.connectedUserId || data.id || id),
    connectionType: undefined,
    contextLabel: "",
    introducedBy: "",
    personalNote: asString(data.personalNote || data.notes),
    notes: asString(data.notes || data.personalNote),
    metAt: dateValueToIso(data.metAt || data.createdAt),
    eventName: "",
    locationName: "",
    followUpSent: asBoolean(data.followUpSent),
    tags: Array.isArray(data.tags) ? data.tags.map(t => String(t)) : [],
    event: "",
    favorite: asBoolean(data.favorite || data.isFavorite),
    isFavorite: asBoolean(data.favorite || data.isFavorite),
    lastInteractionAt: data.lastInteractionAt ? dateValueToIso(data.lastInteractionAt) : undefined,
    connectionStrength: asNumber(data.connectionStrength, 72),
    uid: profile.id,
    username: profile.username || "",
    displayName: profile.fullName || "Membre Velora",
    photoURL: profile.avatarUrl || "",
    status: data.status || "accepted",
  };
}

function normalizeContactRequest(id: string, data: DocumentData): ContactRequest {
  const rawSender =
    typeof data.senderProfile === "object" && data.senderProfile !== null
      ? data.senderProfile
      : {};
  const rawReceiver =
    typeof data.receiverProfile === "object" && data.receiverProfile !== null
      ? data.receiverProfile
      : {};

  return {
    id,
    senderId: asString(data.senderId),
    receiverId: asString(data.receiverId),
    senderProfile: normalizeProfile(asString(data.senderId), rawSender as DocumentData),
    receiverProfile: normalizeProfile(asString(data.receiverId), rawReceiver as DocumentData),
    status: (data.status || "pending") as "pending" | "accepted" | "declined",
    createdAt: dateValueToIso(data.createdAt),
    updatedAt: dateValueToIso(data.updatedAt),
    method: (data.method || "link") as ConnectionMethod,
    event: asString(data.event),
    locationName: asString(data.locationName),
    personalNote: asString(data.personalNote || data.notes),
    tags: Array.isArray(data.tags) ? data.tags.map(t => String(t)) : [],
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



async function uploadImage(uid: string, file: File, kind: UploadKind, options?: UploadOptions): Promise<string> {
  const config = UPLOAD_CONFIG[kind];
  const context = uploadContext(config, uid, file);

  await runUploadStage("image-picker", context, async () => {
    reportProgress(options, { stage: "validating", percent: 1 });
    await validateImageFile(file, kind);
  });

  const url = await runUploadStage("firebase-storage-upload", context, async () => {
    return await uploadImageToCloudinary(uid, file, kind, options);
  });

  return url;
}

/** Upload avatar image without mutating the profile document */
export async function uploadAvatarImage(uid: string, file: File, options?: UploadOptions): Promise<string> {
  return uploadImage(uid, file, "avatar", options);
}

/** Upload avatar to Storage and update profile */
export async function uploadAvatar(uid: string, file: File, options?: UploadOptions): Promise<string> {
  const context = uploadContext(UPLOAD_CONFIG.avatar, uid, file);
  try {
    const profile = await getProfile(uid);
    const oldAvatarUrl = profile?.avatarUrl;

    const url = await uploadAvatarImage(uid, file, options);
    reportProgress(options, { stage: "updating-profile", percent: 98 });
    await runUploadStage("firestore-profile-update", context, () => updateProfile(uid, { avatarUrl: url }));

    if (oldAvatarUrl) {
      deleteImageFromCloudinary(oldAvatarUrl).catch((err) =>
        console.warn("[Cloudinary Delete] Failed to clean up old avatar:", err)
      );
    }

    reportProgress(options, { stage: "complete", percent: 100 });
    return url;
  } catch (error) {
    console.error("[Upload:avatar] pipeline failed", describeUploadError(error));
    throw toUploadPipelineError(error, "firestore-profile-update", "avatar");
  }
}

/** Upload cover/banner image without mutating the profile document */
export async function uploadCoverImage(uid: string, file: File, options?: UploadOptions): Promise<string> {
  return uploadImage(uid, file, "cover", options);
}

/** Upload cover/banner image to Storage and update profile */
export async function uploadCover(uid: string, file: File, options?: UploadOptions): Promise<string> {
  const context = uploadContext(UPLOAD_CONFIG.cover, uid, file);
  try {
    const profile = await getProfile(uid);
    const oldCoverUrl = profile?.coverUrl;

    const url = await uploadCoverImage(uid, file, options);
    reportProgress(options, { stage: "updating-profile", percent: 98 });
    await runUploadStage("firestore-profile-update", context, () => updateProfile(uid, { coverUrl: url }));

    if (oldCoverUrl) {
      deleteImageFromCloudinary(oldCoverUrl).catch((err) =>
        console.warn("[Cloudinary Delete] Failed to clean up old cover:", err)
      );
    }

    reportProgress(options, { stage: "complete", percent: 100 });
    return url;
  } catch (error) {
    console.error("[Upload:cover] pipeline failed", describeUploadError(error));
    throw toUploadPipelineError(error, "firestore-profile-update", "cover");
  }
}

/** Upload portfolio image */
export async function uploadPortfolioImage(uid: string, file: File, options?: UploadOptions): Promise<string> {
  try {
    return await uploadImage(uid, file, "portfolio", options);
  } catch (error) {
    console.error("[Upload:portfolio] pipeline failed", describeUploadError(error));
    throw toUploadPipelineError(error, "firebase-storage-upload", "portfolio");
  }
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
  try {
    const docRef = doc(db, "users", uid, "portfolio", itemId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      const imageUrl = data?.imageUrl;
      if (imageUrl) {
        deleteImageFromCloudinary(imageUrl).catch((err) =>
          console.warn("[Cloudinary Delete] Failed to clean up portfolio image:", err)
        );
      }
    }
  } catch (error) {
    console.error("[Firestore] Failed to get portfolio item for deletion:", error);
  }
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
  const qSub = query(
    collection(db, "users", uid, "network"),
    orderBy("metAt", "desc"),
    limit(50)
  );

  const qLegacy = query(
    collection(db, "connections"),
    where("userId", "==", uid),
    orderBy("metAt", "desc"),
    limit(50)
  );

  let subConnections: VeloraConnection[] = [];
  let legacyConnections: VeloraConnection[] = [];
  // Track which queries have fired at least once so we don't block on a failing query
  let subFired = false;
  let legacyFired = false;

  const triggerCallback = () => {
    const seen = new Set<string>();
    const merged: VeloraConnection[] = [];

    for (const conn of subConnections) {
      if (conn.profile.id && !seen.has(conn.profile.id)) {
        seen.add(conn.profile.id);
        merged.push(conn);
      }
    }
    for (const conn of legacyConnections) {
      if (conn.profile.id && !seen.has(conn.profile.id)) {
        seen.add(conn.profile.id);
        merged.push(conn);
      }
    }

    console.info(
      `[Network] uid=${uid} subDocs=${subConnections.length} legacyDocs=${legacyConnections.length} merged=${merged.length}`
    );
    console.info(
      `[Network:merged] uid=${uid} mergedDocs:`,
      merged.map(c => ({ id: c.id, userId: c.userId, connectedUserId: c.connectedUserId, profileId: c.profile.id }))
    );
    callback(merged);
  };

  const unsubSub = onSnapshot(qSub, (snap) => {
    subFired = true;
    subConnections = snap.docs.map((d) => normalizeNetworkDoc(d.id, d.data()));
    console.info(`[Network:sub] uid=${uid} docs=${snap.docs.length} fromCache=${snap.metadata.fromCache}`);
    triggerCallback();
  }, (error) => {
    subFired = true; // treat error as "fired" so we don't block forever
    console.error(`[Network:sub] Listener failed uid=${uid}`, error);
    // Still call triggerCallback so legacy results render if available
    triggerCallback();
    onError?.(error);
  });

  const unsubLegacy = onSnapshot(qLegacy, (snap) => {
    legacyFired = true;
    legacyConnections = snap.docs.map((d) => normalizeConnection(d.id, d.data()));
    console.info(`[Network:legacy] uid=${uid} docs=${snap.docs.length} fromCache=${snap.metadata.fromCache}`);
    triggerCallback();
  }, (error) => {
    legacyFired = true; // treat error as "fired"
    console.error(`[Network:legacy] Listener failed uid=${uid}`, error);
    // Still surface sub-collection results even if legacy query fails
    triggerCallback();
  });

  // Suppress unused-variable lint warning
  void subFired;
  void legacyFired;

  return () => {
    unsubSub();
    unsubLegacy();
  };
}

export async function addConnectionToNetwork(
  currentUserId: string,
  viewedProfile: VeloraProfile,
  currentUserProfile?: VeloraProfile
): Promise<void> {
  if (currentUserId === viewedProfile.id) {
    throw new Error("Cannot connect to yourself");
  }

  let userProfile = currentUserProfile;
  if (!userProfile) {
    const fetchedProfile = await getProfile(currentUserId);
    if (!fetchedProfile) {
      throw new Error("Current user profile not found");
    }
    userProfile = fetchedProfile;
  }

  const batch = writeBatch(db);

  // Shared profile snapshots (only fields needed for display)
  const receiverSnap = {
    id: viewedProfile.id,
    fullName: viewedProfile.fullName,
    avatarUrl: viewedProfile.avatarUrl || null,
    title: viewedProfile.title || null,
    company: viewedProfile.company || null,
    professionalMode: viewedProfile.professionalMode || "entrepreneur",
    username: viewedProfile.username || "",
  };

  const senderSnap = {
    id: userProfile.id,
    fullName: userProfile.fullName,
    avatarUrl: userProfile.avatarUrl || null,
    title: userProfile.title || null,
    company: userProfile.company || null,
    professionalMode: userProfile.professionalMode || "entrepreneur",
    username: userProfile.username || "",
  };

  // 1. Write bidirectional documents to the top-level `connections` collection
  batch.set(doc(db, "connections", `${currentUserId}_${viewedProfile.id}`), {
    userId: currentUserId,
    connectedUserId: viewedProfile.id,
    status: "accepted",
    connectedProfile: receiverSnap,
    method: "link",
    personalNote: "",
    tags: [],
    event: "",
    locationName: "",
    followUpSent: false,
    metAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    lastInteractionAt: serverTimestamp(),
    connectionType: viewedProfile.professionalMode === "dentist" ? "Dentist" : "Business",
    connectionStrength: 72,
    favorite: false,
  });

  batch.set(doc(db, "connections", `${viewedProfile.id}_${currentUserId}`), {
    userId: viewedProfile.id,
    connectedUserId: currentUserId,
    status: "accepted",
    connectedProfile: senderSnap,
    method: "link",
    personalNote: "",
    tags: [],
    event: "",
    locationName: "",
    followUpSent: false,
    metAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    lastInteractionAt: serverTimestamp(),
    connectionType: userProfile.professionalMode === "dentist" ? "Dentist" : "Business",
    connectionStrength: 72,
    favorite: false,
  });

  // 2. Write bidirectional documents to the subcollection `network`
  batch.set(doc(db, "users", currentUserId, "network", viewedProfile.id), {
    ...receiverSnap,
    userId: currentUserId,
    connectedUserId: viewedProfile.id,
    status: "accepted",
    method: "link",
    personalNote: "",
    tags: [],
    event: "",
    locationName: "",
    followUpSent: false,
    favorite: false,
    metAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    lastInteractionAt: serverTimestamp(),
    connectionStrength: 72,
  });

  batch.set(doc(db, "users", viewedProfile.id, "network", currentUserId), {
    ...senderSnap,
    userId: viewedProfile.id,
    connectedUserId: currentUserId,
    status: "accepted",
    method: "link",
    personalNote: "",
    tags: [],
    event: "",
    locationName: "",
    followUpSent: false,
    favorite: false,
    metAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    lastInteractionAt: serverTimestamp(),
    connectionStrength: 72,
  });

  await batch.commit();

  console.info(
    `[Network:add] ✓ Committed bidirectional connections & network subcollections for currentUserId=${currentUserId} viewedProfileId=${viewedProfile.id}`
  );
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
  if (data.userId === data.connectedUserId) {
    throw new Error("Cannot connect to yourself");
  }
  const connectionId = `${data.userId}_${data.connectedUserId}`;
  await setDoc(doc(db, "connections", connectionId), {
    ...data,
    connectionType: data.connectedProfile.professionalMode === "dentist" ? "Dentist" : "Business",
    followUpSent: false,
    metAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    lastInteractionAt: serverTimestamp(),
    connectionStrength: 68,
    favorite: false,
  }, { merge: false });
  return connectionId;
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

/* ═══════════════════════════════════════════
   NETWORKING & CONTACT SYSTEM
   ═══════════════════════════════════════════ */

export async function getRelationshipStatus(
  currentUserId: string,
  targetUserId: string
): Promise<{
  status: "connected" | "pending_sent" | "pending_received" | "blocked" | "blocked_by" | "none";
  connectionId?: string;
  requestId?: string;
}> {
  if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
    return { status: "none" };
  }

  try {
    // 1. Check if blocked
    const blockRef = doc(db, "blocked_users", `${currentUserId}_${targetUserId}`);
    const blockSnap = await getDoc(blockRef);
    if (blockSnap.exists()) {
      return { status: "blocked" };
    }

    const blockedByRef = doc(db, "blocked_users", `${targetUserId}_${currentUserId}`);
    const blockedBySnap = await getDoc(blockedByRef);
    if (blockedBySnap.exists()) {
      return { status: "blocked_by" };
    }

    // 2. Check if connected (bidirectional connection checking)
    const connQuery = query(
      collection(db, "connections"),
      where("userId", "==", currentUserId),
      where("connectedUserId", "==", targetUserId),
      limit(1)
    );
    const connSnap = await getDocs(connQuery);
    if (!connSnap.empty) {
      return {
        status: "connected",
        connectionId: connSnap.docs[0].id,
      };
    }

    // 3. Check for pending requests
    const reqSentRef = doc(db, "contact_requests", `${currentUserId}_${targetUserId}`);
    const reqSentSnap = await getDoc(reqSentRef);
    if (reqSentSnap.exists() && reqSentSnap.data().status === "pending") {
      return {
        status: "pending_sent",
        requestId: reqSentSnap.id,
      };
    }

    const reqRecvRef = doc(db, "contact_requests", `${targetUserId}_${currentUserId}`);
    const reqRecvSnap = await getDoc(reqRecvRef);
    if (reqRecvSnap.exists() && reqRecvSnap.data().status === "pending") {
      return {
        status: "pending_received",
        requestId: reqRecvSnap.id,
      };
    }

    return { status: "none" };
  } catch (error) {
    console.error("Error in getRelationshipStatus:", error);
    return { status: "none" };
  }
}

export async function sendContactRequest(params: {
  senderId: string;
  receiverId: string;
  senderProfile: VeloraProfile;
  receiverProfile: VeloraProfile;
  method?: ConnectionMethod;
  event?: string;
  locationName?: string;
  personalNote?: string;
  tags?: string[];
}): Promise<void> {
  const {
    senderId,
    receiverId,
    senderProfile,
    receiverProfile,
    method = "link",
    event = "",
    locationName = "",
    personalNote = "",
    tags = [],
  } = params;

  if (!auth.currentUser) {
    throw new Error("Authentication required");
  }
  if (auth.currentUser.uid !== senderId) {
    throw new Error("Unauthorized sender ID");
  }

  if (senderId === receiverId) {
    throw new Error("Cannot connect to yourself");
  }

  const statusCheck = await getRelationshipStatus(senderId, receiverId);
  if (statusCheck.status === "blocked" || statusCheck.status === "blocked_by") {
    throw new Error("Unable to connect due to block status");
  }
  if (statusCheck.status === "connected") {
    throw new Error("Already connected with this user");
  }
  if (statusCheck.status === "pending_sent") {
    throw new Error("Contact request already pending");
  }
  if (statusCheck.status === "pending_received") {
    throw new Error("You have an incoming contact request from this user");
  }
  if (statusCheck.status !== "none") {
    throw new Error(`Cannot send contact request (status: ${statusCheck.status})`);
  }

  const requestRef = doc(db, "contact_requests", `${senderId}_${receiverId}`);
  await setDoc(requestRef, {
    senderId,
    receiverId,
    senderProfile: {
      id: senderProfile.id,
      fullName: senderProfile.fullName,
      avatarUrl: senderProfile.avatarUrl || null,
      title: senderProfile.title || null,
      company: senderProfile.company || null,
      professionalMode: senderProfile.professionalMode || "entrepreneur",
      username: senderProfile.username,
    },
    receiverProfile: {
      id: receiverProfile.id,
      fullName: receiverProfile.fullName,
      avatarUrl: receiverProfile.avatarUrl || null,
      title: receiverProfile.title || null,
      company: receiverProfile.company || null,
      professionalMode: receiverProfile.professionalMode || "entrepreneur",
      username: receiverProfile.username,
    },
    status: "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    method,
    event,
    locationName,
    personalNote,
    tags,
  });

  await addDoc(collection(db, "notifications"), {
    userId: receiverId,
    senderId,
    senderName: senderProfile.fullName,
    senderAvatar: senderProfile.avatarUrl || null,
    type: "contact_request",
    text: `${senderProfile.fullName} souhaite s'ajouter à votre réseau.`,
    read: false,
    createdAt: serverTimestamp(),
  });
}

export async function cancelContactRequest(senderId: string, receiverId: string): Promise<void> {
  const requestRef = doc(db, "contact_requests", `${senderId}_${receiverId}`);
  await deleteDoc(requestRef);
}

export async function acceptContactRequest(
  senderId: string,
  receiverId: string,
  senderProfile: VeloraProfile,
  receiverProfile: VeloraProfile
): Promise<void> {
  const requestRef = doc(db, "contact_requests", `${senderId}_${receiverId}`);
  const requestSnap = await getDoc(requestRef);
  const requestData = requestSnap.exists() ? requestSnap.data() : {};

  const method = (requestData.method as string) || "link";
  const personalNote = (requestData.personalNote as string) || "";
  const tags = Array.isArray(requestData.tags) ? requestData.tags : [];
  const event = (requestData.event as string) || "";
  const locationName = (requestData.locationName as string) || "";

  console.info(
    `[Network:accept] senderId=${senderId} receiverId=${receiverId} method=${method}`
  );

  // 1. Mark the contact request as accepted
  await setDoc(requestRef, { status: "accepted", updatedAt: serverTimestamp() }, { merge: true });

  // Shared profile snapshots (only fields needed for display)
  const receiverSnap = {
    id: receiverProfile.id,
    fullName: receiverProfile.fullName,
    avatarUrl: receiverProfile.avatarUrl || null,
    title: receiverProfile.title || null,
    company: receiverProfile.company || null,
    professionalMode: receiverProfile.professionalMode || "entrepreneur",
    username: receiverProfile.username,
  };
  const senderSnap = {
    id: senderProfile.id,
    fullName: senderProfile.fullName,
    avatarUrl: senderProfile.avatarUrl || null,
    title: senderProfile.title || null,
    company: senderProfile.company || null,
    professionalMode: senderProfile.professionalMode || "entrepreneur",
    username: senderProfile.username,
  };

  // 2. Write bidirectional documents to the top-level `connections` collection
  //    (used by getRelationshipStatus and the legacy listener in onConnectionsChange)
  const batch = writeBatch(db);

  batch.set(doc(db, "connections", `${senderId}_${receiverId}`), {
    userId: senderId,
    connectedUserId: receiverId,
    status: "accepted",
    connectedProfile: receiverSnap,
    method,
    personalNote,
    tags,
    event,
    locationName,
    followUpSent: false,
    metAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    lastInteractionAt: serverTimestamp(),
    connectionType: receiverProfile.professionalMode === "dentist" ? "Dentist" : "Business",
    connectionStrength: 72,
    favorite: false,
  });

  batch.set(doc(db, "connections", `${receiverId}_${senderId}`), {
    userId: receiverId,
    connectedUserId: senderId,
    status: "accepted",
    connectedProfile: senderSnap,
    method,
    personalNote,
    tags,
    event,
    locationName,
    followUpSent: false,
    metAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    lastInteractionAt: serverTimestamp(),
    connectionType: senderProfile.professionalMode === "dentist" ? "Dentist" : "Business",
    connectionStrength: 72,
    favorite: false,
  });

  // 3. *** THE CRITICAL FIX ***
  //    Write into each user's `network` subcollection so onConnectionsChange
  //    (which prioritises users/{uid}/network) returns the connection immediately.
  //    Without this, the sub-collection listener fires with 0 docs while the legacy
  //    query may still be loading — resulting in "0 membres" in Mon Réseau.
  batch.set(doc(db, "users", senderId, "network", receiverId), {
    ...receiverSnap,
    userId: senderId,
    connectedUserId: receiverId,
    status: "accepted",
    method,
    personalNote,
    tags,
    event,
    locationName,
    followUpSent: false,
    favorite: false,
    metAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    lastInteractionAt: serverTimestamp(),
    connectionStrength: 72,
  });

  batch.set(doc(db, "users", receiverId, "network", senderId), {
    ...senderSnap,
    userId: receiverId,
    connectedUserId: senderId,
    status: "accepted",
    method,
    personalNote,
    tags,
    event,
    locationName,
    followUpSent: false,
    favorite: false,
    metAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    lastInteractionAt: serverTimestamp(),
    connectionStrength: 72,
  });

  await batch.commit();

  console.info(
    `[Network:accept] ✓ Committed connections & network subcollections for senderId=${senderId} receiverId=${receiverId}`
  );

  // 4. Notification for the original sender (person whose request was accepted)
  await addDoc(collection(db, "notifications"), {
    userId: senderId,
    senderId: receiverId,
    senderName: receiverProfile.fullName,
    senderAvatar: receiverProfile.avatarUrl || null,
    type: "contact_accepted",
    text: `${receiverProfile.fullName} a accepté votre demande de connexion.`,
    read: false,
    createdAt: serverTimestamp(),
  });
}

export async function declineContactRequest(senderId: string, receiverId: string): Promise<void> {
  const requestRef = doc(db, "contact_requests", `${senderId}_${receiverId}`);
  await deleteDoc(requestRef);
}

export async function removeConnection(currentUserId: string, targetUserId: string): Promise<void> {
  const q1 = query(
    collection(db, "connections"),
    where("userId", "==", currentUserId),
    where("connectedUserId", "==", targetUserId)
  );
  const q2 = query(
    collection(db, "connections"),
    where("userId", "==", targetUserId),
    where("connectedUserId", "==", currentUserId)
  );

  const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
  const deletePromises: Promise<void>[] = [];

  snap1.forEach((doc) => deletePromises.push(deleteDoc(doc.ref)));
  snap2.forEach((doc) => deletePromises.push(deleteDoc(doc.ref)));

  const req1Ref = doc(db, "contact_requests", `${currentUserId}_${targetUserId}`);
  const req2Ref = doc(db, "contact_requests", `${targetUserId}_${currentUserId}`);
  deletePromises.push(deleteDoc(req1Ref));
  deletePromises.push(deleteDoc(req2Ref));

  // Also delete from sub-collections
  deletePromises.push(deleteDoc(doc(db, "users", currentUserId, "network", targetUserId)));
  deletePromises.push(deleteDoc(doc(db, "users", targetUserId, "network", currentUserId)));

  await Promise.all(deletePromises);
}

export async function updateConnectionNotesAndTags(
  currentUserId: string,
  targetUserId: string,
  notes: string,
  tags: string[]
): Promise<void> {
  const q = query(
    collection(db, "connections"),
    where("userId", "==", currentUserId),
    where("connectedUserId", "==", targetUserId),
    limit(1)
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    await updateDoc(snap.docs[0].ref, {
      personalNote: notes,
      tags: tags,
    });
  }

  // Also update the sub-collection document if it exists
  const subDocRef = doc(db, "users", currentUserId, "network", targetUserId);
  const subDocSnap = await getDoc(subDocRef);
  if (subDocSnap.exists()) {
    await updateDoc(subDocRef, {
      personalNote: notes,
      tags: tags,
    });
  }
}

export async function updateConnectionFavorite(
  currentUserId: string,
  targetUserId: string,
  favorite: boolean
): Promise<void> {
  const q = query(
    collection(db, "connections"),
    where("userId", "==", currentUserId),
    where("connectedUserId", "==", targetUserId),
    limit(1)
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    await updateDoc(snap.docs[0].ref, {
      favorite,
      isFavorite: favorite,
      lastInteractionAt: serverTimestamp(),
    });
  }

  // Also update the sub-collection document if it exists
  const subDocRef = doc(db, "users", currentUserId, "network", targetUserId);
  const subDocSnap = await getDoc(subDocRef);
  if (subDocSnap.exists()) {
    await updateDoc(subDocRef, {
      favorite,
      isFavorite: favorite,
      lastInteractionAt: serverTimestamp(),
    });
  }
}

export async function blockUser(userId: string, blockedUserId: string): Promise<void> {
  const blockRef = doc(db, "blocked_users", `${userId}_${blockedUserId}`);
  await setDoc(blockRef, {
    userId,
    blockedUserId,
    createdAt: serverTimestamp(),
  });

  await removeConnection(userId, blockedUserId);
}

export async function unblockUser(userId: string, blockedUserId: string): Promise<void> {
  const blockRef = doc(db, "blocked_users", `${userId}_${blockedUserId}`);
  await deleteDoc(blockRef);
}

export function onNotificationsChange(
  userId: string,
  callback: (notifications: Array<{ id: string } & DocumentData>) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(50)
  );

  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(list);
  }, (error) => {
    console.error(`[Firestore Error] Notifications listener failed for: ${userId}`, error);
    onError?.(error);
  });
}

export function onPendingRequestsChange(
  userId: string,
  type: "incoming" | "outgoing",
  callback: (requests: ContactRequest[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const fieldName = type === "incoming" ? "receiverId" : "senderId";
  const q = query(
    collection(db, "contact_requests"),
    where(fieldName, "==", userId),
    where("status", "==", "pending")
  );

  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((doc) => normalizeContactRequest(doc.id, doc.data()));
    callback(list);
  }, (error) => {
    console.error(`[Firestore Error] Pending requests listener failed for: ${userId}`, error);
    onError?.(error);
  });
}

export async function getMutualConnections(userId1: string, userId2: string): Promise<string[]> {
  if (!userId1 || !userId2) return [];
  try {
    const q1 = query(collection(db, "connections"), where("userId", "==", userId1));
    const q2 = query(collection(db, "connections"), where("userId", "==", userId2));

    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    const set1 = new Set(snap1.docs.map((d) => d.data().connectedUserId));
    const set2 = new Set(snap2.docs.map((d) => d.data().connectedUserId));

    return Array.from(set1).filter((uid) => set2.has(uid)) as string[];
  } catch (err) {
    console.error("Error in getMutualConnections:", err);
    return [];
  }
}
