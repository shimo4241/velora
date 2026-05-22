"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
  type Easing,
  type PanInfo,
} from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowUpRight,
  Briefcase,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Eye,
  Globe,
  Link2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Play,
  QrCode,
  Shield,
  Sparkles,
  Star,
  Stethoscope,
  X,
  Bookmark,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import { isVideoAsset } from "@/components/profile";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { useTranslation } from "@/lib/i18n";
import { getProfileShortUrl, getProfileUrl } from "@/lib/profileUrls";
import { useAuth } from "@/components/providers/AuthProvider";
import { useProfile } from "@/hooks/useProfile";
import { useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, query, collection, where, limit, type DocumentData } from "firebase/firestore";
import { createVCardFile } from "@/lib/nfc";
import {
  sendContactRequest,
  cancelContactRequest,
  acceptContactRequest,
  declineContactRequest,
  removeConnection,
  updateConnectionNotesAndTags,
  blockUser,
  addConnectionToNetwork,
} from "@/lib/firestore";
import type {
  ExperienceEntry,
  PortfolioItem,
  ProfessionalMode,
  SocialLink,
  VeloraProfile,
} from "@/types";

interface PublicProfileClientProps {
  profile: VeloraProfile;
  portfolio: PortfolioItem[];
  experience: ExperienceEntry[];
}

type CssVarStyle = CSSProperties & Record<`--${string}`, string>;

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

type ContactAction = {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  priority: number;
};

type RelationshipStatus = {
  status: "connected" | "pending_sent" | "pending_received" | "blocked" | "blocked_by" | "none";
  connectionId?: string;
  requestId?: string;
};

type RelationshipSnapshot = ({ id: string } & DocumentData) | null;

export const LUXURY_EASE: Easing = [0.16, 1, 0.3, 1];

