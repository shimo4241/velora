"use client";

import { logger } from "@/lib/logger";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence } from "framer-motion";
import { ChevronLeft, Users, Clock, MapPin, MessageCircle, Globe, Shield, Star } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/providers/AuthProvider";
import { useProfile } from "@/hooks/useProfile";
import { useFirestoreListener } from "@/hooks/useFirestoreListener";
import { useCanGoBack } from "@/hooks/useCanGoBack";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";

import {
  EMPTY_PUBLIC_RELATIONSHIP_STATE,
  sendContactRequest,
  removeConnection,
  updateConnectionNotesAndTags,
  blockUser,
  onConnectionsChange,
  onPublicRelationshipChange,
  getDailyStats,
} from "@/services";

import type {
  ExperienceEntry,
  PortfolioItem,
  VeloraProfile,
  DailyStats,
} from "@/types";

import {
  getActiveTheme,
  PROJECT_FALLBACKS,
  type CssVarStyle,
} from "@/components/features/profile/public/publicShared";

// Static Section Imports
import IdentityHero from "@/components/features/profile/public/IdentityHero";

// Lazy-loaded modals for performance optimization
const ConnectionAddModal = dynamic(
  () => import("@/components/features/profile/public/modals/ConnectionAddModal"),
  { ssr: false }
);
const ConnectionEditModal = dynamic(
  () => import("@/components/features/profile/public/modals/ConnectionEditModal"),
  { ssr: false }
);

interface PublicProfileClientProps {
  profile: VeloraProfile;
  portfolio: PortfolioItem[];
  experience: ExperienceEntry[];
}

export default function PublicProfileClient({
  profile,
  portfolio,
  experience,
}: PublicProfileClientProps) {
  const { t, dir, isRtl } = useTranslation(profile.locale || "fr");
  const { user } = useAuth();
  const { profile: currentUserProfile } = useProfile();
  const searchParams = useSearchParams();
  const source = searchParams?.get("src") || null;
  const router = useRouter();
  const showBackButton = useCanGoBack();

  const [localTab, setLocalTab] = useState<"overview" | "activity">("overview");
  const [stats, setStats] = useState<DailyStats>({ views: 0, taps: 0, scans: 0, clicks: 0 });

  useEffect(() => {
    if (!profile.id) return;
    getDailyStats(profile.id)
      .then((s) => setStats(s))
      .catch((err) => logger.error("Failed to load daily stats:", err));
  }, [profile.id]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [addLocationName, setAddLocationName] = useState("");
  const addEventName = "";

  const uid = user?.uid ?? null;
  const relationshipSnapshot = useFirestoreListener(
    uid && profile.id && uid !== profile.id ? `public-relationship:${uid}:${profile.id}` : null,
    uid && profile.id && uid !== profile.id
      ? (onNext, onError) => onPublicRelationshipChange(uid, profile.id, onNext, onError)
      : null,
    EMPTY_PUBLIC_RELATIONSHIP_STATE
  );
  const relationshipState = relationshipSnapshot.data ?? EMPTY_PUBLIC_RELATIONSHIP_STATE;
  const relationship = relationshipState.relationship;
  const connectionsCountSnapshot = useFirestoreListener<number>(
    profile.id ? `public-connections-count:${profile.id}` : null,
    profile.id
      ? (onNext, onError) => onConnectionsChange(profile.id, (connections) => onNext(connections.length), onError)
      : null,
    0
  );
  const connectionsCount = connectionsCountSnapshot.data ?? 0;

  // Suggest adding to network if opened via QR/NFC
  useEffect(() => {
    if (!user?.uid || !profile.id || user.uid === profile.id) return;
    if (relationship.status === "none" && (source === "qr" || source === "nfc")) {
      const timer = setTimeout(() => {
        setAddLocationName(source === "qr" ? "QR Scan" : "NFC Tap");
        setShowAddModal(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user?.uid, profile.id, relationship.status, source]);

  const handleSendRequest = async (data: {
    notes: string;
    tags: string[];
    locationName: string;
    eventName: string;
  }) => {
    if (!user?.uid || !currentUserProfile) return;
    try {
      await sendContactRequest({
        senderId: user.uid,
        receiverId: profile.id,
        senderProfile: currentUserProfile,
        receiverProfile: profile,
        method: source === "qr" ? "qr" : source === "nfc" ? "nfc" : "link",
        event: data.eventName,
        locationName: data.locationName || (source === "qr" ? "QR Code" : source === "nfc" ? "NFC" : "Velora Link"),
        personalNote: data.notes,
        tags: data.tags,
      });
      setShowAddModal(false);
      navigator.vibrate?.(24);
    } catch (err) {
      logger.error(err);
    }
  };

  const handleSaveConnection = async (notesVal: string, tagsVal: string[]) => {
    if (!user?.uid) return;
    try {
      await updateConnectionNotesAndTags(user.uid, profile.id, notesVal, tagsVal);
      setShowEditModal(false);
    } catch (e) {
      logger.error(e);
    }
  };

  const handleRemoveConnection = async () => {
    if (!user?.uid) return;
    try {
      await removeConnection(user.uid, profile.id);
      setShowEditModal(false);
    } catch (e) {
      logger.error(e);
    }
  };

  const handleBlockUser = async () => {
    if (!user?.uid) return;
    try {
      await blockUser(user.uid, profile.id);
      setShowEditModal(false);
    } catch (e) {
      logger.error(e);
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
      className={`luxury-profile min-h-screen bg-velora-black text-velora-text relative ${
        isRtl ? "rtl" : "ltr"
      }`}
      dir={dir}
      style={themeVars}
    >
      {showBackButton && (
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-velora-text border border-white/10 backdrop-blur-md transition-all"
          aria-label={t("back") || "Back"}
        >
          <ChevronLeft size={20} />
        </button>
      )}
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
                    <Image
                      src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=60"
                      alt="Activity visualization"
                      fill
                      sizes="(max-width: 768px) 50vw, 220px"
                      className="object-cover opacity-50"
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
                          <Image
                            src={item.imageUrl || PROJECT_FALLBACKS[i % PROJECT_FALLBACKS.length]}
                            alt={item.title}
                            fill
                            sizes="(max-width: 768px) 45vw, 220px"
                            className="object-cover opacity-80"
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
          <ConnectionAddModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onSave={handleSendRequest}
            initialLocationName={addLocationName}
            initialEventName={addEventName}
            theme={theme}
            t={t}
          />
        )}
      </AnimatePresence>

      {/* Edit Connection Modal */}
      <AnimatePresence>
        {showEditModal && (
          <ConnectionEditModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            initialNotes={relationshipState.notes}
            initialTags={relationshipState.selectedTags}
            locationName={relationshipState.locationName}
            eventName={relationshipState.eventName}
            onSave={handleSaveConnection}
            onRemove={handleRemoveConnection}
            onBlock={handleBlockUser}
            theme={theme}
            t={t}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
