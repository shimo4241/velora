import { logger } from "@/lib/logger";
import {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  type DocumentData,
  type Unsubscribe,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  uploadImageToCloudinary,
  deleteImageFromCloudinary,
  validateImageFile,
  CloudinaryUploadError,
} from "@/lib/cloudinary";
import type { PortfolioItem, ExperienceEntry } from "@/types";

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
    logger.error(`[Upload:${context.kind}] ${stage}:failure`, payload);
    return;
  }

  logger.info(`[Upload:${context.kind}] ${stage}:${state}`, payload);
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

  if (error instanceof CloudinaryUploadError) {
    return new UploadPipelineError(error.message || "Upload failed", {
      code: error.code || "upload/failed",
      stage: (error.stage as UploadStage) || stage,
      cause: error.cause,
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

  if (error instanceof CloudinaryUploadError) {
    return error.message || "Upload failed";
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

function asNumber(value: unknown, fallback?: number): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asBoolean(value: unknown): boolean {
  return Boolean(value);
}

export function normalizePortfolioItem(id: string, data: DocumentData): PortfolioItem {
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

export function normalizeExperienceEntry(id: string, data: DocumentData): ExperienceEntry {
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

export const portfolioItemConverter: FirestoreDataConverter<PortfolioItem> = {
  toFirestore(item: PortfolioItem): DocumentData {
    return item;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): PortfolioItem {
    return normalizePortfolioItem(snapshot.id, snapshot.data(options || {}));
  },
};

export const experienceEntryConverter: FirestoreDataConverter<ExperienceEntry> = {
  toFirestore(entry: ExperienceEntry): DocumentData {
    return entry;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): ExperienceEntry {
    return normalizeExperienceEntry(snapshot.id, snapshot.data(options || {}));
  },
};

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

export async function uploadAvatarImage(uid: string, file: File, options?: UploadOptions): Promise<string> {
  return uploadImage(uid, file, "avatar", options);
}

export async function uploadCoverImage(uid: string, file: File, options?: UploadOptions): Promise<string> {
  return uploadImage(uid, file, "cover", options);
}

export async function uploadPortfolioImage(uid: string, file: File, options?: UploadOptions): Promise<string> {
  try {
    return await uploadImage(uid, file, "portfolio", options);
  } catch (error) {
    logger.error("[Upload:portfolio] pipeline failed", describeUploadError(error));
    throw toUploadPipelineError(error, "firebase-storage-upload", "portfolio");
  }
}

export async function getPortfolio(uid: string): Promise<PortfolioItem[]> {
  const q = query(collection(db, "users", uid, "portfolio").withConverter(portfolioItemConverter), orderBy("order", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data());
}

export function onPortfolioChange(
  uid: string,
  callback: (items: PortfolioItem[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(collection(db, "users", uid, "portfolio").withConverter(portfolioItemConverter), orderBy("order", "asc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => d.data()));
  }, (error) => {
    logger.error(`[Firestore Error] Portfolio listener failed for UID: ${uid}`, error);
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
          logger.warn("[Cloudinary Delete] Failed to clean up portfolio image:", err)
        );
      }
    }
  } catch (error) {
    logger.error("[Firestore] Failed to get portfolio item for deletion:", error);
  }
  await deleteDoc(doc(db, "users", uid, "portfolio", itemId));
}

export async function getExperience(uid: string): Promise<ExperienceEntry[]> {
  const q = query(collection(db, "users", uid, "experience").withConverter(experienceEntryConverter), orderBy("startYear", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data());
}

export function onExperienceChange(
  uid: string,
  callback: (entries: ExperienceEntry[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(collection(db, "users", uid, "experience").withConverter(experienceEntryConverter), orderBy("startYear", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => d.data()));
  }, (error) => {
    logger.error(`[Firestore Error] Experience listener failed for UID: ${uid}`, error);
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