const MODE_THEMES: Record<ProfessionalMode, IdentityTheme> = {
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

const PARTICLES = [
  { left: "8%", top: "18%", size: 2, duration: 8.8, delay: 0.1 },
  { left: "18%", top: "72%", size: 1.5, duration: 7.4, delay: 1.2 },
  { left: "32%", top: "26%", size: 2.5, duration: 9.4, delay: 0.8 },
  { left: "47%", top: "84%", size: 1.5, duration: 8.2, delay: 1.8 },
  { left: "64%", top: "17%", size: 2, duration: 10.2, delay: 0.4 },
  { left: "78%", top: "62%", size: 1.8, duration: 7.9, delay: 1.5 },
  { left: "91%", top: "31%", size: 2.2, duration: 9.8, delay: 0.7 },
] as const;

const PROJECT_FALLBACKS = ["/portfolio-1.png", "/portfolio-2.png"];

export default function PublicProfileClient({
  profile,
  portfolio,
  experience,
}: PublicProfileClientProps) {
  const { t, dir, isRtl } = useTranslation(profile.locale || "fr");
  const { user, isAuthReady } = useAuth();
  const { profile: currentUserProfile } = useProfile();
  const searchParams = useSearchParams();
  const source = searchParams?.get("src") || null;

  const [relationship, setRelationship] = useState<RelationshipStatus>({ status: "none" });

  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form states for adding/editing a connection
  const [notes, setNotes] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [locationName, setLocationName] = useState("");
  const [eventName, setEventName] = useState("");

  // Real-time listener for the relationship
  useEffect(() => {
    if (!isAuthReady || !user?.uid || !profile.id || user.uid === profile.id) {
      return;
    }

    const reqSentRef = doc(db, "contact_requests", `${user.uid}_${profile.id}`);
    const reqRecvRef = doc(db, "contact_requests", `${profile.id}_${user.uid}`);
    const connQuery = query(
      collection(db, "connections"),
      where("userId", "==", user.uid),
      where("connectedUserId", "==", profile.id),
      limit(1)
    );
    const subDocRef = doc(db, "users", user.uid, "network", profile.id);

    let statusReqSent: RelationshipSnapshot = null;
    let statusReqRecv: RelationshipSnapshot = null;
    let statusConn: RelationshipSnapshot = null;
    let statusSubDoc: DocumentData | null = null;

    function updateState() {
      if (statusSubDoc && (statusSubDoc.status === "connected" || statusSubDoc.status === "accepted")) {
        setRelationship({ status: "connected", connectionId: profile.id });
        setNotes(statusSubDoc.personalNote || "");
        setSelectedTags(statusSubDoc.tags || []);
        setLocationName(statusSubDoc.locationName || "");
        setEventName(statusSubDoc.event || "");
      } else if (statusConn) {
        setRelationship({ status: "connected", connectionId: statusConn.id });
        setNotes(statusConn.personalNote || "");
        setSelectedTags(statusConn.tags || []);
        setLocationName(statusConn.locationName || "");
        setEventName(statusConn.event || "");
      } else if (statusReqSent && statusReqSent.status === "pending") {
        setRelationship({ status: "pending_sent", requestId: statusReqSent.id });
      } else if (statusReqRecv && statusReqRecv.status === "pending") {
        setRelationship({ status: "pending_received", requestId: statusReqRecv.id });
      } else {
        setRelationship({ status: "none" });
      }
    }

    const unsubReqSent = onSnapshot(reqSentRef, (snap) => {
      statusReqSent = snap.exists() ? { id: snap.id, ...snap.data() } : null;
      updateState();
    });

    const unsubReqRecv = onSnapshot(reqRecvRef, (snap) => {
      statusReqRecv = snap.exists() ? { id: snap.id, ...snap.data() } : null;
      updateState();
    });

    const unsubConn = onSnapshot(connQuery, (snap) => {
      statusConn = !snap.empty ? { id: snap.docs[0].id, ...snap.docs[0].data() } : null;
      updateState();
    });

    const unsubSubDoc = onSnapshot(subDocRef, (snap) => {
      statusSubDoc = snap.exists() ? snap.data() : null;
      updateState();
    });

    return () => {
      unsubReqSent();
      unsubReqRecv();
      unsubConn();
      unsubSubDoc();
    };
  }, [user?.uid, profile.id, isAuthReady]);

  // Suggest adding to network if opened via QR/NFC
  useEffect(() => {
    if (!user?.uid || !profile.id || user.uid === profile.id) return;
    if (relationship.status === "none" && (source === "qr" || source === "nfc")) {
      const timer = setTimeout(() => {
        setLocationName(source === "qr" ? "QR Scan" : "NFC Tap");
        setShowAddModal(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user?.uid, profile.id, relationship.status, source]);

  const handleSendRequest = async () => {
    if (!user?.uid || !currentUserProfile) return;
    setLoading(true);
    try {
      await sendContactRequest({
        senderId: user.uid,
        receiverId: profile.id,
        senderProfile: currentUserProfile,
        receiverProfile: profile,
        method: source === "qr" ? "qr" : source === "nfc" ? "nfc" : "link",
        event: eventName,
        locationName: locationName || (source === "qr" ? "QR Code" : source === "nfc" ? "NFC" : "Velora Link"),
        personalNote: notes,
        tags: selectedTags,
      });
      setShowAddModal(false);
      navigator.vibrate?.(24);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      await cancelContactRequest(user.uid, profile.id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!user?.uid || !currentUserProfile) return;
    setLoading(true);
    try {
      await acceptContactRequest(profile.id, user.uid, profile, currentUserProfile);
      navigator.vibrate?.(24);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineRequest = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      await declineContactRequest(profile.id, user.uid);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToNetwork = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      await addConnectionToNetwork(user.uid, profile, currentUserProfile || undefined);
      navigator.vibrate?.(24);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateConnection = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      await updateConnectionNotesAndTags(user.uid, profile.id, notes, selectedTags);
      setShowEditModal(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveConnection = async () => {
    if (!user?.uid) return;
    if (!confirm(t("remove_connection") + "?")) return;
    setLoading(true);
    try {
      await removeConnection(user.uid, profile.id);
      setShowEditModal(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async () => {
    if (!user?.uid) return;
    if (!confirm(t("block_user") + "?")) return;
    setLoading(true);
    try {
      await blockUser(user.uid, profile.id);
      setShowEditModal(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadVCard = () => {
    createVCardFile(profile, profileUrl);
  };

  const theme = getIdentityTheme(profile.professionalMode);
  const profileUrl = getProfileUrl(profile.username);
  const shortUrl = getProfileShortUrl(profile.username);
  const themeVars = useMemo(
    () =>
      ({
        "--identity-accent": theme.accent,
        "--identity-accent-rgb": theme.accentRgb,
        "--identity-secondary": theme.secondary,
        "--identity-secondary-rgb": theme.secondaryRgb,
        "--identity-muted": theme.muted,
      }) as CssVarStyle,
    [theme]
  );

  return (
    <main
      className={`luxury-profile min-h-screen overflow-hidden bg-velora-black text-velora-text ${
        isRtl ? "rtl" : "ltr"
      }`}
      dir={dir}
      style={themeVars}
    >
      <IdentityHero
        profile={profile}
        portfolioCount={portfolio.length}
        experienceCount={experience.length}
        profileUrl={profileUrl}
        shortUrl={shortUrl}
        theme={theme}
        t={t}
        currentUserId={user?.uid}
        isAuthReady={isAuthReady}
        relationship={relationship}
        loading={loading}
        onAdd={handleAddToNetwork}
        onEdit={() => setShowEditModal(true)}
        onCancel={handleCancelRequest}
        onAccept={handleAcceptRequest}
        onDecline={handleDeclineRequest}
        onDownloadVCard={handleDownloadVCard}
      />

      <div className="relative z-10 mx-auto w-full max-w-[980px] px-5 pb-24">
        <ContactSection profile={profile} theme={theme} t={t} />

        {profile.professionalMode === "dentist" && (() => {
          const dentistActions = [
            {
              key: "call",
              label: t("btn_call_clinic"),
              href: profile.fixedPhone ? `tel:${profile.fixedPhone.replace(/\s+/g, "")}` : (profile.phone ? `tel:${profile.phone.replace(/\s+/g, "")}` : ""),
              icon: Phone,
              color: "from-blue-600/20 to-cyan-500/20 border-blue-500/30 text-blue-400 hover:border-blue-400",
            },
            {
              key: "whatsapp",
              label: t("btn_whatsapp"),
              href: profile.whatsapp ? `https://wa.me/${profile.whatsapp.replace(/\D/g, "")}` : "",
              icon: MessageCircle,
              color: "from-emerald-600/20 to-teal-500/20 border-emerald-500/30 text-emerald-400 hover:border-emerald-400",
            },
            {
              key: "maps",
              label: t("btn_open_maps"),
              href: profile.googleMapsLink ? normalizeExternalHref(profile.googleMapsLink) : "",
              icon: MapPin,
              color: "from-amber-600/20 to-yellow-500/20 border-amber-500/30 text-amber-400 hover:border-amber-400",
            },
            {
              key: "reviews",
              label: t("btn_google_reviews"),
              href: profile.googleReviewsLink ? normalizeExternalHref(profile.googleReviewsLink) : "",
              icon: Star,
              color: "from-purple-600/20 to-pink-500/20 border-purple-500/30 text-purple-400 hover:border-purple-400",
            },
            {
              key: "website",
              label: t("btn_website"),
              href: profile.website ? normalizeExternalHref(profile.website) : "",
              icon: Globe,
              color: "from-indigo-600/20 to-blue-500/20 border-indigo-500/30 text-indigo-400 hover:border-indigo-400",
            },
            {
              key: "booking",
              label: t("btn_book_appointment"),
              href: profile.appointmentLink ? normalizeExternalHref(profile.appointmentLink) : "",
              icon: CalendarDays,
              color: "from-yellow-600/20 to-amber-500/20 border-yellow-500/30 text-yellow-400 hover:border-yellow-400",
            },
          ].filter(a => a.href);

          return (
            <Reveal>
              <div className="identity-glass-card identity-reflective mt-2 mb-8 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.02] shadow-[0_24px_50px_rgba(0,0,0,0.3)] backdrop-blur-md">
                
                {/* Header: Verified Seal & Info */}
                <div className="relative p-6 pb-4 bg-gradient-to-b from-white/[0.04] to-transparent">
                  
                  {/* Dentist Verified Badge */}
                  <div className="absolute top-6 right-6 flex items-center gap-1.5 rounded-full border border-velora-gold/30 bg-velora-gold/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-velora-gold">
                    <Shield size={12} fill="currentColor" />
                    {t("dentist_verified")}
                  </div>

                  <div className="flex items-center gap-3.5 mb-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(var(--identity-accent-rgb),0.12)] text-[var(--identity-accent)] border border-[rgba(var(--identity-accent-rgb),0.2)]">
                      <Stethoscope size={24} />
                    </div>
                    <div>
                      <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold text-velora-text leading-tight">
                        {profile.clinicName || t("field_clinic_name")}
                      </h3>
                      <p className="text-xs text-[var(--identity-secondary)] font-medium mt-1">
                        {profile.specialty || "Chirurgien-Dentiste"}
                      </p>
                    </div>
                  </div>

                  {profile.orderNumber && (
                    <div className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-white/[0.04] px-2.5 py-1 text-[11px] font-mono text-velora-text-muted border border-white/5">
                      <span className="text-[var(--identity-accent)] font-semibold">ONMD N°:</span>
                      <span>{profile.orderNumber}</span>
                    </div>
                  )}
                </div>

                {/* Body: Location, Hours */}
                <div className="p-6 pt-2 grid gap-6 sm:grid-cols-2 border-t border-white/5">
                  {profile.clinicAddress && (
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.03] text-[var(--identity-accent)] border border-white/5">
                        <MapPin size={16} />
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-velora-text-muted">
                          {t("field_address")}
                        </span>
                        <p className="mt-1.5 text-sm text-velora-text-secondary leading-relaxed">
                          {profile.clinicAddress}
                        </p>
                      </div>
                    </div>
                  )}

                  {profile.workHours && (
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.03] text-[var(--identity-accent)] border border-white/5">
                        <Clock size={16} />
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-velora-text-muted">
                          {t("field_work_hours")}
                        </span>
                        <p className="mt-1.5 text-sm text-velora-text-secondary leading-relaxed font-mono">
                          {profile.workHours}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Emergency availability pulse banner */}
                {profile.emergencyContact && (
                  <div className="mx-6 mb-6 p-4 rounded-2xl border border-red-500/20 bg-red-950/10 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="relative flex h-3.5 w-3.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500"></span>
                      </span>
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-red-400">
                          {t("emergency_badge")}
                        </span>
                        <p className="text-xs text-velora-text-muted mt-0.5">
                          {t("field_emergency_contact")}
                        </p>
                      </div>
                    </div>
                    <motion.a
                      href={`tel:${profile.emergencyContact.replace(/\s+/g, "")}`}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-2 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 px-4 py-2 text-xs font-bold text-red-200"
                    >
                      <Phone size={14} />
                      {profile.emergencyContact}
                    </motion.a>
                  </div>
                )}

                {/* Dentist Action Buttons Grid */}
                {dentistActions.length > 0 && (
                  <div className="p-6 pt-0 border-t border-white/5">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-velora-text-muted mb-3.5 mt-4">
                      {t("connect")}
                    </span>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {dentistActions.map((act) => {
                        const Icon = act.icon;
                        return (
                          <motion.a
                            key={act.key}
                            href={act.href}
                            target={act.href.startsWith("http") ? "_blank" : undefined}
                            rel={act.href.startsWith("http") ? "noopener noreferrer" : undefined}
                            className={`flex items-center gap-3 rounded-2xl border bg-gradient-to-b p-3.5 text-xs font-semibold shadow-sm transition-all duration-300 ${act.color}`}
                            whileHover={{ y: -3, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-black/20">
                              <Icon size={16} />
                            </span>
                            <span className="truncate leading-tight">{act.label}</span>
                          </motion.a>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Optional clinic gallery & Before/After showcase */}
                <div className="p-6 pt-6 border-t border-white/5 grid gap-6 md:grid-cols-2">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-velora-text-muted mb-3.5">
                      {t("section_before_after")}
                    </span>
                    <BeforeAfterSlider t={t} />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-velora-text-muted mb-3.5">
                      {t("section_gallery")}
                    </span>
                    <ClinicGallery t={t} />
                  </div>
                </div>

              </div>
            </Reveal>
          );
        })()}

        {(profile.skills || []).length > 0 && (
          <IdentitySection eyebrow="Expertise" title="Signal Stack">
            <SkillMatrix skills={profile.skills || []} />
          </IdentitySection>
        )}

        {(profile.services || []).length > 0 && (
          <IdentitySection eyebrow="Services" title="Private Offering">
            <ServiceDeck services={profile.services || []} />
          </IdentitySection>
        )}

        {portfolio.length > 0 && (
          <IdentitySection eyebrow={t("portfolio")} title="Selected Work">
            <PortfolioShowcase portfolio={portfolio} theme={theme} />
          </IdentitySection>
        )}

        {experience.length > 0 && (
          <IdentitySection eyebrow={t("experience")} title="Trajectory">
            <ExperienceTimeline experience={experience} presentLabel={t("present")} />
          </IdentitySection>
        )}

        <LuxuryQrSection
          profile={profile}
          profileUrl={profileUrl}
          shortUrl={shortUrl}
          theme={theme}
        />

        {(profile.socialLinks || []).length > 0 && (
          <IdentitySection eyebrow={t("connect")} title="Digital Channels">
            <SocialChannelRail links={profile.socialLinks || []} />
          </IdentitySection>
        )}
      </div>

      {/* Add Connection Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-0 md:items-center md:p-4">
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
            />
            <motion.div
              className="relative z-10 w-full rounded-t-[32px] border border-white/10 bg-[#0c0c0a] p-6 shadow-2xl md:max-w-md md:rounded-[32px] overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-300"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
            >
              <div className="glow-layer pointer-events-none absolute inset-x-8 -top-16 h-36 rounded-full bg-[rgba(var(--identity-accent-rgb),0.1)] blur-xl" />
              
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-velora-text">
                  {t("add_to_network")}
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-velora-text-muted hover:bg-white/10"
                >
                  <X size={16} />
                </button>
              </div>
              
              <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.1em] text-velora-text-muted mb-1.5">
                    {t("notes")}
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t("add_note_placeholder")}
                    rows={3}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-velora-text placeholder-white/20 focus:border-[var(--identity-accent)] focus:outline-none"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.1em] text-velora-text-muted mb-1.5">
                    {t("tags")}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["Business", "Dentist", "Client", "VIP", "Friend", "Partner"].map((tag) => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            setSelectedTags(prev => 
                              prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                            );
                          }}
                          style={{
                            borderColor: isSelected ? "var(--identity-accent)" : "rgba(255,255,255,0.1)",
                            background: isSelected ? "rgba(var(--identity-accent-rgb), 0.12)" : "rgba(255,255,255,0.03)"
                          }}
                          className="rounded-full border px-3 py-1 text-xs font-medium text-velora-text hover:border-white/20 transition-all"
                        >
                          {t(`filter_${tag.toLowerCase()}`)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Location Met */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.1em] text-velora-text-muted mb-1.5">
                    {t("met_at_location")}
                  </label>
                  <input
                    type="text"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder={t("where_met_placeholder")}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-velora-text placeholder-white/20 focus:border-[var(--identity-accent)] focus:outline-none"
                  />
                </div>

                {/* Event Name */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.1em] text-velora-text-muted mb-1.5">
                    {t("event_name")}
                  </label>
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder={t("event_name_placeholder")}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-velora-text placeholder-white/20 focus:border-[var(--identity-accent)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 rounded-2xl bg-white/5 py-3.5 text-sm font-semibold text-velora-text hover:bg-white/10 transition-colors"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={handleSendRequest}
                  disabled={loading}
                  style={{
                    background: `linear-gradient(135deg, var(--identity-accent), var(--identity-secondary))`
                  }}
                  className="flex-1 rounded-2xl py-3.5 text-sm font-semibold text-velora-black shadow-lg shadow-[rgba(var(--identity-accent-rgb),0.25)] hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
                >
                  {loading ? <span className="animate-spin text-velora-black">●</span> : t("save")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Connection Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-0 md:items-center md:p-4">
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
            />
            <motion.div
              className="relative z-10 w-full rounded-t-[32px] border border-white/10 bg-[#0c0c0a] p-6 shadow-2xl md:max-w-md md:rounded-[32px] overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-300"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
            >
              <div className="glow-layer pointer-events-none absolute inset-x-8 -top-16 h-36 rounded-full bg-[rgba(var(--identity-accent-rgb),0.1)] blur-xl" />
              
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-velora-text">
                  {t("status_connected")}
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-velora-text-muted hover:bg-white/10"
                >
                  <X size={16} />
                </button>
              </div>
              
              <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.1em] text-velora-text-muted mb-1.5">
                    {t("notes")}
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t("add_note_placeholder")}
                    rows={3}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-velora-text placeholder-white/20 focus:border-[var(--identity-accent)] focus:outline-none"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.1em] text-velora-text-muted mb-1.5">
                    {t("tags")}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["Business", "Dentist", "Client", "VIP", "Friend", "Partner"].map((tag) => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            setSelectedTags(prev => 
                              prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                            );
                          }}
                          style={{
                            borderColor: isSelected ? "var(--identity-accent)" : "rgba(255,255,255,0.1)",
                            background: isSelected ? "rgba(var(--identity-accent-rgb), 0.12)" : "rgba(255,255,255,0.03)"
                          }}
                          className="rounded-full border px-3 py-1 text-xs font-medium text-velora-text hover:border-white/20 transition-all"
                        >
                          {t(`filter_${tag.toLowerCase()}`)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Location Met */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.1em] text-velora-text-muted mb-1.5">
                    {t("met_at_location")}
                  </label>
                  <input
                    type="text"
                    value={locationName}
                    disabled
                    className="w-full rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3 text-sm text-velora-text-muted focus:outline-none"
                  />
                </div>

                {/* Event Name */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.1em] text-velora-text-muted mb-1.5">
                    {t("event_name")}
                  </label>
                  <input
                    type="text"
                    value={eventName}
                    disabled
                    className="w-full rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3 text-sm text-velora-text-muted focus:outline-none"
                  />
                </div>

                {/* Block Option */}
                <div className="pt-2">
                  <button
                    onClick={handleBlockUser}
                    className="text-xs text-red-500 hover:text-red-400 font-medium transition-colors"
                  >
                    {t("block_user")}
                  </button>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2">
                <div className="flex gap-3">
                  <button
                    onClick={handleRemoveConnection}
                    className="flex-1 rounded-2xl border border-red-500/20 bg-red-500/5 py-3.5 text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    {t("remove_connection")}
                  </button>
                  <button
                    onClick={handleUpdateConnection}
                    disabled={loading}
                    style={{
                      background: `linear-gradient(135deg, var(--identity-accent), var(--identity-secondary))`
                    }}
                    className="flex-1 rounded-2xl py-3.5 text-sm font-semibold text-velora-black shadow-lg shadow-[rgba(var(--identity-accent-rgb),0.25)] hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
                  >
                    {loading ? <span className="animate-spin text-velora-black">●</span> : t("save")}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}

export function IdentityHero({
  profile,
  portfolioCount,
  experienceCount,
  profileUrl,
  shortUrl,
  theme,
  t,
  currentUserId,
  isAuthReady,
  relationship,
  loading,
  onAdd,
  onEdit,
  onCancel,
  onAccept,
  onDecline,
  onDownloadVCard,
}: {
  profile: VeloraProfile;
  portfolioCount: number;
  experienceCount: number;
  profileUrl: string;
  shortUrl: string;
  theme: IdentityTheme;
  t: (key: string) => string;
  currentUserId?: string | null;
  isAuthReady?: boolean;
  relationship?: {
    status: "connected" | "pending_sent" | "pending_received" | "blocked" | "blocked_by" | "none";
    connectionId?: string;
    requestId?: string;
  };
  loading?: boolean;
  onAdd?: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
  onDownloadVCard?: () => void;
}) {
  const heroRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const backgroundY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const panelY = useTransform(scrollYProgress, [0, 1], [0, -34]);
  const avatarY = useTransform(scrollYProgress, [0, 1], [0, -22]);
  const contactActions = useMemo(() => getContactActions(profile), [profile]);
  const signalCount =
    (profile.skills || []).length + (profile.services || []).length + experienceCount;
  const trustScore = profile.isVerified ? 100 : profile.isPremium ? 96 : 88;
  const hasCoverVideo = isVideoAsset(profile.coverUrl);

  return (
    <section
      ref={heroRef}
      className="relative min-h-[100svh] overflow-hidden px-5 pb-10 pt-[max(1.25rem,env(safe-area-inset-top))]"
    >
      <motion.div
        aria-hidden
        className="absolute inset-0 origin-center scale-110"
        style={{
          background: theme.heroGradient,
          y: reduceMotion ? undefined : backgroundY,
        }}
      />

      {profile.coverUrl &&
        (hasCoverVideo ? (
          <motion.video
            src={profile.coverUrl}
            className="absolute inset-0 h-full w-full object-cover opacity-[0.24]"
            style={{ y: reduceMotion ? undefined : backgroundY }}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
        ) : (
          <motion.div
            className="absolute inset-0 h-full w-full opacity-[0.24]"
            style={{ y: reduceMotion ? undefined : backgroundY }}
          >
            <OptimizedImage
              src={profile.coverUrl}
              type="cover"
              className="h-full w-full"
              alt={`${profile.fullName}'s profile banner`}
            />
          </motion.div>
        ))}

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.18)_0%,rgba(0,0,0,0.1)_42%,#070705_100%)]" />
      <div className="identity-aurora absolute inset-x-[-18%] top-[-12%] h-[46svh]" />
      <motion.div
        aria-hidden
        className="glow-layer absolute left-1/2 top-[37%] h-[300px] w-[300px] rounded-full opacity-80 blur-xl md:h-[420px] md:w-[420px]"
        style={{ background: theme.atmosphere, x: "-50%", y: "-50%" }}
        animate={
          reduceMotion
            ? undefined
            : { scale: [0.98, 1.035, 0.98] }
        }
        transition={{ duration: 6.8, repeat: Infinity, ease: "easeInOut" }}
      />

      {!reduceMotion &&
        PARTICLES.map((particle) => (
          <motion.span
            key={`${particle.left}-${particle.top}`}
            aria-hidden
            className="absolute rounded-full bg-[var(--identity-accent)] opacity-40 shadow-[0_0_12px_rgba(var(--identity-accent-rgb),0.46)]"
            style={{
              left: particle.left,
              top: particle.top,
              width: particle.size,
              height: particle.size,
            }}
            animate={{ y: [0, -18, 0] }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}

      <div className="relative z-10 mx-auto flex min-h-[calc(100svh-3rem)] w-full max-w-[760px] flex-col justify-center py-6">
        <Reveal className="mx-auto mb-7">
          <div className="identity-reflective inline-flex items-center gap-2 rounded-full border border-velora-gold/20 bg-black/45 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-velora-gold backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
            <Sparkles size={12} className="text-velora-gold" />
            VELORA.IDENTITY
          </div>
        </Reveal>

        <motion.div
          className="relative mx-auto mb-9 flex items-center justify-center h-[160px] w-[160px]"
          style={{ y: reduceMotion ? undefined : avatarY }}
        >
          {/* Animated gold ambient halo */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-velora-gold/20 via-velora-gold-dim/10 to-transparent blur-2xl opacity-75 animate-pulse" />
          
          {/* Double pulsing luxury halo rings */}
          <div className="pulsing-ring animate-breathe" />
          <div className="pulsing-ring-2" />
          
          {/* Conic gold metallic border */}
          <div className="avatar-gold-border h-[132px] w-[132px] relative z-10">
            <div className="h-full w-full rounded-full bg-black p-[4px]">
              <div className="relative h-full w-full overflow-hidden rounded-full border border-white/10 bg-velora-surface shadow-inner">
                {profile.avatarUrl ? (
                  <OptimizedImage
                    src={profile.avatarUrl}
                    type="avatar"
                    className="h-full w-full"
                    alt={profile.fullName}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_50%_20%,rgba(196,162,101,0.22),transparent_48%),#111] font-[family-name:var(--font-display)] text-3xl font-semibold text-velora-gold">
                    {getInitials(profile.fullName)}
                  </div>
                )}
                <span className="pointer-events-none absolute inset-0 rounded-full bg-[linear-gradient(135deg,rgba(255,255,255,0.18),transparent_42%)]" />
              </div>
            </div>
          </div>
          {profile.isVerified && (
            <motion.div
              className="absolute bottom-3 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-velora-gold/45 bg-black/85 text-velora-gold shadow-[0_0_24px_rgba(196,162,101,0.35)] backdrop-blur-md"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, delay: 0.42, ease: LUXURY_EASE }}
            >
              <Shield size={15} fill="currentColor" />
            </motion.div>
          )}
        </motion.div>

        <motion.div
          className="identity-hero-panel relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.055] px-5 py-6 text-center shadow-[0_24px_76px_rgba(0,0,0,0.48)] backdrop-blur-md md:px-8 md:py-8"
          style={{ y: reduceMotion ? undefined : panelY }}
        >
          <div className="glow-layer pointer-events-none absolute inset-x-8 -top-16 h-36 rounded-full bg-[rgba(var(--identity-accent-rgb),0.13)] blur-xl" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_18%,rgba(255,255,255,0.08)_48%,transparent_68%)] opacity-45" />

          <Reveal delay={0.08}>
            <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
              <LuxuryBadge icon={Star}>{profile.isPremium ? t("premium") : "Signature"}</LuxuryBadge>
              {profile.isVerified && <LuxuryBadge icon={Shield}>{t("verified")}</LuxuryBadge>}
              <LuxuryBadge>{theme.badge}</LuxuryBadge>
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <h1 className="mx-auto max-w-[680px] font-[family-name:var(--font-display)] text-[2.65rem] font-semibold leading-[0.98] text-velora-text sm:text-6xl">
              {profile.fullName || "VELORA"}
            </h1>
          </Reveal>

          <Reveal delay={0.18}>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-velora-text-secondary">
              <span className="inline-flex items-center gap-2">
                <Briefcase size={14} className="text-[var(--identity-accent)]" />
                {profile.title || "Premium Professional"}
              </span>
              <span className="hidden h-1 w-1 rounded-full bg-white/20 sm:block" />
              <span className="inline-flex items-center gap-2">
                <Globe size={13} className="text-[var(--identity-accent)]" />
                {profile.company || "Independent"}
              </span>
              <span className="hidden h-1 w-1 rounded-full bg-white/20 sm:block" />
              <span className="inline-flex items-center gap-2">
                <MapPin size={13} className="text-[var(--identity-accent)]" />
                {profile.location || "Global"}
              </span>
            </div>
          </Reveal>

          {profile.bio && (
            <Reveal delay={0.24}>
              <p className="mx-auto mt-5 max-w-[560px] text-[15px] leading-7 text-velora-text-secondary">
                {profile.bio}
              </p>
            </Reveal>
          )}

          <Reveal delay={0.3}>
            <LuxuryActionButtons actions={contactActions} t={t} />
          </Reveal>

          {/* Network Relationship Button */}
          {isAuthReady && currentUserId !== profile.id && (
            <Reveal delay={0.33}>
              <div className="mt-5 mb-2 flex justify-center">
                {!currentUserId ? (
                  <button
                    onClick={() => {
                      alert(t("login_required_network"));
                      window.location.href = "/login";
                    }}
                    style={{
                      background: `linear-gradient(135deg, var(--identity-accent), var(--identity-secondary))`
                    }}
                    className="w-full max-w-[280px] rounded-full py-3 text-xs font-semibold text-velora-black shadow-lg shadow-[rgba(var(--identity-accent-rgb),0.2)] hover:opacity-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Sparkles size={14} />
                    Ajouter à mon réseau
                  </button>
                ) : relationship?.status === "none" ? (
                  <button
                    onClick={onAdd}
                    disabled={loading}
                    style={{
                      background: `linear-gradient(135deg, var(--identity-accent), var(--identity-secondary))`
                    }}
                    className="w-full max-w-[280px] rounded-full py-3 text-xs font-semibold text-velora-black shadow-lg shadow-[rgba(var(--identity-accent-rgb),0.2)] hover:opacity-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    {loading ? <span className="animate-spin text-velora-black">●</span> : <Sparkles size={14} />}
                    Ajouter à mon réseau
                  </button>
                ) : relationship?.status === "pending_sent" ? (
                  <button
                    onClick={onCancel}
                    disabled={loading}
                    className="w-full max-w-[280px] rounded-full border border-white/10 bg-white/[0.05] py-3 text-xs font-semibold text-velora-text-muted hover:bg-white/[0.08] hover:text-velora-text transition-all flex items-center justify-center gap-1.5"
                  >
                    {loading ? <span className="animate-spin text-velora-text-muted">●</span> : <Clock size={14} />}
                    {t("relationship_status_pending_sent")} ({t("cancel")})
                  </button>
                ) : relationship?.status === "pending_received" ? (
                  <div className="flex flex-col gap-2 w-full max-w-[280px]">
                    <span className="block text-[10px] uppercase font-bold tracking-wider text-velora-text-muted text-center">
                      {t("received_request_msg")}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={onAccept}
                        disabled={loading}
                        style={{
                          background: `linear-gradient(135deg, var(--identity-accent), var(--identity-secondary))`
                        }}
                        className="flex-1 rounded-full py-2.5 text-xs font-semibold text-velora-black shadow-lg shadow-[rgba(var(--identity-accent-rgb),0.2)] hover:opacity-95 transition-all flex items-center justify-center gap-1"
                      >
                        {loading ? "●" : t("btn_accept")}
                      </button>
                      <button
                        onClick={onDecline}
                        disabled={loading}
                        className="flex-1 rounded-full border border-white/10 bg-white/[0.05] py-2.5 text-xs font-semibold text-velora-text hover:bg-white/[0.08] transition-all flex items-center justify-center gap-1"
                      >
                        {loading ? "●" : t("btn_decline")}
                      </button>
                    </div>
                  </div>
                ) : relationship?.status === "connected" ? (
                  <div className="flex flex-col gap-3 w-full max-w-[280px]">
                    {/* Status Badge */}
                    <div
                      style={{
                        borderColor: "rgba(var(--identity-accent-rgb), 0.25)",
                        background: "rgba(var(--identity-accent-rgb), 0.05)"
                      }}
                      className="w-full rounded-full border py-2.5 text-xs font-semibold text-[var(--identity-accent)] flex items-center justify-center gap-1.5"
                    >
                      <UserCheck size={14} className="text-[var(--identity-accent)]" />
                      {t("in_network")}
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex gap-2">
                      {/* Save Contact (vCard) */}
                      <button
                        onClick={onDownloadVCard}
                        className="flex-1 rounded-full border border-white/10 bg-white/[0.05] py-2.5 text-xs font-medium text-velora-text hover:bg-white/[0.08] transition-all flex items-center justify-center gap-1.5"
                      >
                        <Bookmark size={13} />
                        {t("save_contact")}
                      </button>

                      {/* Notes & Tags */}
                      <button
                        onClick={onEdit}
                        className="flex-1 rounded-full border border-white/10 bg-white/[0.05] py-2.5 text-xs font-medium text-velora-text hover:bg-white/[0.08] transition-all flex items-center justify-center gap-1.5"
                      >
                        <Sparkles size={13} className="text-[var(--identity-accent)]" />
                        {t("notes") || "Notes"}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </Reveal>
          )}

          <Reveal delay={0.36}>
            <div className="mt-6 grid grid-cols-3 gap-2.5">
              <StatCounter value={portfolioCount} label="Portfolio" />
              <StatCounter value={signalCount} label="Signals" />
              <StatCounter value={trustScore} suffix="%" label="Trust" />
            </div>
          </Reveal>

          <Reveal delay={0.42}>
            <a
              href={profileUrl}
              className="mx-auto mt-5 inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-black/22 px-3 py-2 text-[11px] font-medium text-velora-text-muted backdrop-blur-md transition-colors duration-300 hover:border-[rgba(var(--identity-accent-rgb),0.35)] hover:text-velora-text"
            >
              <Link2 size={12} className="text-[var(--identity-accent)]" />
              <span className="truncate font-mono">{shortUrl}</span>
            </a>
          </Reveal>
        </motion.div>
      </div>
    </section>
  );
}

export function ContactSection({
  profile,
  theme,
  t,
}: {
  profile: VeloraProfile;
  theme: IdentityTheme;
  t: (key: string) => string;
}) {
  const contactActions = useMemo(() => getContactActions(profile), [profile]);
  if (!contactActions.length) return null;

  const getTranslationKey = (key: string) => {
    if (key === "call_clinic") return "btn_call_clinic";
    if (key === "whatsapp") return "btn_whatsapp";
    if (key === "maps") return "btn_open_maps";
    if (key === "booking") return "btn_book_appointment";
    return key;
  };

  return (
    <section className="-mt-6 pb-8">
      <Reveal>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {contactActions.map((action, index) => {
            const Icon = action.icon;
            const isWhatsApp = action.key === "whatsapp";
            const isPrimary = index === 0 || action.key === "phone" || action.key === "call_clinic";

            let cardBgClass = "btn-3d-glass";
            let iconWrapperClass = "bg-white/5 text-velora-text";
            let labelClass = "text-velora-text-secondary/70";
            let valueClass = "text-velora-text";

            if (isWhatsApp) {
              cardBgClass = "btn-3d-whatsapp text-white";
              iconWrapperClass = "bg-black/20 text-white";
              labelClass = "text-white/70";
              valueClass = "text-white";
            } else if (isPrimary) {
              cardBgClass = "btn-3d-identity text-velora-black";
              iconWrapperClass = "bg-black/10 text-velora-black";
              labelClass = "text-velora-black/60";
              valueClass = "text-velora-black font-extrabold";
            }

            return (
              <motion.a
                key={action.key}
                href={action.href}
                target={action.href.startsWith("http") ? "_blank" : undefined}
                rel={action.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className={`identity-reflective group flex min-h-[96px] items-center justify-between rounded-[22px] px-4 py-4 text-left ${cardBgClass}`}
                whileHover={{ y: -4, scale: 1.01 }}
                whileTap={{ scale: 0.985 }}
                transition={{ duration: 0.28, ease: LUXURY_EASE }}
              >
                <span>
                  <span className={`block text-[10px] font-semibold uppercase tracking-[0.16em] ${labelClass}`}>
                    {index === 0 ? t("Primary") || "Primary" : t("Access") || "Access"}
                  </span>
                  <span className={`mt-2 block font-[family-name:var(--font-display)] text-base font-semibold ${valueClass}`}>
                    {t(getTranslationKey(action.key)) || action.label}
                  </span>
                </span>
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-full border transition-transform duration-300 group-hover:scale-105 ${iconWrapperClass}`}
                  style={{ borderColor: isPrimary ? "rgba(0, 0, 0, 0.15)" : `rgba(${theme.accentRgb}, 0.24)` }}
                >
                  <Icon size={18} />
                </span>
              </motion.a>
            );
          })}
        </div>
      </Reveal>
    </section>
  );
}

export function IdentitySection({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="py-8">
      <Reveal>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--identity-accent)]">
              {eyebrow}
            </div>
            <h2 className="mt-1 font-[family-name:var(--font-display)] text-[1.7rem] font-semibold leading-tight text-velora-text">
              {title}
            </h2>
          </div>
          <span className="h-px flex-1 bg-gradient-to-r from-[rgba(var(--identity-accent-rgb),0.36)] to-transparent" />
        </div>
      </Reveal>
      {children}
    </section>
  );
}

export function SkillMatrix({ skills }: { skills: string[] }) {
  return (
    <Reveal delay={0.06}>
      <div className="flex flex-wrap gap-2.5">
        {skills.map((skill, index) => (
          <motion.span
            key={skill}
            className="identity-reflective rounded-full border border-[rgba(var(--identity-accent-rgb),0.2)] bg-white/[0.055] px-4 py-2 text-xs font-medium text-velora-text-secondary backdrop-blur-md"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.45, delay: index * 0.035, ease: LUXURY_EASE }}
          >
            {skill}
          </motion.span>
        ))}
      </div>
    </Reveal>
  );
}

export function ServiceDeck({ services }: { services: VeloraProfile["services"] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {services.map((service, index) => (
        <Reveal key={service.id} delay={index * 0.05}>
          <article className="identity-glass-card identity-reflective min-h-[136px] rounded-[24px] p-5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(var(--identity-accent-rgb),0.2)] bg-black/20 text-[var(--identity-accent)]">
                <Sparkles size={16} />
              </span>
              {service.price && (
                <span className="rounded-full bg-[rgba(var(--identity-accent-rgb),0.1)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--identity-accent)]">
                  {service.price}
                </span>
              )}
            </div>
            <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-velora-text">
              {service.title}
            </h3>
            {service.description && (
              <p className="mt-2 text-sm leading-6 text-velora-text-muted">
                {service.description}
              </p>
            )}
          </article>
        </Reveal>
      ))}
    </div>
  );
}

export function PortfolioShowcase({
  portfolio,
  theme,
}: {
  portfolio: PortfolioItem[];
  theme: IdentityTheme;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activeProject = activeIndex === null ? null : portfolio[activeIndex];

  const move = (direction: -1 | 1) => {
    if (activeIndex === null) return;
    setActiveIndex((activeIndex + direction + portfolio.length) % portfolio.length);
  };

  return (
    <>
      <div className="grid gap-3 md:grid-cols-2">
        {portfolio.map((project, index) => (
          <Reveal key={project.id} delay={index * 0.05}>
            <motion.article
              className={`identity-glass-card identity-reflective group relative cursor-pointer overflow-hidden rounded-[28px] ${
                index === 0 ? "md:col-span-2" : ""
              }`}
              onClick={() => setActiveIndex(index)}
              whileHover={{ y: -5, scale: 1.006 }}
              whileTap={{ scale: 0.985 }}
              transition={{ duration: 0.32, ease: LUXURY_EASE }}
            >
              <div className={`relative overflow-hidden ${index === 0 ? "aspect-[16/11] md:aspect-[21/9]" : "aspect-[4/4.5]"}`}>
                <ProjectMedia project={project} index={index} priority={index === 0} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/86 via-black/16 to-transparent" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_12%,rgba(var(--identity-accent-rgb),0.18),transparent_28%)] opacity-80" />
                {isVideoAsset(project.imageUrl) && (
                  <span className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/42 text-[var(--identity-accent)] backdrop-blur-md">
                    <Play size={15} fill="currentColor" />
                  </span>
                )}
              </div>
              <div className="absolute inset-x-0 bottom-0 p-5">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--identity-accent)]">
                    {project.category || "Project"}
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/12 bg-white/[0.07] text-velora-text backdrop-blur-md">
                    <Eye size={13} />
                  </span>
                </div>
                <h3 className="max-w-[560px] font-[family-name:var(--font-display)] text-2xl font-semibold leading-tight text-velora-text">
                  {project.title}
                </h3>
                {project.description && index === 0 && (
                  <p className="mt-2 max-w-[560px] text-sm leading-6 text-velora-text-secondary">
                    {project.description}
                  </p>
                )}
              </div>
            </motion.article>
          </Reveal>
        ))}
      </div>

      <AnimatePresence>
        {activeProject && (
          <PortfolioModal
            project={activeProject}
            index={activeIndex || 0}
            total={portfolio.length}
            theme={theme}
            onClose={() => setActiveIndex(null)}
            onMove={move}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function PortfolioModal({
  project,
  index,
  total,
  theme,
  onClose,
  onMove,
}: {
  project: PortfolioItem;
  index: number;
  total: number;
  theme: IdentityTheme;
  onClose: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const projectIdOrIndex = project.id || String(index);
  const [prevId, setPrevId] = useState(projectIdOrIndex);
  const [scale, setScale] = useState(1);
  const [dragEnabled, setDragEnabled] = useState(false);

  if (projectIdOrIndex !== prevId) {
    setPrevId(projectIdOrIndex);
    setScale(1);
    setDragEnabled(false);
  }

  const toggleZoom = () => {
    if (scale === 1) {
      setScale(2.2);
      setDragEnabled(true);
    } else {
      setScale(1);
      setDragEnabled(false);
    }
  };

  const handleDoubleTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleZoom();
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (scale > 1) return;
    const swipeThreshold = 50;
    if (info.offset.x < -swipeThreshold) {
      onMove(1);
    } else if (info.offset.x > swipeThreshold) {
      onMove(-1);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[260] bg-black/92 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="relative flex h-full flex-col">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-30 flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-black/45 text-velora-text backdrop-blur-md"
          aria-label="Close portfolio preview"
        >
          <X size={18} />
        </button>

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => onMove(-1)}
              className="absolute left-4 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/12 bg-black/45 text-velora-text backdrop-blur-md"
              aria-label="Previous project"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => onMove(1)}
              className="absolute right-4 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/12 bg-black/45 text-velora-text backdrop-blur-md"
              aria-label="Next project"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        <motion.div
          className="relative min-h-0 flex-1 overflow-hidden flex items-center justify-center"
          initial={{ scale: 1.04, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.02, opacity: 0 }}
          transition={{ duration: 0.45, ease: LUXURY_EASE }}
          drag={scale === 1 ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.3}
          onDragEnd={handleDragEnd}
        >
          {isVideoAsset(project.imageUrl) ? (
            <ProjectMedia project={project} index={index} priority modal />
          ) : (
            <motion.div
              className="w-full h-full cursor-zoom-in flex items-center justify-center select-none"
              onClick={handleDoubleTap}
              drag={dragEnabled}
              dragConstraints={{ left: -200, right: 200, top: -200, bottom: 200 }}
              dragElastic={0.1}
              animate={{ scale }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <ProjectMedia project={project} index={index} priority modal />
            </motion.div>
          )}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.18)_0%,rgba(0,0,0,0.18)_45%,#000_100%)] pointer-events-none" />
          <div
            className="glow-layer absolute inset-x-0 top-0 h-1/2 opacity-60 blur-xl pointer-events-none"
            style={{ background: `radial-gradient(circle at 50% 0%, rgba(${theme.accentRgb},0.22), transparent 48%)` }}
          />
        </motion.div>

        <motion.div
          className="absolute inset-x-0 bottom-0 z-20 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-24"
          initial={{ y: 26, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 16, opacity: 0 }}
          transition={{ duration: 0.4, ease: LUXURY_EASE }}
        >
          <div className="mx-auto max-w-[760px]">
            <div className="mb-3 flex items-center justify-between gap-4">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--identity-accent)]">
                {project.category || "Project"}
              </span>
              <span className="font-mono text-[10px] text-velora-text-muted">
                {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
              </span>
            </div>
            <h3 className="font-[family-name:var(--font-display)] text-[2.35rem] font-semibold leading-none text-velora-text">
              {project.title}
            </h3>
            {project.description && (
              <p className="mt-4 max-w-[560px] text-sm leading-6 text-velora-text-secondary">
                {project.description}
              </p>
            )}
            {project.link && (
              <a
                href={normalizeExternalHref(project.link)}
                target="_blank"
                rel="noopener noreferrer"
                className="identity-reflective mt-5 inline-flex items-center gap-2 rounded-full border border-[rgba(var(--identity-accent-rgb),0.28)] bg-[rgba(var(--identity-accent-rgb),0.1)] px-4 py-2.5 text-xs font-semibold text-[var(--identity-accent)] backdrop-blur-md"
              >
                View project
                <ExternalLink size={13} />
              </a>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function ProjectMedia({
  project,
  index,
  modal = false,
}: {
  project: PortfolioItem;
  index: number;
  priority?: boolean;
  modal?: boolean;
}) {
  const src = project.imageUrl || PROJECT_FALLBACKS[index % PROJECT_FALLBACKS.length];
  const className = modal
    ? "h-full w-full object-contain pointer-events-none"
    : "h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.045]";

  if (isVideoAsset(src)) {
    const videoClassName = modal ? "h-full w-full object-contain" : "h-full w-full object-cover";
    return (
      <video
        src={src}
        className={videoClassName}
        autoPlay
        muted
        loop
        playsInline
        controls={modal}
        preload="metadata"
      />
    );
  }

  return (
    <OptimizedImage
      src={src}
      type={modal ? "raw" : "portfolio"}
      className={className}
      alt={project.title}
    />
  );
}

export function ExperienceTimeline({
  experience,
  presentLabel,
}: {
  experience: ExperienceEntry[];
  presentLabel: string;
}) {
  return (
    <div className="relative">
      <span className="absolute bottom-4 left-[14px] top-4 w-px bg-gradient-to-b from-[rgba(var(--identity-accent-rgb),0.45)] via-white/10 to-transparent" />
      <div className="space-y-4">
        {experience.map((item, index) => (
          <Reveal key={item.id} delay={index * 0.06}>
            <article className="relative grid grid-cols-[28px_1fr] gap-4">
              <span className="relative z-10 mt-3 flex h-7 w-7 items-center justify-center rounded-full border border-[rgba(var(--identity-accent-rgb),0.28)] bg-black shadow-[0_0_24px_rgba(var(--identity-accent-rgb),0.16)]">
                <span className="h-2 w-2 rounded-full bg-[var(--identity-accent)]" />
              </span>
              <div className="identity-glass-card identity-reflective rounded-[22px] p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.17em] text-[var(--identity-accent)]">
                  {item.isCurrent
                    ? `${item.startYear} - ${presentLabel}`
                    : `${item.startYear} - ${item.endYear || ""}`}
                </div>
                <h3 className="mt-2 font-[family-name:var(--font-display)] text-base font-semibold text-velora-text">
                  {item.role}
                </h3>
                <p className="mt-1 text-sm text-velora-text-secondary">{item.company}</p>
                {item.description && (
                  <p className="mt-3 text-sm leading-6 text-velora-text-muted">
                    {item.description}
                  </p>
                )}
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

export function LuxuryQrSection({
  profile,
  profileUrl,
  shortUrl,
  theme,
}: {
  profile: VeloraProfile;
  profileUrl: string;
  shortUrl: string;
  theme: IdentityTheme;
}) {
  return (
    <section className="py-10">
      <Reveal>
        <div className="mx-auto max-w-[440px] text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgba(var(--identity-accent-rgb),0.22)] bg-[rgba(var(--identity-accent-rgb),0.08)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--identity-accent)]">
            <QrCode size={12} />
            VELORA PASS
          </div>
          <h2 className="font-[family-name:var(--font-display)] text-[2rem] font-semibold leading-tight text-velora-text">
            Branded Signal
          </h2>
          <div className="relative mx-auto mt-7 flex h-[292px] w-[292px] items-center justify-center">
            <motion.div
              aria-hidden
              className="absolute inset-0 rounded-[38px] border border-[rgba(var(--identity-accent-rgb),0.28)] opacity-60"
              animate={{ scale: [0.99, 1.025, 0.99] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              aria-hidden
              className="glow-layer absolute -inset-3 rounded-[42px] bg-[rgba(var(--identity-accent-rgb),0.13)] opacity-60 blur-xl"
              animate={{ scale: [1, 1.035, 1] }}
              transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="identity-qr-frame relative rounded-[34px] p-4">
              <div className="relative overflow-hidden rounded-[24px] bg-white p-4 shadow-[0_22px_90px_rgba(0,0,0,0.48)]">
                <span className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-transparent via-[rgba(var(--identity-accent-rgb),0.22)] to-transparent animate-gold-scan" />
                <QRCodeSVG
                  value={profileUrl}
                  size={212}
                  bgColor="#ffffff"
                  fgColor={theme.qrForeground}
                  level="H"
                  includeMargin={false}
                />
              </div>
            </div>
          </div>
          <div className="mt-5 font-[family-name:var(--font-display)] text-base font-semibold text-velora-text">
            {profile.fullName || "VELORA"}
          </div>
          <div className="mt-1 truncate font-mono text-[11px] text-velora-text-muted">
            {shortUrl}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export function SocialChannelRail({ links }: { links: SocialLink[] }) {
  return (
    <Reveal delay={0.05}>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {links.map((link, index) => (
          <motion.a
            key={`${link.platform}-${index}`}
            href={normalizeExternalHref(link.url)}
            target="_blank"
            rel="noopener noreferrer"
            className="identity-glass-card identity-reflective flex shrink-0 items-center gap-3 rounded-full px-4 py-3"
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.96 }}
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full border text-[10px] font-semibold"
              style={{
                color: link.color || "var(--identity-accent)",
                borderColor: `${link.color || "#d8b56d"}44`,
                backgroundColor: `${link.color || "#d8b56d"}16`,
              }}
            >
              {link.icon || link.platform.slice(0, 2)}
            </span>
            <span className="text-sm font-medium text-velora-text-secondary">
              {link.platform}
            </span>
            <ArrowUpRight size={13} className="text-[var(--identity-accent)]" />
          </motion.a>
        ))}
      </div>
    </Reveal>
  );
}

function LuxuryActionButtons({ actions, t }: { actions: ContactAction[]; t: (key: string) => string }) {
  const visible = actions.slice(0, 4);
  if (!visible.length) return null;

  const getTranslationKey = (key: string) => {
    if (key === "call_clinic") return "btn_call_clinic";
    if (key === "whatsapp") return "btn_whatsapp";
    if (key === "maps") return "btn_open_maps";
    if (key === "booking") return "btn_book_appointment";
    return key;
  };

  return (
    <div className={`mt-6 grid gap-2.5 ${
      visible.length === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3"
    }`}>
      {visible.map((action, index) => {
        const Icon = action.icon;
        const primary = index === 0;

        let buttonClass = "btn-3d-glass";
        if (action.key === "whatsapp") {
          buttonClass = "btn-3d-whatsapp";
        } else if (primary || action.key === "phone" || action.key === "call_clinic") {
          buttonClass = "btn-3d-identity";
        }

        return (
          <motion.a
            key={action.key}
            href={action.href}
            target={action.href.startsWith("http") ? "_blank" : undefined}
            rel={action.href.startsWith("http") ? "noopener noreferrer" : undefined}
            className={`identity-reflective flex h-12 items-center justify-center gap-2 rounded-full px-4 text-xs sm:text-sm font-semibold transition-all duration-200 ${buttonClass}`}
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.25, ease: LUXURY_EASE }}
          >
            <Icon size={15} />
            <span className="truncate">{t(getTranslationKey(action.key)) || action.label}</span>
          </motion.a>
        );
      })}
    </div>
  );
}

function LuxuryBadge({
  children,
  icon: Icon,
}: {
  children: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-velora-gold/30 bg-gradient-to-r from-velora-card to-velora-elevated px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-velora-gold shadow-[0_2px_8px_rgba(0,0,0,0.4)] backdrop-blur-md">
      {Icon && <Icon size={11} className="text-velora-gold" />}
      {children}
    </span>
  );
}

function StatCounter({
  value,
  label,
  suffix = "",
}: {
  value: number;
  label: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.75 });
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return undefined;
    if (reduceMotion) return undefined;

    const controls = animate(0, value, {
      duration: 1.15,
      ease: LUXURY_EASE,
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });

    return () => controls.stop();
  }, [inView, reduceMotion, value]);

  const visibleValue = reduceMotion && inView ? value : display;

  return (
    <div
      ref={ref}
      className="rounded-[18px] border border-white/10 bg-black/22 px-3 py-3 backdrop-blur-md"
    >
      <div className="font-mono text-xl font-semibold text-velora-text">
        {visibleValue}
        {suffix}
      </div>
      <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-velora-text-muted">
        {label}
      </div>
    </div>
  );
}

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
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.22 }}
      transition={{ duration: 0.68, delay, ease: LUXURY_EASE }}
    >
      {children}
    </motion.div>
  );
}

export function getIdentityTheme(mode?: ProfessionalMode): IdentityTheme {
  if (mode && MODE_THEMES[mode]) return MODE_THEMES[mode];
  return MODE_THEMES.entrepreneur;
}

function getContactActions(profile: VeloraProfile): ContactAction[] {
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

function normalizeExternalHref(value?: string) {
  const trimmed = (value || "").trim();
  if (!trimmed) return "";
  if (/^(https?:|mailto:|tel:)/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function getInitials(name?: string) {
  const initials = (name || "V")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  return initials || "V";
}

function BeforeAfterSlider({ t }: { t: (key: string) => string }) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [containerWidth, setContainerWidth] = useState(300);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    setContainerWidth(containerRef.current.offsetWidth);
    
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(position);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.buttons === 1) {
      handleMove(e.clientX);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative aspect-[4/3] w-full overflow-hidden rounded-[20px] border border-white/10 select-none cursor-ew-resize shadow-inner bg-black/40"
      onTouchMove={handleTouchMove}
      onMouseMove={handleMouseMove}
    >
      {/* After image */}
      <img
        src="https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=600&q=80"
        alt="After"
        className="absolute inset-0 h-full w-full object-cover pointer-events-none"
        draggable={false}
      />
      <div className="absolute right-4 bottom-4 z-10 rounded-full bg-black/65 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-velora-gold backdrop-blur-sm">
        {t("after")}
      </div>

      {/* Before image clipped container */}
      <div
        className="absolute inset-y-0 left-0 overflow-hidden pointer-events-none"
        style={{ width: `${sliderPosition}%` }}
      >
        <img
          src="https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80"
          alt="Before"
          className="absolute inset-y-0 left-0 h-full object-cover max-w-none pointer-events-none"
          style={{ width: containerWidth }}
          draggable={false}
        />
        <div className="absolute left-4 bottom-4 z-10 rounded-full bg-black/65 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/70 backdrop-blur-sm">
          {t("before")}
        </div>
      </div>

      {/* Handle */}
      <div
        className="absolute inset-y-0 w-0.5 bg-velora-gold/80 flex items-center justify-center pointer-events-none"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="h-8 w-8 rounded-full border-2 border-velora-gold bg-black/90 flex items-center justify-center shadow-lg text-velora-gold text-sm font-bold pointer-events-auto">
          ↔
        </div>
      </div>
    </div>
  );
}

function ClinicGallery({ t }: { t: (key: string) => string }) {
  const images = [
    "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1579684389782-64d84b5e905d?auto=format&fit=crop&w=600&q=80"
  ];
  
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[20px] border border-white/10 group select-none shadow-md bg-black/40">
      <img 
        src={images[activeIndex]} 
        alt="Clinic Interior" 
        className="h-full w-full object-cover transition-all duration-500" 
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 flex items-center justify-between">
        <span className="text-[10px] font-semibold text-white/80 uppercase tracking-wider">
          {t("section_gallery")}
        </span>
        <div className="flex gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`h-2 w-2 rounded-full transition-all ${
                i === activeIndex ? "bg-velora-gold w-4" : "bg-white/40"
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
