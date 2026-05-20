/* ═══════════════════════════════════════════════════
   VELORA — Cloudinary Client Service
   ═══════════════════════════════════════════════════ */

import { auth } from "./firebase";

export type UploadKind = "avatar" | "cover" | "portfolio";

export type UploadProgressStage =
  | "validating"
  | "authenticating"
  | "compressing"
  | "uploading"
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
  maxRetries?: number;
}

interface UploadConfig {
  kind: UploadKind;
  folder: "avatars" | "covers" | "portfolio";
  maxWidth: number;
  maxSourceBytes: number;
  maxUploadedBytes: number;
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
const CANVAS_TIMEOUT_MS = 15000;
const BLOB_TIMEOUT_MS = 10000;
const DEFAULT_UPLOAD_TIMEOUT_MS = 60000;
const MAX_SOURCE_PIXELS = 20_000_000; // Lower limit for mobile memory safety

export class CloudinaryUploadError extends Error {
  code?: string;
  stage?: UploadProgressStage;

  constructor(message: string, options?: { code?: string; stage?: UploadProgressStage; cause?: unknown }) {
    super(message);
    this.name = "CloudinaryUploadError";
    this.code = options?.code;
    this.stage = options?.stage;
    this.cause = options?.cause;
  }
}

/** Check file signature magic numbers to prevent malicious extension spoofing */
async function validateFileSignature(file: File): Promise<boolean> {
  try {
    const headerBytes = await new Promise<Uint8Array>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result instanceof ArrayBuffer) {
          resolve(new Uint8Array(e.target.result));
        } else {
          reject(new Error("Failed to read header"));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file.slice(0, 12));
    });

    if (headerBytes.length < 4) return false;

    // PNG Magic Number: 89 50 4E 47
    if (headerBytes[0] === 0x89 && headerBytes[1] === 0x50 && headerBytes[2] === 0x4E && headerBytes[3] === 0x47) {
      return file.type === "image/png";
    }

    // JPEG Magic Number: FF D8 FF
    if (headerBytes[0] === 0xFF && headerBytes[1] === 0xD8 && headerBytes[2] === 0xFF) {
      return file.type === "image/jpeg" || file.type === "image/jpg";
    }

    // WebP Magic Number: RIFF (0-3) and WEBP (8-11)
    const isRiff = headerBytes[0] === 0x52 && headerBytes[1] === 0x49 && headerBytes[2] === 0x46 && headerBytes[3] === 0x46;
    if (isRiff && headerBytes.length >= 12) {
      const webpString = String.fromCharCode(headerBytes[8], headerBytes[9], headerBytes[10], headerBytes[11]);
      if (webpString === "WEBP") {
        return file.type === "image/webp";
      }
    }

    return false;
  } catch (error) {
    console.error("[Security] Failed to verify image magic numbers:", error);
    return false;
  }
}

/** Client-side image validation */
export async function validateImageFile(file: File | null | undefined, kind: UploadKind = "avatar"): Promise<void> {
  const config = UPLOAD_CONFIG[kind];

  if (!file) {
    throw new CloudinaryUploadError("No image was selected. Please choose an image and try again.", {
      code: "upload/no-file",
      stage: "validating",
    });
  }

  if (!(file instanceof File)) {
    throw new CloudinaryUploadError("The selected image could not be read. Please choose it again.", {
      code: "upload/invalid-file",
      stage: "validating",
    });
  }

  // Validate extension
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension || !["jpg", "jpeg", "png", "webp"].includes(extension)) {
    throw new CloudinaryUploadError("Please choose an image file with a .jpg, .png, or .webp extension.", {
      code: "upload/invalid-extension",
      stage: "validating",
    });
  }

  // Validate mime type
  if (!SUPPORTED_UPLOAD_MIME_TYPES.has(file.type)) {
    throw new CloudinaryUploadError("Please choose a JPG, PNG, or WebP image.", {
      code: "upload/unsupported-type",
      stage: "validating",
    });
  }

  if (file.size <= 0) {
    throw new CloudinaryUploadError("The selected image is empty. Please choose another image.", {
      code: "upload/empty-file",
      stage: "validating",
    });
  }

  if (file.size > config.maxSourceBytes) {
    throw new CloudinaryUploadError(
      `That image is too large. Please choose an image under ${formatBytes(config.maxSourceBytes)}.`,
      {
        code: "upload/source-too-large",
        stage: "validating",
      }
    );
  }

  // Verify file signatures to prevent malicious execution
  const isValidSignature = await validateFileSignature(file);
  if (!isValidSignature) {
    throw new CloudinaryUploadError("The file headers do not match a valid image type. The file might be corrupted or renamed maliciously.", {
      code: "upload/invalid-headers",
      stage: "validating",
    });
  }
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

