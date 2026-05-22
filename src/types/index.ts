/* ═══════════════════════════════════════════════════
   VELORA — Core Type Definitions
   ═══════════════════════════════════════════════════ */


/* ── Professional Modes ── */
export type ProfessionalMode =
  | "entrepreneur"
  | "corporate"
  | "creative"
  | "nightlife"
  | "luxury"
  | "dentist"
  | "creator"
  | "artist"
  | "business"
  | "vip";

/* ── User Roles ── */
export type VeloraRole = "free" | "premium" | "verified" | "business";

export type AvailabilityStatus = "available" | "busy" | "offline";

export type ProfileThemePalette = "noir" | "gold" | "emerald" | "violet";

export interface ProfileTheme {
  palette: ProfileThemePalette;
  accentLabel?: string;
}

export interface ProfileService {
  id: string;
  title: string;
  description?: string;
  price?: string;
}

export interface ContactActionSettings {
  whatsapp: boolean;
  email: boolean;
  phone: boolean;
  website: boolean;
  bookingUrl?: string;
  primary: "whatsapp" | "email" | "phone" | "website" | "booking";
}

/* -- Onboarding State -- */
export interface VeloraOnboardingState {
  profileSetupComplete: boolean;
  productTourComplete: boolean;
  initializedAt?: string;
  updatedAt?: string;
}

/* ── Geolocation ── */
export interface UserLocation {
  lat: number;
  lng: number;
  lastActive: string;
  accuracy?: number;
}

export interface PublicCoarseLocation {
  lat: number;
  lng: number;
  lastActive: string;
}

/* ── Connection Methods ── */
export type ConnectionMethod = "nfc" | "qr" | "whatsapp" | "link" | "nearby";
export type ConnectionType = "Business" | "Dentist" | "Client" | "VIP" | "Friend" | "Partner";

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
  photoURL?: string; // Firebase Auth fallback avatar
  industry?: string; // User's industry sector
  coverUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  skills: string[];
  services: ProfileService[];
  availabilityStatus: AvailabilityStatus;
  profileTheme: ProfileTheme;
  contactActions: ContactActionSettings;
  socialLinks: SocialLink[];
  professionalMode: ProfessionalMode;
  role?: VeloraRole;
  isVerified: boolean;
  isPremium: boolean;
  isNoir: boolean;
  isDemo?: boolean;
  locale: "fr" | "en" | "ar" | "es";
  onboarding?: VeloraOnboardingState;

  // Professional / Dentist Specific Fields
  specialty?: string;
  clinicName?: string;
  orderNumber?: string;
  fixedPhone?: string;
  googleMapsLink?: string;
  googleReviewsLink?: string;
  appointmentLink?: string;
  clinicAddress?: string;
  workHours?: string;
  emergencyContact?: string;
  emergencyAvailable?: boolean;
  yearsOfExperience?: number;
  languagesSpoken?: string[];
  clinicGallery?: string[];
  beforeAfterGallery?: string[];

  // Geolocation
  location_geo?: UserLocation;
  location_geo_coarse?: PublicCoarseLocation | null;
  locationSharing?: boolean;

  // App Settings
  settings?: {
    notifications?: {
      push?: boolean;
      email?: boolean;
      connectionAlerts?: boolean;
    };
    privacy?: {
      isPrivate?: boolean;
      allowIndexing?: boolean;
      showEmail?: boolean;
      shareLocation?: boolean;
    };
  };
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
  order?: number;
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
  order?: number;
}

export interface VeloraConnection {
  id: string;
  profile: VeloraProfile;
  method: ConnectionMethod;
  userId?: string;
  connectedUserId?: string;
  connectionType?: ConnectionType;
  contextLabel?: string;
  introducedBy?: string;
  personalNote?: string;
  notes?: string;
  metAt: string;
  eventName?: string;
  locationName?: string;
  followUpSent: boolean;
  tags?: string[];
  event?: string;
  isFavorite?: boolean;
  favorite?: boolean;
  lastInteractionAt?: string;
  connectionStrength?: number;
  mutualConnections?: number;
  distance?: number; // computed at runtime, not persisted
  uid?: string;
  username?: string;
  displayName?: string;
  photoURL?: string;
  status?: string;
}

/* ── Contact Request ── */
export interface ContactRequest {
  id: string;
  senderId: string;
  receiverId: string;
  senderProfile: Partial<VeloraProfile>;
  receiverProfile: Partial<VeloraProfile>;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
  updatedAt: string;
  method?: ConnectionMethod;
  event?: string;
  locationName?: string;
  personalNote?: string;
  tags?: string[];
}

/* ── Blocked User ── */
export interface BlockedUser {
  id: string;
  userId: string;
  blockedUserId: string;
  createdAt: string;
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
export type AppTab = "home" | "identity" | "share" | "discover" | "agenda";

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

/* ═══════════════════════════════════════════════════
   VELORA — Events / Agenda System
   ═══════════════════════════════════════════════════ */

/* ── Event Categories ── */
export type EventCategory =
  | "festival"
  | "congress"
  | "exposition"
  | "networking"
  | "startup"
  | "portes-ouvertes"
  | "concert"
  | "business-summit"
  | "tech-conference"
  | "art-fashion"
  | "medical-dental"
  | "nightlife-vip";

/* ── Event Status ── */
export type EventStatus = "upcoming" | "live" | "starting-soon" | "sold-out" | "ended";

/* ── Event Speaker ── */
export interface EventSpeaker {
  name: string;
  title: string;
  avatarUrl?: string;
}

/* ── Event ── */
export interface VeloraEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  imageUrl: string;
  galleryUrls: string[];
  date: string;
  endDate?: string;
  city: string;
  venue: string;
  lat: number;
  lng: number;
  organizer: string;
  organizerAvatarUrl?: string;
  speakers: EventSpeaker[];
  status: EventStatus;
  capacity?: number;
  attendeesCount: number;
  interestedCount: number;
  isFeatured: boolean;
  isSponsored: boolean;
  tags: string[];
  ticketUrl?: string;
  price?: string;
  mapsUrl?: string;
  createdAt: string;
  updatedAt: string;
  isApproved: boolean;
  moderationNote?: string;
  /** Computed at runtime — not stored in Firestore */
  distance?: number;
}

/* ── Event Attendee ── */
export interface EventAttendee {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userAvatarUrl: string;
  userTitle: string;
  professionalMode: ProfessionalMode;
  status: "going" | "interested";
  checkedIn: boolean;
  checkedInAt?: string;
  createdAt: string;
  userUsername?: string;
}

/* ── Event Check-in ── */
export interface EventCheckin {
  id: string;
  eventId: string;
  userId: string;
  method: "qr" | "nfc" | "manual";
  timestamp: string;
}

/* ── Agenda Filter Tabs ── */
export type AgendaFilter = "today" | "this-week" | "this-month" | "nearby" | "trending";
