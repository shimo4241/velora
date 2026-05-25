"use client";

import { type ReactNode } from "react";
import { m, type Easing } from "framer-motion";
import {
  CalendarDays,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  type LucideIcon,
} from "lucide-react";
import type { VeloraProfile, ProfessionalMode } from "@/types";

export type CssVarStyle = React.CSSProperties & Record<`--${string}`, string>;

export type IdentityTheme = {
  label: string;
  accent: string;
  accentRgb: string;
  secondary: string;
  secondaryRgb: string;
  muted: string;
  heroGradient: string;
  atmosphere: string;
  badge: string;
  qrForeground: string;
};

export type ContactAction = {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  priority: number;
};

export type RelationshipStatus = {
  status: "connected" | "pending_sent" | "pending_received" | "blocked" | "blocked_by" | "none";
  connectionId?: string;
  requestId?: string;
};

export type RelationshipSnapshot = {
  id: string;
  status?: string;
  personalNote?: string;
  notes?: string;
  tags?: string[];
  locationName?: string;
  event?: string;
  eventName?: string;
} | null;

export const LUXURY_EASE: Easing = [0.16, 1, 0.3, 1];

export const MODE_THEMES: Record<ProfessionalMode, IdentityTheme> = {
  entrepreneur: {
    label: "Entrepreneur",
    accent: "#d8b56d",
    accentRgb: "216,181,109",
    secondary: "#fff1c2",
    secondaryRgb: "255,241,194",
    muted: "#9d8460",
    heroGradient:
      "radial-gradient(circle at 50% 22%, rgba(216,181,109,0.26), transparent 32%), linear-gradient(142deg, #030302 0%, #15100a 34%, #050504 72%, #000 100%)",
    atmosphere:
      "radial-gradient(circle, rgba(216,181,109,0.32) 0%, rgba(216,181,109,0.12) 38%, transparent 70%)",
    badge: "Gold Luxury",
    qrForeground: "#12100b",
  },
  creative: {
    label: "Creative",
    accent: "#79f4ff",
    accentRgb: "121,244,255",
    secondary: "#ff66d8",
    secondaryRgb: "255,102,216",
    muted: "#7aa4ad",
    heroGradient:
      "radial-gradient(circle at 58% 18%, rgba(121,244,255,0.18), transparent 31%), radial-gradient(circle at 24% 34%, rgba(255,102,216,0.13), transparent 28%), linear-gradient(145deg, #020304 0%, #071016 42%, #050407 100%)",
    atmosphere:
      "radial-gradient(circle, rgba(121,244,255,0.28) 0%, rgba(255,102,216,0.11) 42%, transparent 72%)",
    badge: "Neon Futuristic",
    qrForeground: "#061115",
  },
  corporate: {
    label: "Corporate",
    accent: "#d8dde3",
    accentRgb: "216,221,227",
    secondary: "#8d98a6",
    secondaryRgb: "141,152,166",
    muted: "#868d95",
    heroGradient:
      "radial-gradient(circle at 50% 18%, rgba(216,221,227,0.16), transparent 34%), linear-gradient(145deg, #020203 0%, #111316 38%, #050506 100%)",
    atmosphere:
      "radial-gradient(circle, rgba(216,221,227,0.22) 0%, rgba(141,152,166,0.11) 38%, transparent 72%)",
    badge: "Dark Silver",
    qrForeground: "#0b0d10",
  },
  nightlife: {
    label: "Nightlife",
    accent: "#79f4ff",
    accentRgb: "121,244,255",
    secondary: "#ff66d8",
    secondaryRgb: "255,102,216",
    muted: "#8d7aaa",
    heroGradient:
      "radial-gradient(circle at 58% 18%, rgba(121,244,255,0.16), transparent 30%), radial-gradient(circle at 24% 34%, rgba(255,102,216,0.16), transparent 28%), linear-gradient(145deg, #030205 0%, #0d0614 48%, #030304 100%)",
    atmosphere:
      "radial-gradient(circle, rgba(121,244,255,0.22) 0%, rgba(255,102,216,0.15) 42%, transparent 72%)",
    badge: "Neon Futuristic",
    qrForeground: "#080713",
  },
  luxury: {
    label: "Luxury",
    accent: "#d8b56d",
    accentRgb: "216,181,109",
    secondary: "#fff1c2",
    secondaryRgb: "255,241,194",
    muted: "#9d8460",
    heroGradient:
      "radial-gradient(circle at 50% 22%, rgba(216,181,109,0.24), transparent 34%), linear-gradient(142deg, #030302 0%, #171008 36%, #060505 100%)",
    atmosphere:
      "radial-gradient(circle, rgba(216,181,109,0.3) 0%, rgba(216,181,109,0.12) 38%, transparent 70%)",
    badge: "Gold Luxury",
    qrForeground: "#12100b",
  },
  dentist: {
    label: "Dentist",
    accent: "#b89f5d",
    accentRgb: "184,159,93",
    secondary: "#9ab8c7",
    secondaryRgb: "154,184,199",
    muted: "#7ba0b2",
    heroGradient:
      "radial-gradient(circle at 50% 22%, rgba(154,184,199,0.22), transparent 35%), linear-gradient(142deg, #0b0f12 0%, #151e24 40%, #080b0d 100%)",
    atmosphere:
      "radial-gradient(circle, rgba(154,184,199,0.3) 0%, rgba(184,159,93,0.12) 38%, transparent 70%)",
    badge: "Dentiste Vérifié",
    qrForeground: "#0a0f12",
  },
  creator: {
    label: "Creator",
    accent: "#ff6b6b",
    accentRgb: "255,107,107",
    secondary: "#a78bfa",
    secondaryRgb: "167,139,250",
    muted: "#cbd5e1",
    heroGradient:
      "radial-gradient(circle at 58% 18%, rgba(255,107,107,0.18), transparent 31%), radial-gradient(circle at 24% 34%, rgba(167,139,250,0.13), transparent 28%), linear-gradient(145deg, #030108 0%, #0f0b1a 45%, #050407 100%)",
    atmosphere:
      "radial-gradient(circle, rgba(255,107,107,0.25) 0%, rgba(167,139,250,0.15) 42%, transparent 72%)",
    badge: "Verified Creator",
    qrForeground: "#0a0714",
  },
  artist: {
    label: "Artist",
    accent: "#f472b6",
    accentRgb: "244,114,182",
    secondary: "#fbbf24",
    secondaryRgb: "251,191,36",
    muted: "#f43f5e",
    heroGradient:
      "radial-gradient(circle at 50% 20%, rgba(244,114,182,0.2), transparent 35%), linear-gradient(142deg, #0a0104 0%, #1c0612 40%, #050102 100%)",
    atmosphere:
      "radial-gradient(circle, rgba(244,114,182,0.25) 0%, rgba(251,191,36,0.12) 40%, transparent 70%)",
    badge: "Verified Artist",
    qrForeground: "#12030a",
  },
  business: {
    label: "Business",
    accent: "#38bdf8",
    accentRgb: "56,189,248",
    secondary: "#0284c7",
    secondaryRgb: "2,132,199",
    muted: "#64748b",
    heroGradient:
      "radial-gradient(circle at 50% 22%, rgba(56,189,248,0.18), transparent 35%), linear-gradient(142deg, #02060c 0%, #08172c 40%, #010204 100%)",
    atmosphere:
      "radial-gradient(circle, rgba(56,189,248,0.22) 0%, rgba(2,132,199,0.12) 38%, transparent 70%)",
    badge: "Verified Business",
    qrForeground: "#020a12",
  },
  vip: {
    label: "VIP",
    accent: "#fbbf24",
    accentRgb: "251,191,36",
    secondary: "#f8fafc",
    secondaryRgb: "248,250,252",
    muted: "#94a3b8",
    heroGradient:
      "radial-gradient(circle at 50% 22%, rgba(251,191,36,0.28), transparent 32%), linear-gradient(142deg, #050505 0%, #151515 40%, #000000 100%)",
    atmosphere:
      "radial-gradient(circle, rgba(251,191,36,0.3) 0%, rgba(248,250,252,0.12) 38%, transparent 70%)",
    badge: "VIP Member",
    qrForeground: "#0e0d0a",
  },
};