/** Decode image securely with proper timeout and object URL cleanup */
function decodeImage(file: File): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    let settled = false;

    const timeoutId = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(objectUrl);
      reject(
        new CloudinaryUploadError("Image decoding timed out. Please try a smaller JPG, PNG, or WebP image.", {
          code: "upload/image-decode-timeout",
          stage: "compressing",
        })
      );
    }, CANVAS_TIMEOUT_MS);

    const settle = (callback: () => void) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      URL.revokeObjectURL(objectUrl);
      callback();
    };

    img.decoding = "async";
    img.onload = () => {
      settle(() => {
        if (!img.naturalWidth || !img.naturalHeight) {
          reject(
            new CloudinaryUploadError("The selected image has invalid dimensions.", {
              code: "upload/invalid-dimensions",
              stage: "compressing",
            })
          );
          return;
        }

        if (img.naturalWidth * img.naturalHeight > MAX_SOURCE_PIXELS) {
          reject(
            new CloudinaryUploadError("That image is too large to process on this device. Please choose a smaller image.", {
              code: "upload/pixel-count-too-large",
              stage: "compressing",
            })
          );
          return;
        }

        resolve(img);
      });
    };

    img.onerror = () => {
      settle(() => {
        reject(
          new CloudinaryUploadError("This browser could not decode the selected image. Please choose a JPG, PNG, or WebP image.", {
            code: "upload/image-load-error",
            stage: "compressing",
          })
        );
      });
    };
    img.src = objectUrl;
  });
}

/** Convert canvas to blob with robust fallback for Android/Chrome */
function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    let settled = false;

    const settle = (callback: () => void) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      callback();
    };

    const resolveFromDataUrl = () => {
      try {
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        const fallbackBlob = dataUrlToBlob(dataUrl);
        if (!fallbackBlob.size) {
          reject(
            new CloudinaryUploadError("Image compression failed. Please choose another image.", {
              code: "upload/blob-empty",
              stage: "compressing",
            })
          );
          return;
        }
        resolve(fallbackBlob);
      } catch (err) {
        reject(
          new CloudinaryUploadError("Image compression error. Please try a different image.", {
            code: "upload/canvas-to-data-url-failed",
            stage: "compressing",
            cause: err,
          })
        );
      }
    };

    const timeoutId = window.setTimeout(() => {
      settle(() => {
        try {
          resolveFromDataUrl();
        } catch (error) {
          reject(
            new CloudinaryUploadError("Image compression timed out. Please try a smaller image.", {
              code: "upload/blob-timeout",
              stage: "compressing",
              cause: error,
            })
          );
        }
      });
    }, BLOB_TIMEOUT_MS);

    if (typeof canvas.toBlob !== "function") {
      settle(resolveFromDataUrl);
      return;
    }

    canvas.toBlob(
      (blob) => {
        settle(() => {
          if (blob?.size) {
            resolve(blob);
            return;
          }
          try {
            resolveFromDataUrl();
          } catch (error) {
            reject(
              new CloudinaryUploadError("Image compression failed. Please choose another image.", {
                code: "upload/blob-null",
                stage: "compressing",
                cause: error,
              })
            );
          }
        });
      },
      "image/jpeg",
      0.85
    );
  });
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mimeMatch = /data:([^;]+);base64/.exec(header);
  const mimeType = mimeMatch?.[1] || "image/jpeg";
  const binary = atob(base64 || "");
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
}

/** Memory-safe Canvas compression */
async function compressImage(file: File, config: UploadConfig, options?: UploadOptions): Promise<Blob> {
  reportProgress(options, { stage: "compressing", percent: 5 });
  const decodedImage = await decodeImage(file);
  let width = decodedImage.naturalWidth;
  let height = decodedImage.naturalHeight;

  // Limit max dimensions aggressively for mobile memory safety
  const maxDimension = Math.min(config.maxWidth, 2048);
  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.max(1, Math.round((height * maxDimension) / width));
      width = maxDimension;
    } else {
      width = Math.max(1, Math.round((width * maxDimension) / height));
      height = maxDimension;
    }
  }

  // Allocate canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) {
    throw new CloudinaryUploadError("Canvas compression is not supported in this browser.", {
      code: "upload/canvas-unsupported",
      stage: "compressing",
    });
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(decodedImage, 0, 0, width, height);
  reportProgress(options, { stage: "compressing", percent: 20 });

  const blob = await canvasToBlob(canvas);

  // Aggressive memory cleanup: clear canvas refs
  canvas.width = 0;
  canvas.height = 0;

  if (blob.size >= config.maxUploadedBytes) {
    throw new CloudinaryUploadError(
      `The compressed image is still too large. Please choose an image under ${formatBytes(config.maxUploadedBytes)}.`,
      {
        code: "upload/compressed-too-large",
        stage: "compressing",
      }
    );
  }

  reportProgress(options, { stage: "compressing", percent: 30 });
  return blob;
}

