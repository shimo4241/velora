import { Timestamp } from "firebase/firestore";

/* ═══════════════════════════════════════════════════
   VELORA — Firestore Normalization Utilities
   Single source of truth for raw DocumentData coercion.
   Used by all service modules to normalize Firestore data
   into typed domain objects.
   ═══════════════════════════════════════════════════ */

/**
 * Coerces an unknown Firestore field value to a string.
 * Returns `fallback` (default: "") for any non-string value.
 */
export function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

/**
 * Coerces an unknown Firestore field value to a boolean.
 * Uses JavaScript truthiness — `undefined`, `null`, `0`, `""` → false.
 */
export function asBoolean(value: unknown): boolean {
  return Boolean(value);
}

/**
 * Coerces an unknown Firestore field value to a finite number.
 * Returns `fallback` (default: undefined) for non-numeric or infinite values.
 */
export function asNumber(value: unknown, fallback?: number): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/**
 * Coerces an unknown Firestore field value to a typed array.
 * Returns empty array `[]` for any non-array value.
 */
export function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

/**
 * Converts a Firestore timestamp, Date, or ISO string to an ISO-8601 string.
 * Falls back to `new Date().toISOString()` for unrecognized values.
 */
export function dateValueToIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Timestamp) return value.toDate().toISOString();

  // Handle plain Firestore Timestamp-like objects (e.g. from JSON serialization)
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