export const PROJECT_FALLBACKS = ["/portfolio-1.png", "/portfolio-2.png"];

export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.22 }}
      transition={{ duration: 0.68, delay, ease: LUXURY_EASE }}
    >
      {children}
    </m.div>
  );
}

export function getIdentityTheme(mode?: ProfessionalMode): IdentityTheme {
  if (mode && MODE_THEMES[mode]) return MODE_THEMES[mode];
  return MODE_THEMES.entrepreneur;
}

export function getActiveTheme(profile: VeloraProfile): IdentityTheme {
  const modeTheme = getIdentityTheme(profile.professionalMode);
  if (profile.syncThemeToPublic && profile.visualTheme) {
    const themeId = profile.visualTheme;
    if (themeId === "gold") return MODE_THEMES.entrepreneur;
    if (themeId === "executive") return MODE_THEMES.corporate;
    if (themeId === "neon") return MODE_THEMES.creative;
    if (themeId === "terra") {
      return {
        label: "Terra Elite",
        accent: "#d97706",
        accentRgb: "217,119,6",
        secondary: "#fbbf24",
        secondaryRgb: "251,191,36",
        muted: "#78350f",
        heroGradient:
          "radial-gradient(circle at 50% 22%, rgba(217,119,6,0.24), transparent 34%), linear-gradient(142deg, #030302 0%, #171008 36%, #060505 100%)",
        atmosphere:
          "radial-gradient(circle, rgba(217,119,6,0.3) 0%, rgba(217,119,6,0.12) 38%, transparent 70%)",
        badge: "Terra Elite",
        qrForeground: "#0c0b0a",
      };
    }
    if (themeId === "medical") return MODE_THEMES.dentist;
    if (themeId === "noir") return MODE_THEMES.vip;
  }
  return modeTheme;
}