/** Sanitize paths/folders to contain only safe alphanumeric and hyphens/underscores/slashes */
function sanitizePathSegment(segment: string): string {
  return segment.replace(/[^a-zA-Z0-9\-_/]/g, "_");
}

/** Performs raw direct upload to Cloudinary using XMLHttpRequest for progress and timeout protection */
function performCloudinaryUpload(
  blob: Blob,
  folder: string,
  options?: UploadOptions
): Promise<{ secure_url: string; delete_token?: string }> {
  return new Promise((resolve, reject) => {
    const rawCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
    const rawPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "velora_unsigned";

    const cloudName = rawCloudName.replace(/['"]/g, "").trim();
    const uploadPreset = rawPreset.replace(/['"]/g, "").trim();

    if (!cloudName || !uploadPreset) {
      reject(
        new CloudinaryUploadError("Cloudinary environment variables are missing. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.", {
          code: "upload/env-missing",
          stage: "uploading",
        })
      );
      return;
    }

    const xhr = new XMLHttpRequest();
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    xhr.open("POST", url, true);

    const timeout = options?.timeoutMs || DEFAULT_UPLOAD_TIMEOUT_MS;
    xhr.timeout = timeout;

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const uploadPercent = (event.loaded / event.total) * 65; // Scale to 30% - 95%
        reportProgress(options, {
          stage: "uploading",
          percent: 30 + uploadPercent,
          bytesTransferred: event.loaded,
          totalBytes: event.total,
        });
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          if (response.secure_url) {
            resolve({
              secure_url: response.secure_url,
              delete_token: response.delete_token,
            });
          } else {
            reject(
              new CloudinaryUploadError("Invalid upload response from Cloudinary", {
                code: "upload/invalid-response",
                stage: "uploading",
              })
            );
          }
        } catch (e) {
          reject(
            new CloudinaryUploadError("Failed to parse Cloudinary response", {
              code: "upload/json-parse-failed",
              stage: "uploading",
              cause: e,
            })
          );
        }
      } else {
        let errMsg = `Cloudinary upload failed with status ${xhr.status}`;
        try {
          const errorResp = JSON.parse(xhr.responseText);
          if (errorResp.error?.message) {
            errMsg = errorResp.error.message;
          }
        } catch {}
        reject(
          new CloudinaryUploadError(errMsg, {
            code: `upload/http-error-${xhr.status}`,
            stage: "uploading",
          })
        );
      }
    };

    xhr.onerror = () => {
      reject(
        new CloudinaryUploadError("Network connection error. Please verify your internet connection.", {
          code: "upload/network-error",
          stage: "uploading",
        })
      );
    };

    xhr.ontimeout = () => {
      reject(
        new CloudinaryUploadError("Image upload timed out. Please try again on a stronger connection.", {
          code: "upload/timeout",
          stage: "uploading",
        })
      );
    };

    const formData = new FormData();
    formData.append("file", blob, "image.jpg");
    formData.append("upload_preset", uploadPreset);
    if (folder) {
      formData.append("folder", folder);
    }

    const keys: string[] = [];
    formData.forEach((_, key) => {
      keys.push(key);
    });
    console.log(`[Cloudinary Direct Upload] URL: ${url}`);
    console.log(`[Cloudinary Direct Upload] FormData keys: ${keys.join(", ")}`);

    xhr.send(formData);
  });
}

/** Upload image to Cloudinary with retry resilience */
export async function uploadImageToCloudinary(
  uid: string,
  file: File,
  kind: UploadKind,
  options?: UploadOptions
): Promise<string> {
  const config = UPLOAD_CONFIG[kind];

  // 1. Validate file
  await validateImageFile(file, kind);

  // 2. Authentication check
  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.uid !== uid) {
    throw new CloudinaryUploadError("Please sign in again before uploading an image.", {
      code: "auth/missing-user",
      stage: "authenticating",
    });
  }
  reportProgress(options, { stage: "authenticating", percent: 3 });

  // 3. Compress image
  const compressedBlob = await compressImage(file, config, options);

  // 4. Sanitize path/folder parameters
  const sanitizedUid = sanitizePathSegment(uid);
  const folder = `velora/${config.folder}/${sanitizedUid}`;

  // 5. Upload with retry resilience
  const maxRetries = options?.maxRetries ?? 2; // 3 total attempts
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await performCloudinaryUpload(compressedBlob, folder, options);
      
      // Cache delete token if returned
      if (result.secure_url && result.delete_token) {
        cacheDeleteToken(result.secure_url, result.delete_token);
      }

      reportProgress(options, { stage: "complete", percent: 100 });
      return result.secure_url;
    } catch (error) {
      lastError = error;
      console.warn(`[Cloudinary Upload] Attempt ${attempt + 1} failed:`, error);
      if (attempt < maxRetries) {
        // Exponential backoff delay
        await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
      }
    }
  }

  throw lastError || new CloudinaryUploadError("Image upload failed after retries.", { stage: "uploading" });
}

