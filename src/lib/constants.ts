/* ═══════════════════════════════════════════════════
   VELORA — Constants & Mock Data
   Phase 1: All data is local. Supabase in Phase 2.
   ═══════════════════════════════════════════════════ */

import type {
  VeloraProfile,
  PortfolioItem,
  ExperienceEntry,
  VeloraConnection,
  ActivityItem,
  DailyStats,
  SocialLink,
} from "@/types";

/* ── Motion Constants ── */
export const MOTION = {
  ease: [0.16, 1, 0.3, 1] as const,
  easeInOut: [0.4, 0, 0.2, 1] as const,
  duration: {
    fast: 0.15,
    base: 0.3,
    slow: 0.5,
    entrance: 0.7,
  },
  stagger: 0.06,
} as const;

/* ── Current User Profile ── */
export const MOCK_USER: VeloraProfile = {
  id: "usr_001",
  username: "youssef",
  fullName: "Youssef El Amrani",
  title: "Founder & Creative Director",
  company: "VELORA Studios",
  location: "Casablanca, Morocco",
  bio: "Building luxury brand experiences across MENA. Bridging Moroccan creativity with global business culture.",
  avatarUrl: "/avatar.png",
  phone: "+212 6XX XXX XXX",
  email: "youssef@velora.app",
  website: "velora.app",
  socialLinks: [
    { platform: "LinkedIn", url: "#", color: "#0A66C2", icon: "in" },
    { platform: "Instagram", url: "#", color: "#E4405F", icon: "ig" },
    { platform: "Behance", url: "#", color: "#1769FF", icon: "Be" },
    { platform: "Website", url: "#", color: "#C4A265", icon: "W" },
  ],
  professionalMode: "entrepreneur",
  isVerified: true,
  isPremium: true,
  isNoir: false,
  locale: "fr",
};

/* ── Portfolio ── */
export const MOCK_PORTFOLIO: PortfolioItem[] = [
  {
    id: "p1",
    title: "Luxury Brand Identity",
    category: "Branding",
    imageUrl: "/portfolio-1.png",
  },
  {
    id: "p2",
    title: "Premium App Design",
    category: "UI/UX",
    imageUrl: "/portfolio-2.png",
  },
  {
    id: "p3",
    title: "Corporate Strategy",
    category: "Consulting",
    imageUrl: null as unknown as string,
  },
  {
    id: "p4",
    title: "Event Architecture",
    category: "Events",
    imageUrl: null as unknown as string,
  },
];

/* ── Experience ── */
export const MOCK_EXPERIENCE: ExperienceEntry[] = [
  {
    id: "e1",
    role: "Founder & Creative Director",
    company: "VELORA Studios",
    description: "Leading luxury brand experiences across MENA region",
    startYear: 2024,
    isCurrent: true,
  },
  {
    id: "e2",
    role: "Senior Brand Strategist",
    company: "Ogilvy MENA",
    description: "Directed campaigns for Fortune 500 luxury brands",
    startYear: 2021,
    endYear: 2024,
    isCurrent: false,
  },
  {
    id: "e3",
    role: "Digital Design Lead",
    company: "Razorfish Dubai",
    description: "Pioneered immersive digital experiences for premium clients",
    startYear: 2019,
    endYear: 2021,
    isCurrent: false,
  },
];

/* ── Connections (Scan Memory) ── */
export const MOCK_CONNECTIONS: VeloraConnection[] = [
  {
    id: "c1",
    profile: {
      ...MOCK_USER,
      id: "usr_002",
      fullName: "Amina Benali",
      title: "Creative Director",
      company: "Studio Atlas",
      avatarUrl: "",
    },
    method: "nfc",
    contextLabel: "GITEX Africa Marrakech",
    introducedBy: undefined,
    personalNote: "Interested in luxury branding collaboration",
    metAt: "2025-05-10T14:30:00Z",
    locationName: "Palais des Congrès, Marrakech",
    followUpSent: true,
  },
  {
    id: "c2",
    profile: {
      ...MOCK_USER,
      id: "usr_003",
      fullName: "Karim Ziani",
      title: "Architect",
      company: "ZA Design Lab",
      avatarUrl: "",
    },
    method: "qr",
    contextLabel: "Hive Coworking Casa",
    introducedBy: "Amina Benali",
    personalNote: "Working on a hospitality project in Tangier",
    metAt: "2025-05-08T10:15:00Z",
    locationName: "Hive Coworking, Casablanca",
    followUpSent: false,
  },
  {
    id: "c3",
    profile: {
      ...MOCK_USER,
      id: "usr_004",
      fullName: "Fatima Alaoui",
      title: "Marketing Lead",
      company: "Luxe Agency",
      avatarUrl: "",
    },
    method: "whatsapp",
    contextLabel: "Café Hafa networking",
    introducedBy: "Karim Ziani",
    personalNote: undefined,
    metAt: "2025-05-05T18:00:00Z",
    locationName: "Café Hafa, Tangier",
    followUpSent: false,
  },
];

/* ── Activity Feed ── */
export const MOCK_ACTIVITY: ActivityItem[] = [
  {
    id: "a1",
    text: "Amina Benali viewed your profile",
    time: "2m",
    icon: "eye",
    type: "view",
  },
  {
    id: "a2",
    text: "New NFC tap at Casablanca Tech",
    time: "15m",
    icon: "nfc",
    type: "nfc",
  },
  {
    id: "a3",
    text: "QR code scanned 3 times today",
    time: "1h",
    icon: "qr",
    type: "qr",
  },
  {
    id: "a4",
    text: "Karim Ziani connected via WhatsApp",
    time: "3h",
    icon: "whatsapp",
    type: "whatsapp",
  },
];

/* ── Today's Stats ── */
export const MOCK_STATS: DailyStats = {
  views: 24,
  taps: 5,
  scans: 12,
  clicks: 8,
};

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
  profileUrl: "velora.app/u/youssef",
  fullProfileUrl: "https://velora.app/u/youssef",
  splashDuration: 2800,
} as const;