export function normalizeExternalHref(value?: string) {
  const trimmed = (value || "").trim();
  if (!trimmed) return "";
  if (/^(https?:|mailto:|tel:)/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function getInitials(name?: string) {
  const initials = (name || "V")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  return initials || "V";
}

export function getContactActions(profile: VeloraProfile): ContactAction[] {
  const settings = profile.contactActions;
  const actions: ContactAction[] = [];

  // Special Dentist Mode Action Buttons
  if (profile.professionalMode === "dentist") {
    if (profile.fixedPhone) {
      actions.push({
        key: "call_clinic",
        label: "Call Clinic",
        href: `tel:${profile.fixedPhone.replace(/\s+/g, "")}`,
        icon: Phone,
        priority: 1,
      });
    }
    if (profile.whatsapp) {
      actions.push({
        key: "whatsapp",
        label: "WhatsApp",
        href: `https://wa.me/${profile.whatsapp.replace(/\D/g, "")}`,
        icon: MessageCircle,
        priority: 2,
      });
    }
    if (profile.googleMapsLink) {
      actions.push({
        key: "maps",
        label: "Open Maps",
        href: normalizeExternalHref(profile.googleMapsLink),
        icon: MapPin,
        priority: 3,
      });
    }
    if (profile.appointmentLink) {
      actions.push({
        key: "booking",
        label: "Book Appointment",
        href: normalizeExternalHref(profile.appointmentLink),
        icon: CalendarDays,
        priority: 4,
      });
    }

    if (actions.length > 0) {
      return actions.sort((a, b) => a.priority - b.priority);
    }
  }

  if (settings?.whatsapp !== false && profile.whatsapp) {
    actions.push({
      key: "whatsapp",
      label: "WhatsApp",
      href: `https://wa.me/${profile.whatsapp.replace(/\D/g, "")}`,
      icon: MessageCircle,
      priority: settings?.primary === "whatsapp" ? 0 : 2,
    });
  }

  if (settings?.email !== false && profile.email) {
    actions.push({
      key: "email",
      label: "Email",
      href: `mailto:${profile.email}`,
      icon: Mail,
      priority: settings?.primary === "email" ? 0 : 3,
    });
  }

  if (settings?.phone !== false && (profile.phone || profile.whatsapp)) {
    actions.push({
      key: "phone",
      label: "Call",
      href: `tel:${profile.phone || profile.whatsapp}`,
      icon: Phone,
      priority: settings?.primary === "phone" ? 0 : 4,
    });
  }

  if (settings?.website !== false && profile.website) {
    actions.push({
      key: "website",
      label: "Website",
      href: normalizeExternalHref(profile.website),
      icon: Globe,
      priority: settings?.primary === "website" ? 0 : 5,
    });
  }

  if (settings?.bookingUrl) {
    actions.push({
      key: "booking",
      label: "Booking",
      href: normalizeExternalHref(settings.bookingUrl),
      icon: CalendarDays,
      priority: settings.primary === "booking" ? 0 : 6,
    });
  }

  return actions.sort((a, b) => a.priority - b.priority);
}
