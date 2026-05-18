/* ═══════════════════════════════════════════════════
   VELORA — Core Type Definitions
   ═══════════════════════════════════════════════════ */

import type { Locale } from "@/lib/i18n";

/* ── Professional Modes ── */
export type ProfessionalMode =
  | "entrepreneur"
  | "corporate"
  | "creative"
  | "nightlife"
  | "luxury";

/* ── Connection Methods ── */
export type ConnectionMethod = "nfc" | "qr" | "whatsapp" | "link" | "nearby";

/* ── User Profile ── */
export interface VeloraProfile {
  id: string;
  username: string; // @handle
  fullName: string;
  title: string;
  company?: string;
  location: string;
  bio: string;
  phone?: string; // Legacy optional field
  whatsapp?: string;
  instagram?: string;
  email?: string;
  website?: string;
  avatarUrl: string;
  coverUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  socialLinks: SocialLink[];
  professionalMode: ProfessionalMode;
  isVerified: boolean;
  isPremium: boolean;
  isNoir: boolean;
  locale: "fr" | "en" | "ar";
}

/* ── Social Link ── */
export interface SocialLink {
  platform: string;
  url: string;
  color: string;
  icon: string;
}

/* ── Portfolio Item ── */
export interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  description?: string;
  imageUrl?: string;
  link?: string;
}

/* ── Experience Entry ── */
export interface ExperienceEntry {
  id: string;
  role: string;
  company: string;
  description?: string;
  startYear: number;
  endYear?: number;
  isCurrent: boolean;
}

/* ── Connection (Scan Memory) ── */
export interface VeloraConnection {
  id: string;
  profile: VeloraProfile;
  method: ConnectionMethod;
  contextLabel?: string;
  introducedBy?: string;
  personalNote?: string;
  metAt: string;
  locationName?: string;
  followUpSent: boolean;
}

/* ── Scan Event ── */
export interface ScanEvent {
  id: string;
  method: ConnectionMethod;
  scannedBy?: string;
  timestamp: string;
}

/* ── Activity Feed Item ── */
export interface ActivityItem {
  id: string;
  text: string;
  time: string;
  icon: string;
  type: "view" | "nfc" | "qr" | "connect" | "whatsapp";
}

/* ── Stats ── */
export interface DailyStats {
  views: number;
  taps: number;
  scans: number;
  clicks: number;
}

/* ── App State ── */
export type AppPhase = "splash" | "onboarding" | "app";
export type AppTab = "home" | "identity" | "share" | "discover" | "insights";

/* ── Motion Variants ── */
export interface MotionConfig {
  duration: number;
  delay?: number;
  ease: number[];
}

/* ── Onboarding Slide ── */
export interface OnboardingSlide {
  icon: string;
  titleKey: string;
  subtitleKey: string;
  descriptionKey: string;
  gradient: string;
}