/** Cache delete tokens locally for quick 10-minute unauthenticated deletion */
function cacheDeleteToken(url: string, token: string) {
  try {
    const raw = localStorage.getItem("cloudinary_delete_tokens");
    const cache = raw ? JSON.parse(raw) : {};
    cache[url] = { token, timestamp: Date.now() };
    localStorage.setItem("cloudinary_delete_tokens", JSON.stringify(cache));
  } catch (e) {
    console.error("[Cloudinary Cache] Failed to cache delete token:", e);
  }
}

/** Retrieve delete token from cache if not expired (10 mins) */
function getCachedDeleteToken(url: string): string | null {
  try {
    const raw = localStorage.getItem("cloudinary_delete_tokens");
    if (!raw) return null;
    const cache = JSON.parse(raw);
    const item = cache[url];
    if (!item) return null;

    // Check if within 10 minutes (600,000 ms)
    if (Date.now() - item.timestamp < 550000) { // use 9 mins for safety margin
      return item.token;
    }
    return null;
  } catch {
    return null;
  }
}

/** Extract public ID from Cloudinary URL */
export function getPublicIdFromUrl(url: string): string | null {
  if (!url || !url.includes("image/upload/")) return null;
  const match = url.match(/\/image\/upload\/(?:v\d+\/)?([^\s?#]+)$/);
  if (!match) return null;
  const path = match[1];
  const lastDot = path.lastIndexOf(".");
  if (lastDot !== -1) {
    return path.substring(0, lastDot);
  }
  return path;
}

/** Client-side image deletion helper (uses delete token or backend API route) */
export async function deleteImageFromCloudinary(imageUrl: string): Promise<void> {
  if (!imageUrl) return;

  const deleteToken = getCachedDeleteToken(imageUrl);
  if (deleteToken) {
    try {
      const rawCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
      const cloudName = rawCloudName.replace(/['"]/g, "").trim();
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/delete_by_token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: deleteToken }),
      });
      if (response.ok) {
        console.info("[Cloudinary] Successfully deleted image using delete token:", imageUrl);
        return;
      }
    } catch (e) {
      console.warn("[Cloudinary] Client-side delete token deletion failed, falling back to API route:", e);
    }
  }

  // Fallback: Delete via secure Next.js API route
  const publicId = getPublicIdFromUrl(imageUrl);
  if (!publicId) return;

  try {
    const response = await fetch("/api/cloudinary/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicId }),
    });

    if (!response.ok) {
      console.warn("[Cloudinary Delete] Server-side deletion endpoint returned non-OK status:", response.status);
    }
  } catch (error) {
    console.error("[Cloudinary Delete] Failed to call server-side deletion route:", error);
  }
}

/** Generate responsive and optimized Cloudinary URLs */
export function getOptimizedCloudinaryUrl(
  url: string | null | undefined,
  type: "avatar" | "cover" | "portfolio" | "placeholder" | "raw"
): string {
  if (!url) return "";
  if (!url.includes("image/upload/")) return url;

  let transformations = "f_auto,q_auto";

  switch (type) {
    case "avatar":
      transformations += ",w_300,h_300,c_fill,g_face";
      break;
    case "cover":
      transformations += ",w_1200,h_450,c_fill";
      break;
    case "portfolio":
      transformations += ",w_800,c_limit";
      break;
    case "placeholder":
      transformations += ",w_20,c_limit,e_blur:300";
      break;
    case "raw":
    default:
      break;
  }

  // Insert transformations right after 'image/upload/'
  return url.replace("image/upload/", `image/upload/${transformations}/`);
}

/** Simple utility for creating local object URL previews */
export function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

/** Clean up preview URL */
export function revokePreviewUrl(url: string): void {
  if (url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}
