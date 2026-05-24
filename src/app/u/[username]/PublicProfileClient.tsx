"use client";
import { logger } from "@/lib/logger";


import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { ModalPortal } from "@/components/ui/ModalPortal";
import { useScrollLock } from "@/lib/scrollLock";
import {
  AnimatePresence,
  motion,
  type Easing,
  type PanInfo,
} from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Eye,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Play,
  Pencil,
  QrCode,
  Shield,
  Sparkles,
  Star,
  X,
  Users,
  type LucideIcon,
} from "lucide-react";
import { isVideoAsset } from "@/components/profile";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { applyVisualTheme } from "@/themes";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/components/providers/AuthProvider";
import { useProfile } from "@/hooks/useProfile";
import { useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, query, collection, where, limit, type DocumentData } from "firebase/firestore";
import {
  sendContactRequest,
  removeConnection,
  updateConnectionNotesAndTags,
  blockUser,
  onConnectionsChange,
  getDailyStats,
} from "@/lib/firestore";
import type {
  ExperienceEntry,
  PortfolioItem,
  ProfessionalMode,
  SocialLink,
  VeloraProfile,
  DailyStats,
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
  const [connectionsCount, setConnectionsCount] = useState(0);
  const [localTab, setLocalTab] = useState<"overview" | "activity">("overview");
  const [stats, setStats] = useState<DailyStats>({ views: 0, taps: 0, scans: 0, clicks: 0 });

  useEffect(() => {
    if (!profile.id) return;
    getDailyStats(profile.id)
      .then((s) => setStats(s))
      .catch((err) => logger.error("Failed to load daily stats:", err));
  }, [profile.id]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile.syncThemeToPublic && profile.visualTheme) {
      const originalTheme = localStorage.getItem("velora_visual_theme") || "gold";
      applyVisualTheme(profile.visualTheme, false);
      return () => {
        applyVisualTheme(originalTheme, false);
      };
    }
  }, [profile.syncThemeToPublic, profile.visualTheme]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useScrollLock(showAddModal || showEditModal);

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

  // Real-time connections count listener
  useEffect(() => {
    if (!profile.id) return;
    const unsub = onConnectionsChange(profile.id, (conns) => {
      setConnectionsCount(conns.length);
    });
    return () => unsub?.();
  }, [profile.id]);

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
      logger.error(err);
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
      logger.error(e);
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
      logger.error(e);
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
      logger.error(e);
    } finally {
      setLoading(false);
    }
  };

  const theme = getActiveTheme(profile);
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
      className={`luxury-profile min-h-screen bg-velora-black text-velora-text ${
        isRtl ? "rtl" : "ltr"
      }`}
      dir={dir}
      style={themeVars}
    >
      <IdentityHero
        profile={profile}
        portfolioCount={portfolio.length}
        experienceCount={experience.length}
        connectionsCount={connectionsCount}
        onEdit={() => setShowEditModal(true)}
        localTab={localTab}
        setLocalTab={setLocalTab}
      />

      <div className="relative z-10 mx-auto w-full max-w-[980px] px-3 pb-24">
        {localTab === "overview" ? (
          <div className="grid grid-cols-2 gap-3 mt-4">
            
            {/* COLUMN 1 */}
            <div className="space-y-3 col-span-1">
              
              {/* About Block */}
              <div className="relative overflow-hidden rounded-[18px] border border-velora-gold/15 bg-velora-card/90 p-3.5 min-h-[150px] flex flex-col justify-between shadow-md">
                {/* Subtly Moroccan Zellige ornament */}
                <div className="absolute top-0 right-0 w-14 h-14 overflow-hidden pointer-events-none opacity-[0.05] select-none">
                  <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="url(#zellige-grad)" strokeWidth="0.75">
                    <path d="M 50 0 L 64 36 L 100 50 L 64 64 L 50 100 L 36 64 L 0 50 L 36 36 Z" />
                    <path d="M 50 15 L 60 40 L 85 50 L 60 60 L 50 85 L 40 60 L 15 50 L 40 40 Z" />
                    <circle cx="50" cy="50" r="12" />
                    <circle cx="50" cy="50" r="24" strokeDasharray="1, 1.5" />
                  </svg>
                </div>
                <div className="relative z-10">
                  <h3 className="text-xs font-semibold text-velora-text leading-tight">{t("biography_header") || "About"}</h3>
                  <p className="text-[8px] text-[var(--identity-accent)] opacity-80 mb-1.5">Professional synopsis</p>
                  <p className="text-[10px] leading-relaxed text-velora-text-secondary line-clamp-5 whitespace-pre-line">
                    {profile.bio || "Professional synopsis is investing in professional communications, market strategy, and finance education."}
                  </p>
                </div>
                {profile.company && (
                  <div className="text-[8px] text-velora-text-muted mt-2 border-t border-white/5 pt-1.5">
                    {profile.title || "Premium Member"} • {profile.company}
                  </div>
                )}
              </div>

              {/* Skills Block */}
              <div className="relative overflow-hidden rounded-[18px] border border-velora-gold/15 bg-velora-card/90 p-3.5 min-h-[110px] flex flex-col justify-between shadow-md">
                {/* Subtly Moroccan Zellige ornament */}
                <div className="absolute top-0 right-0 w-14 h-14 overflow-hidden pointer-events-none opacity-[0.05] select-none">
                  <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="url(#zellige-grad)" strokeWidth="0.75">
                    <path d="M 50 0 L 64 36 L 100 50 L 64 64 L 50 100 L 36 64 L 0 50 L 36 36 Z" />
                    <path d="M 50 15 L 60 40 L 85 50 L 60 60 L 50 85 L 40 60 L 15 50 L 40 40 Z" />
                    <circle cx="50" cy="50" r="12" />
                    <circle cx="50" cy="50" r="24" strokeDasharray="1, 1.5" />
                  </svg>
                </div>
                <div className="relative z-10">
                  <h3 className="text-xs font-semibold text-velora-text leading-tight">{t("eyebrow_expertise") || "Skills & Endorsements"}</h3>
                  <p className="text-[8px] text-[var(--identity-accent)] opacity-80 mb-2">Core expertise</p>
                  
                  {profile.skills && profile.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {profile.skills.slice(0, 6).map((skill, index) => (
                        <span key={skill} className="inline-flex items-center gap-0.5 rounded-full border border-velora-gold/10 bg-velora-black/50 px-2 py-0.5 text-[8.5px] text-velora-text-secondary">
                          {skill} <span className="text-[7.5px] text-[var(--identity-accent)] opacity-85 font-mono">{[1, 13, 6, 4, 3, 2][index % 6]}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[9px] text-velora-text-muted mt-1">No skills listed yet.</p>
                  )}
                </div>
              </div>

              {/* Experience Block */}
              <div className="relative overflow-hidden rounded-[18px] border border-velora-gold/15 bg-velora-card/90 p-3.5 min-h-[140px] flex flex-col justify-between shadow-md">
                {/* Subtly Moroccan Zellige ornament */}
                <div className="absolute top-0 right-0 w-14 h-14 overflow-hidden pointer-events-none opacity-[0.05] select-none">
                  <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="url(#zellige-grad)" strokeWidth="0.75">
                    <path d="M 50 0 L 64 36 L 100 50 L 64 64 L 50 100 L 36 64 L 0 50 L 36 36 Z" />
                    <path d="M 50 15 L 60 40 L 85 50 L 60 60 L 50 85 L 40 60 L 15 50 L 40 40 Z" />
                    <circle cx="50" cy="50" r="12" />
                    <circle cx="50" cy="50" r="24" strokeDasharray="1, 1.5" />
                  </svg>
                </div>
                <div className="relative z-10">
                  <h3 className="text-xs font-semibold text-velora-text leading-tight">{t("experience") || "Professional Experience"}</h3>
                  <p className="text-[8px] text-[var(--identity-accent)] opacity-80 mb-2">Trajectory history</p>
                  
                  {experience && experience.length > 0 ? (
                    <div className="space-y-2 mt-1">
                      {experience.slice(0, 3).map((exp) => (
                        <div key={exp.id} className="flex items-start gap-2">
                          <div className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded bg-velora-gold/5 text-[var(--identity-accent)] text-[9px] border border-velora-gold/10 font-bold uppercase">
                            {exp.company[0]}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-[9px] font-semibold text-velora-text leading-tight truncate">{exp.role}</h4>
                            <p className="text-[8px] text-velora-text-muted truncate">{exp.company}</p>
                            <p className="text-[7px] text-[var(--identity-accent)] mt-0.5">{exp.startYear} - {exp.isCurrent ? t("present") || "Present" : exp.endYear}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[9px] text-velora-text-muted mt-2">Aucune expérience enregistrée.</p>
                  )}
                </div>
              </div>

              {/* Dentist Clinic Details (if dentist mode) */}
              {profile.professionalMode === "dentist" && (
                <div className="relative overflow-hidden rounded-[18px] border border-velora-gold/15 bg-velora-card/90 p-3.5 min-h-[140px] flex flex-col justify-between shadow-md">
                  {/* Subtly Moroccan Zellige ornament */}
                  <div className="absolute top-0 right-0 w-14 h-14 overflow-hidden pointer-events-none opacity-[0.05] select-none">
                    <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="url(#zellige-grad)" strokeWidth="0.75">
                      <path d="M 50 0 L 64 36 L 100 50 L 64 64 L 50 100 L 36 64 L 0 50 L 36 36 Z" />
                      <path d="M 50 15 L 60 40 L 85 50 L 60 60 L 50 85 L 40 60 L 15 50 L 40 40 Z" />
                      <circle cx="50" cy="50" r="12" />
                      <circle cx="50" cy="50" r="24" strokeDasharray="1, 1.5" />
                    </svg>
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-xs font-semibold text-velora-text leading-tight">{profile.clinicName || "Clinic Details"}</h3>
                    <p className="text-[8px] text-[var(--identity-accent)] opacity-80 mb-2">{profile.specialty || "Specialty Information"}</p>
                    <div className="space-y-1.5 mt-2">
                      {profile.clinicAddress && (
                        <div className="flex items-start gap-1.5 text-[8.5px] text-velora-text-secondary">
                          <MapPin size={9} className="text-[var(--identity-accent)] shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{profile.clinicAddress}</span>
                        </div>
                      )}
                      {profile.workHours && (
                        <div className="flex items-start gap-1.5 text-[8.5px] text-velora-text-secondary">
                          <Clock size={9} className="text-[var(--identity-accent)] shrink-0 mt-0.5" />
                          <span>{profile.workHours}</span>
                        </div>
                      )}
                      {profile.orderNumber && (
                        <div className="text-[7.5px] font-mono text-velora-text-muted mt-1">
                          ONMD N° {profile.orderNumber}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Services Offered Block */}
              <div className="relative overflow-hidden rounded-[18px] border border-velora-gold/15 bg-velora-card/90 p-3.5 min-h-[120px] flex flex-col justify-between shadow-md">
                {/* Subtly Moroccan Zellige ornament */}
                <div className="absolute top-0 right-0 w-14 h-14 overflow-hidden pointer-events-none opacity-[0.05] select-none">
                  <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="url(#zellige-grad)" strokeWidth="0.75">
                    <path d="M 50 0 L 64 36 L 100 50 L 64 64 L 50 100 L 36 64 L 0 50 L 36 36 Z" />
                    <path d="M 50 15 L 60 40 L 85 50 L 60 60 L 50 85 L 40 60 L 15 50 L 40 40 Z" />
                    <circle cx="50" cy="50" r="12" />
                    <circle cx="50" cy="50" r="24" strokeDasharray="1, 1.5" />
                  </svg>
                </div>
                <div className="relative z-10">
                  <h3 className="text-xs font-semibold text-velora-text leading-tight">{t("eyebrow_services") || "Services"}</h3>
                  <p className="text-[8px] text-[var(--identity-accent)] opacity-80 mb-2">Offerings & pricing</p>
                  {(!profile.services || profile.services.length === 0) ? (
                    <p className="text-[9px] text-velora-text-muted mt-2">Aucun service proposé pour le moment.</p>
                  ) : (
                    <div className="space-y-1.5 mt-2">
                      {profile.services.slice(0, 3).map((srv) => (
                        <div key={srv.id} className="flex justify-between items-center bg-white/[0.02] border border-white/5 rounded-md p-1.5">
                          <span className="text-[9px] font-medium text-velora-text leading-tight truncate mr-2">{srv.title}</span>
                          {srv.price && <span className="text-[8px] font-mono text-[var(--identity-accent)] font-semibold shrink-0">{srv.price}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Certifications Block */}
              <div className="relative overflow-hidden rounded-[18px] border border-velora-gold/15 bg-velora-card/90 p-3.5 min-h-[110px] flex flex-col justify-between shadow-md">
                {/* Subtly Moroccan Zellige ornament */}
                <div className="absolute top-0 right-0 w-14 h-14 overflow-hidden pointer-events-none opacity-[0.05] select-none">
                  <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="url(#zellige-grad)" strokeWidth="0.75">
                    <path d="M 50 0 L 64 36 L 100 50 L 64 64 L 50 100 L 36 64 L 0 50 L 36 36 Z" />
                    <path d="M 50 15 L 60 40 L 85 50 L 60 60 L 50 85 L 40 60 L 15 50 L 40 40 Z" />
                    <circle cx="50" cy="50" r="12" />
                    <circle cx="50" cy="50" r="24" strokeDasharray="1, 1.5" />
                  </svg>
                </div>
                <div className="relative z-10">
                  <h3 className="text-xs font-semibold text-velora-text leading-tight">{t("certifications") || "Certifications"}</h3>
                  <p className="text-[8px] text-[var(--identity-accent)] opacity-80 mb-2">Credentials & licensing</p>
                  {(!profile.certifications || profile.certifications.length === 0) ? (
                    <p className="text-[9px] text-velora-text-muted mt-2">Aucune certification enregistrée.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {profile.certifications.map((cert) => (
                        <span key={cert} className="inline-flex items-center gap-0.5 rounded-full border border-velora-gold/10 bg-velora-black/50 px-2 py-0.5 text-[8.5px] text-velora-text-secondary">
                          {cert}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* COLUMN 2 */}
            <div className="space-y-3 col-span-1">
              
              {/* Recent Activity Block */}
              <div className="relative overflow-hidden rounded-[18px] border border-velora-gold/15 bg-velora-card/90 p-3.5 min-h-[190px] flex flex-col justify-between shadow-md">
                {/* Subtly Moroccan Zellige ornament */}
                <div className="absolute top-0 right-0 w-14 h-14 overflow-hidden pointer-events-none opacity-[0.05] select-none">
                  <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="url(#zellige-grad)" strokeWidth="0.75">
                    <path d="M 50 0 L 64 36 L 100 50 L 64 64 L 50 100 L 36 64 L 0 50 L 36 36 Z" />
                    <path d="M 50 15 L 60 40 L 85 50 L 60 60 L 50 85 L 40 60 L 15 50 L 40 40 Z" />
                    <circle cx="50" cy="50" r="12" />
                    <circle cx="50" cy="50" r="24" strokeDasharray="1, 1.5" />
                  </svg>
                </div>
                <div className="relative z-10">
                  <h3 className="text-xs font-semibold text-velora-text leading-tight">{t("recent_activity") || "Recent Activity"}</h3>
                  <p className="text-[8px] text-[var(--identity-accent)] opacity-80 mb-1.5">Posts</p>
                  
                  <div className="space-y-2 mt-1">
                    <div className="flex items-start gap-1.5">
                      <MessageCircle size={10} className="text-[var(--identity-accent)] shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <h4 className="text-[8.5px] font-medium text-velora-text leading-tight truncate">Insights on Global Markets</h4>
                        <p className="text-[7.5px] text-velora-text-muted">Apr 15, 2023</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Globe size={10} className="text-[var(--identity-accent)] shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <h4 className="text-[8.5px] font-medium text-velora-text leading-tight truncate">Future of AI in Finance</h4>
                        <p className="text-[7.5px] text-velora-text-muted">Jan 18, 2023</p>
                      </div>
                    </div>
                  </div>

                  {/* Activity picture placeholder */}
                  <div className="mt-2.5 relative h-12 w-full overflow-hidden rounded-lg border border-white/5 bg-white/5">
                    <img
                      src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=60"
                      alt="Activity visualization"
                      className="h-full w-full object-cover opacity-50"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Velora Network Block */}
              <div className="relative overflow-hidden rounded-[18px] border border-velora-gold/15 bg-velora-card/90 p-3.5 min-h-[110px] flex flex-col justify-between shadow-md">
                {/* Subtly Moroccan Zellige ornament */}
                <div className="absolute top-0 right-0 w-14 h-14 overflow-hidden pointer-events-none opacity-[0.05] select-none">
                  <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="url(#zellige-grad)" strokeWidth="0.75">
                    <path d="M 50 0 L 64 36 L 100 50 L 64 64 L 50 100 L 36 64 L 0 50 L 36 36 Z" />
                    <path d="M 50 15 L 60 40 L 85 50 L 60 60 L 50 85 L 40 60 L 15 50 L 40 40 Z" />
                    <circle cx="50" cy="50" r="12" />
                    <circle cx="50" cy="50" r="24" strokeDasharray="1, 1.5" />
                  </svg>
                </div>
                <div className="relative z-10">
                  <h3 className="text-xs font-semibold text-velora-text leading-tight">{t("network") || "Velora Network"}</h3>
                  <p className="text-[8px] text-[var(--identity-accent)] opacity-80 mb-2">Mutual connections</p>
                  
                  {connectionsCount === 0 ? (
                    <p className="text-[9px] text-velora-text-muted mt-2">Aucun contact dans le réseau pour le moment.</p>
                  ) : (
                    <div className="space-y-1.5 mt-2">
                      <div className="flex items-center gap-2">
                        <Users size={10} className="text-[var(--identity-accent)]" />
                        <span className="text-[9.5px] text-velora-text-secondary font-medium">
                          {connectionsCount} {connectionsCount > 1 ? "connexions actives" : "connexion active"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Analytics Block */}
              <div className="relative overflow-hidden rounded-[18px] border border-velora-gold/15 bg-velora-card/90 p-3.5 min-h-[110px] flex flex-col justify-between shadow-md">
                {/* Subtly Moroccan Zellige ornament */}
                <div className="absolute top-0 right-0 w-14 h-14 overflow-hidden pointer-events-none opacity-[0.05] select-none">
                  <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="url(#zellige-grad)" strokeWidth="0.75">
                    <path d="M 50 0 L 64 36 L 100 50 L 64 64 L 50 100 L 36 64 L 0 50 L 36 36 Z" />
                    <path d="M 50 15 L 60 40 L 85 50 L 60 60 L 50 85 L 40 60 L 15 50 L 40 40 Z" />
                    <circle cx="50" cy="50" r="12" />
                    <circle cx="50" cy="50" r="24" strokeDasharray="1, 1.5" />
                  </svg>
                </div>
                <div className="relative z-10">
                  <h3 className="text-xs font-semibold text-velora-text leading-tight">{t("analytics") || "Live Analytics"}</h3>
                  <p className="text-[8px] text-[var(--identity-accent)] opacity-80 mb-2">Realtime signals</p>
                  
                  {(!stats.views && !stats.clicks) ? (
                    <p className="text-[9px] text-velora-text-muted mt-2">Aucune activité enregistrée aujourd&apos;hui.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-1.5 mt-1">
                      <div className="bg-white/[0.02] border border-white/5 rounded-md p-1.5 text-center">
                        <div className="font-mono text-xs font-semibold text-velora-text">{stats.views || 0}</div>
                        <div className="text-[7px] text-velora-text-muted uppercase tracking-wider mt-0.5">Views</div>
                      </div>
                      <div className="bg-white/[0.02] border border-white/5 rounded-md p-1.5 text-center">
                        <div className="font-mono text-xs font-semibold text-velora-text">{stats.clicks || 0}</div>
                        <div className="text-[7px] text-velora-text-muted uppercase tracking-wider mt-0.5">Clicks</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Portfolio Block */}
              <div className="relative overflow-hidden rounded-[18px] border border-velora-gold/15 bg-velora-card/90 p-3.5 min-h-[130px] flex flex-col justify-between shadow-md">
                {/* Subtly Moroccan Zellige ornament */}
                <div className="absolute top-0 right-0 w-14 h-14 overflow-hidden pointer-events-none opacity-[0.05] select-none">
                  <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="url(#zellige-grad)" strokeWidth="0.75">
                    <path d="M 50 0 L 64 36 L 100 50 L 64 64 L 50 100 L 36 64 L 0 50 L 36 36 Z" />
                    <path d="M 50 15 L 60 40 L 85 50 L 60 60 L 50 85 L 40 60 L 15 50 L 40 40 Z" />
                    <circle cx="50" cy="50" r="12" />
                    <circle cx="50" cy="50" r="24" strokeDasharray="1, 1.5" />
                  </svg>
                </div>
                <div className="relative z-10">
                  <h3 className="text-xs font-semibold text-velora-text leading-tight">{t("portfolio") || "Portfolio"}</h3>
                  <p className="text-[8px] text-[var(--identity-accent)] opacity-80 mb-2">Selected works</p>
                  {(!portfolio || portfolio.length === 0) ? (
                    <div className="flex flex-col items-center justify-center border border-dashed border-velora-gold/10 bg-white/[0.01] rounded-lg p-4 mt-2">
                      <p className="text-[9px] text-velora-text-muted">Aucun projet dans le portfolio pour le moment.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-1 mt-1">
                      {portfolio.slice(0, 2).map((item, i) => (
                        <div key={item.id} className="relative aspect-video rounded overflow-hidden border border-white/5 bg-white/5">
                          <img
                            src={item.imageUrl || PROJECT_FALLBACKS[i % PROJECT_FALLBACKS.length]}
                            alt={item.title}
                            className="h-full w-full object-cover opacity-80"
                            onError={(e) => {
                              e.currentTarget.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=60";
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Reputation & Trust Block */}
              <div className="relative overflow-hidden rounded-[18px] border border-velora-gold/15 bg-velora-card/90 p-3.5 min-h-[110px] flex flex-col justify-between shadow-md">
                {/* Subtly Moroccan Zellige ornament */}
                <div className="absolute top-0 right-0 w-14 h-14 overflow-hidden pointer-events-none opacity-[0.05] select-none">
                  <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="url(#zellige-grad)" strokeWidth="0.75">
                    <path d="M 50 0 L 64 36 L 100 50 L 64 64 L 50 100 L 36 64 L 0 50 L 36 36 Z" />
                    <path d="M 50 15 L 60 40 L 85 50 L 60 60 L 50 85 L 40 60 L 15 50 L 40 40 Z" />
                    <circle cx="50" cy="50" r="12" />
                    <circle cx="50" cy="50" r="24" strokeDasharray="1, 1.5" />
                  </svg>
                </div>
                <div className="relative z-10">
                  <h3 className="text-xs font-semibold text-velora-text leading-tight">{t("trust_alignment") || "Reputation & Trust"}</h3>
                  <p className="text-[8px] text-[var(--identity-accent)] opacity-80 mb-1.5">Verified credentials</p>
                  
                  <div className="space-y-1 mt-1">
                    {profile.isVerified || profile.isPremium ? (
                      <>
                        <div className="flex justify-between text-[8px] text-velora-text-muted">
                          <span>Rating</span>
                          <span className="text-[var(--identity-accent)] font-semibold">{profile.isVerified ? "100%" : "96%"}</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-velora-gold to-[#fff1c2] rounded-full" style={{ width: profile.isVerified ? "100%" : "96%" }} />
                        </div>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {profile.isVerified && (
                            <span className="inline-flex items-center gap-0.5 text-[7px] uppercase font-bold text-velora-text-secondary bg-white/5 border border-white/10 px-1 py-0.5 rounded">
                              <Shield size={7} className="text-[var(--identity-accent)]" />
                              {t("verified")}
                            </span>
                          )}
                          {profile.isPremium && (
                            <span className="inline-flex items-center gap-0.5 text-[7px] uppercase font-bold text-velora-text-secondary bg-white/5 border border-white/10 px-1 py-0.5 rounded">
                              <Star size={7} className="text-[var(--identity-accent)]" />
                              {t("premium")}
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-[9px] text-velora-text-muted mt-1.5">Aucun label de certification officielle.</p>
                    )}
                  </div>
                </div>
              </div>

            </div>

          </div>
        ) : (
          /* Activity Feed details */
          <div className="space-y-3 mt-4">
            <div className="relative overflow-hidden rounded-[18px] border border-velora-gold/15 bg-velora-card/90 p-4 shadow-md">
              <h3 className="text-xs font-semibold text-velora-text leading-tight mb-3">Activity Timeline</h3>
              <div className="space-y-4">
                <div className="border-l border-velora-gold/20 pl-3 py-1 relative">
                  <div className="absolute left-[-4.5px] top-1.5 w-2 h-2 rounded-full bg-[var(--identity-accent)]" />
                  <span className="text-[8px] text-[var(--identity-accent)] font-semibold">Apr 15, 2023</span>
                  <h4 className="text-xs font-semibold text-velora-text mt-0.5">Insights on Global Markets</h4>
                  <p className="text-[10px] text-velora-text-secondary mt-1">Published deep analysis on the global economic shift and trade routes.</p>
                </div>
                <div className="border-l border-velora-gold/20 pl-3 py-1 relative">
                  <div className="absolute left-[-4.5px] top-1.5 w-2 h-2 rounded-full bg-[var(--identity-accent)]" />
                  <span className="text-[8px] text-[var(--identity-accent)] font-semibold">Jan 18, 2023</span>
                  <h4 className="text-xs font-semibold text-velora-text mt-0.5">Future of AI in Finance</h4>
                  <p className="text-[10px] text-velora-text-secondary mt-1">Presented at the annual FinTech forum on AI integration in private banking systems.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Connection Modal */}
      <AnimatePresence>
        {showAddModal && (
          <ModalPortal>
            <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
              <motion.div
                className="fixed inset-0 bg-black/75"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAddModal(false)}
                style={{ willChange: "opacity" }}
              />
              <motion.div
                className="relative z-10 w-full flex flex-col max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-3.5rem)] rounded-[24px] border border-white/10 bg-velora-dark p-6 shadow-2xl md:max-w-md md:rounded-[24px] overflow-hidden"
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 24, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                style={{ willChange: "transform, opacity" }}
              >
                <div className="glow-layer pointer-events-none absolute inset-x-8 -top-16 h-36 rounded-full bg-[rgba(var(--identity-accent-rgb),0.1)] blur-xl" />
              
              <div className="flex shrink-0 items-center justify-between border-b border-white/5 pb-4">
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
              
              <div className="mt-4 space-y-4 flex-1 overflow-y-auto pr-1">
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

              <div className="mt-6 flex gap-3 shrink-0">
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
          </ModalPortal>
        )}
      </AnimatePresence>

      {/* Edit Connection Modal */}
      <AnimatePresence>
        {showEditModal && (
          <ModalPortal>
            <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
              <motion.div
                className="fixed inset-0 bg-black/75"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowEditModal(false)}
                style={{ willChange: "opacity" }}
              />
              <motion.div
                className="relative z-10 w-full flex flex-col max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-3.5rem)] rounded-[24px] border border-white/10 bg-velora-dark p-6 shadow-2xl md:max-w-md md:rounded-[24px] overflow-hidden"
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 24, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                style={{ willChange: "transform, opacity" }}
              >
                <div className="glow-layer pointer-events-none absolute inset-x-8 -top-16 h-36 rounded-full bg-[rgba(var(--identity-accent-rgb),0.1)] blur-xl" />
              
              <div className="flex shrink-0 items-center justify-between border-b border-white/5 pb-4">
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
              
              <div className="mt-4 space-y-4 flex-1 overflow-y-auto pr-1">
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

              <div className="mt-6 flex flex-col gap-2 shrink-0">
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
          </ModalPortal>
        )}
      </AnimatePresence>
    </main>
  );
}

export function IdentityHero({
  profile,
  portfolioCount,
  experienceCount,
  connectionsCount = 0,
  onEdit,
  onEditAvatar,
  localTab = "overview",
  setLocalTab,
}: {
  profile: VeloraProfile;
  portfolioCount: number;
  experienceCount: number;
  connectionsCount?: number;
  onEdit?: () => void;
  onEditAvatar?: () => void;
  localTab?: "overview" | "activity";
  setLocalTab?: (tab: "overview" | "activity") => void;
}) {
  const heroRef = useRef<HTMLElement>(null);

  return (
    <section
      ref={heroRef}
      className="relative overflow-hidden bg-[#0D0D0A] pt-4 pb-2 border-b border-white/5"
    >
      {/* Hidden global metallic gradient definitions */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <linearGradient id="zellige-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C4A265" />
            <stop offset="50%" stopColor="#FFF1C2" />
            <stop offset="100%" stopColor="#9D8460" />
          </linearGradient>
        </defs>
      </svg>
      {/* 1. Header Row */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-base tracking-tight text-[#C4A265]">Velora</span>
          <span className="bg-[#2B2316] text-[#C4A265] border border-[#C4A265]/20 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
            Gold
          </span>
        </div>
        <span className="text-xs font-semibold text-velora-text uppercase tracking-wider">Profile</span>
        <div className="flex items-center gap-3">
          {/* Bell Icon */}
          <button className="text-velora-text-muted hover:text-velora-text transition-colors">
            <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          </button>
          {/* Gear Settings Icon */}
          <button onClick={onEdit} className="text-velora-text-muted hover:text-velora-text transition-colors">
            <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.99l1.005.831a1.125 1.125 0 01.26 1.43l-1.297 2.247a1.125 1.125 0 01-1.37.491l-1.216-.456c-.356-.133-.751-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.83c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.831a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.645-.869l.213-1.28z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* 2. Hero Profile Info Row */}
      <div className="px-4 py-4 flex items-center gap-4">
        {/* Left: Avatar with Double Gold Ring & Badge */}
        <div className="relative shrink-0">
          <div className="h-20 w-20 rounded-full p-[2px] bg-gradient-to-tr from-[#C4A265] to-[#fff1c2] border border-[#C4A265]/30">
            <div className="h-full w-full rounded-full bg-black p-[2.5px]">
              <div className="h-full w-full rounded-full overflow-hidden bg-velora-surface relative">
                {profile.avatarUrl ? (
                  <OptimizedImage
                    src={profile.avatarUrl}
                    type="avatar"
                    className="h-full w-full object-cover"
                    alt={profile.fullName}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#111] font-[family-name:var(--font-display)] text-xl font-semibold text-[#C4A265]">
                    {getInitials(profile.fullName)}
                  </div>
                )}
              </div>
            </div>
          </div>
          {onEditAvatar && (
            <motion.button
              type="button"
              aria-label="Edit photo"
              title="Edit photo"
              onClick={onEditAvatar}
              whileHover={{ y: -1, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="absolute bottom-0 right-0 z-20 flex h-6.5 w-6.5 items-center justify-center rounded-full border border-velora-gold/35 bg-[linear-gradient(135deg,var(--color-velora-gold-dim),rgba(255,255,255,0.06))] text-velora-gold shadow-[0_4px_12px_rgba(0,0,0,0.18),0_0_8px_var(--color-velora-gold-glow)] backdrop-blur-md transition-colors duration-300 hover:border-velora-gold/60 hover:bg-velora-gold/16 focus:border-velora-gold/70"
            >
              <Pencil size={11} />
            </motion.button>
          )}
          {/* Small Gold badge overlap */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#C4A265] to-[#fff1c2] text-velora-black text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full border border-black shadow-md tracking-wider">
            Gold
          </div>
        </div>

        {/* Right: Info + Stats */}
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold text-[#C4A265] tracking-wide truncate">
            {profile.fullName || "Eleanor Thorne"}
          </h1>
          <p className="text-[11px] text-velora-text-secondary truncate mt-0.5 font-medium leading-none">
            {profile.title || "Executive Director"} | {profile.company || "Global Strategies"}
          </p>
          
          {/* Location */}
          <div className="text-[9.5px] text-velora-text-muted mt-1.5 flex items-center gap-1 leading-none">
            <MapPin size={10} className="text-[#C4A265]" />
            <span>{profile.location || "New York, USA"}</span>
          </div>

          {/* Stats row */}
          <div className="flex gap-4 mt-3">
            <div>
              <span className="block text-sm font-semibold text-[#C4A265] leading-none">
                {connectionsCount}
              </span>
              <span className="text-[8px] text-velora-text-muted mt-0.5 block leading-none">Connections</span>
            </div>
            <div>
              <span className="block text-sm font-semibold text-[#C4A265] leading-none">
                {portfolioCount}
              </span>
              <span className="text-[8px] text-velora-text-muted mt-0.5 block leading-none">Projects</span>
            </div>
            <div>
              <span className="block text-sm font-semibold text-[#C4A265] leading-none">
                {experienceCount}
              </span>
              <span className="text-[8px] text-velora-text-muted mt-0.5 block leading-none">Experience</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Tab Selector */}
      <div className="px-4 py-2 flex justify-center">
        <div className="flex bg-[#161512] p-0.5 rounded-full w-full max-w-[320px] border border-white/5">
          <button
            onClick={() => setLocalTab?.("overview")}
            className={`flex-1 text-center py-1.5 rounded-full text-xs font-semibold transition-all ${
              localTab === "overview"
                ? "bg-[#2B2316] text-[#C4A265] border border-[#C4A265]/20 shadow-md"
                : "text-velora-text-muted hover:text-velora-text-secondary"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setLocalTab?.("activity")}
            className={`flex-1 text-center py-1.5 rounded-full text-xs font-semibold transition-all ${
              localTab === "activity"
                ? "bg-[#2B2316] text-[#C4A265] border border-[#C4A265]/20 shadow-md"
                : "text-velora-text-muted hover:text-velora-text-secondary"
            }`}
          >
            Activity
          </button>
        </div>
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
            className="identity-reflective rounded-full border border-[rgba(var(--identity-accent-rgb),0.2)] bg-[var(--theme-bg)] px-4 py-2 text-xs font-medium text-velora-text-secondary"
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

  useScrollLock(activeIndex !== null);

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
                  <span className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/85 text-[var(--identity-accent)]">
                    <Play size={15} fill="currentColor" />
                  </span>
                )}
              </div>
              <div className="absolute inset-x-0 bottom-0 p-5">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--identity-accent)]">
                    {project.category || "Project"}
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/12 bg-[var(--theme-bg)] text-velora-text">
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
      className="fixed inset-0 z-[260] bg-black/95"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="relative flex h-full flex-col">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-30 flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-black/75 text-velora-text"
          aria-label="Close portfolio preview"
        >
          <X size={18} />
        </button>

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => onMove(-1)}
              className="absolute left-4 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/12 bg-black/75 text-velora-text"
              aria-label="Previous project"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => onMove(1)}
              className="absolute right-4 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/12 bg-black/75 text-velora-text"
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
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
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
                className="identity-reflective mt-5 inline-flex items-center gap-2 rounded-full border border-[rgba(var(--identity-accent-rgb),0.28)] bg-[rgba(var(--identity-accent-rgb),0.2)] px-4 py-2.5 text-xs font-semibold text-[var(--identity-accent)]"
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
        heroGradient: "radial-gradient(circle at 50% 22%, rgba(217,119,6,0.24), transparent 34%), linear-gradient(142deg, #030302 0%, #171008 36%, #060505 100%)",
        atmosphere: "radial-gradient(circle, rgba(217,119,6,0.3) 0%, rgba(217,119,6,0.12) 38%, transparent 70%)",
        badge: "Terra Elite",
        qrForeground: "#0c0b0a",
      };
    }
    if (themeId === "medical") return MODE_THEMES.dentist;
    if (themeId === "noir") return MODE_THEMES.vip;
  }
  return modeTheme;
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

