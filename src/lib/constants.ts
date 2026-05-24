/* ═══════════════════════════════════════════════════
   VELORA — Constants & Configuration
   ═══════════════════════════════════════════════════ */

/* ── Motion Constants ── */
export const MOTION = {
  ease: [0.16, 1, 0.3, 1] as const,
  easeInOut: [0.4, 0, 0.2, 1] as const,
  duration: {
    fast: 0.15,
    base: 0.24,
    slow: 0.34,
    entrance: 0.42,
  },
  stagger: 0.035,
} as const;

/* ── Professional Modes ── */
export const PROFESSIONAL_MODES = [
  { id: "entrepreneur" as const, labelKey: "Entrepreneur" },
  { id: "corporate" as const, labelKey: "Corporate" },
  { id: "creative" as const, labelKey: "Creative" },
  { id: "nightlife" as const, labelKey: "Nightlife" },
  { id: "luxury" as const, labelKey: "Luxury" },
] as const;

/* ── App Config ── */
export const APP_CONFIG = {
  name: "VELORA",
  tagline: "Your identity, elevated",
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://velora-navy.vercel.app",
  splashDuration: 2800,
} as const;
