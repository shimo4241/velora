"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import {
  Check,
  Clock,
  Globe,
  LogOut,
  MapPin,
  MessageCircle,
  Shield,
  Star,
  Users,
} from "lucide-react";
import IdentityHero from "@/components/features/profile/public/IdentityHero";
import {
  Reveal,
  getIdentityTheme,
  getActiveTheme,
} from "@/components/features/profile/public/publicShared";
import {
  FloatingEditButton,
  ProfileEditorSheet,
  type ProfileEditorSection,
} from "@/components/features/profile/ProfileEditor";
import { useAuth } from "@/providers/AuthProvider";
import { useTranslation } from "@/lib/i18n";
import { ProfileCompletionCard } from "@/components/features/profile/ProfileCompletionCard";

import { EditProfileScreen } from "./EditProfileScreen";
import { SettingsScreen } from "@/components/features/settings/SettingsScreen";
import { useConnections } from "@/hooks/useConnections";
import { usePortfolio, useExperience, useProfile } from "@/hooks/useProfile";
import { useStats } from "@/hooks/useStats";
import {
  addExperienceEntry,
  addPortfolioItem,
  deleteExperienceEntry,
  deletePortfolioItem,
  updateExperienceEntry,
  updatePortfolioItem,
} from "@/services";
import type {
  ExperienceEntry,
  PortfolioItem,
  VeloraProfile,
  AppTab,
} from "@/types";

type IdentityVarStyle = CSSProperties & Record<`--${string}`, string>;

const PROJECT_FALLBACKS = ["/portfolio-1.png", "/portfolio-2.png"];

export function ProfileScreen({ onNavigate }: { onNavigate?: (tab: AppTab) => void } = {}) {
  const {
    profile,
    isProfileReady,
    updateProfile,
    uploadAvatar,
    uploadCover,
    uploadPortfolioImage,
  } = useProfile();
  const { user, signOut } = useAuth();
  const { portfolio } = usePortfolio();
  const { experience } = useExperience();
  const { count: connectionsCount } = useConnections();
  const { stats } = useStats();
  const { t } = useTranslation(profile?.locale || "fr");
  const [editingSection, setEditingSection] = useState<ProfileEditorSection | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showFullEdit, setShowFullEdit] = useState(false);
  const [localTab, setLocalTab] = useState<"overview" | "activity">("overview");
  const [profileOverride, setProfileOverride] =
    useState<Partial<Omit<VeloraProfile, "id" | "username">>>({});
  const [portfolioOverride, setPortfolioOverride] = useState<PortfolioItem[] | null>(null);
  const [experienceOverride, setExperienceOverride] = useState<ExperienceEntry[] | null>(null);

  const effectiveProfile = useMemo(() => {
    if (!profile) return null;
    return { ...profile, ...profileOverride } as VeloraProfile;
  }, [profile, profileOverride]);

  const effectivePortfolio = portfolioOverride ?? portfolio;
  const effectiveExperience = experienceOverride ?? experience;
  const theme = useMemo(
    () => {
      if (!effectiveProfile) return getIdentityTheme();
      return getActiveTheme(effectiveProfile);
    },
    [effectiveProfile]
  );
  const themeVars = useMemo(
    () =>
      ({
        "--identity-accent": theme.accent,
        "--identity-accent-rgb": theme.accentRgb,
        "--identity-secondary": theme.secondary,
        "--identity-secondary-rgb": theme.secondaryRgb,
        "--identity-muted": theme.muted,
      }) as IdentityVarStyle,
    [theme]
  );

  if (!isProfileReady || !profile || !effectiveProfile) return null;

  const handleSaveProfile = async (data: Partial<Omit<VeloraProfile, "id" | "username">>) => {
    const previousOverride = profileOverride;
    setProfileOverride((current) => ({ ...current, ...data }));

    try {
      await updateProfile(data);
    } catch (error) {
      setProfileOverride(previousOverride);
      throw error;
    }
  };

  const handleSavePortfolio = async (items: PortfolioItem[]) => {
    if (!user) throw new Error("Unauthenticated");
    const previous = effectivePortfolio;
    setPortfolioOverride(items);

    try {
      const existingIds = new Set(portfolio.map((item) => item.id));
      const nextPersisted: PortfolioItem[] = [];

      for (const item of items) {
        const payload = {
          title: item.title,
          category: item.category || "General",
          description: item.description || "",
          imageUrl: item.imageUrl || "",
          link: item.link || "",
          order: item.order ?? nextPersisted.length,
        };

        if (existingIds.has(item.id)) {
          await updatePortfolioItem(user.uid, item.id, payload);
          nextPersisted.push(item);
        } else {
          const id = await addPortfolioItem(user.uid, payload);
          nextPersisted.push({ ...item, id });
        }
      }

      const nextExistingIds = new Set(
        items.filter((item) => existingIds.has(item.id)).map((item) => item.id)
      );
      await Promise.all(
        portfolio
          .filter((item) => !nextExistingIds.has(item.id))
          .map((item) => deletePortfolioItem(user.uid, item.id))
      );

      setPortfolioOverride(nextPersisted);
    } catch (error) {
      setPortfolioOverride(previous);
      throw error;
    }
  };

  const handleSaveExperience = async (items: ExperienceEntry[]) => {
    if (!user) throw new Error("Unauthenticated");
    const previous = effectiveExperience;
    setExperienceOverride(items);

    try {
      const existingIds = new Set(experience.map((item) => item.id));
      const nextPersisted: ExperienceEntry[] = [];

      for (const item of items) {
        const payload = {
          company: item.company,
          role: item.role,
          description: item.description || "",
          startYear: item.startYear,
          endYear: item.isCurrent ? undefined : item.endYear,
          isCurrent: item.isCurrent,
          order: item.order ?? nextPersisted.length,
        };

        if (existingIds.has(item.id)) {
          await updateExperienceEntry(user.uid, item.id, payload);
          nextPersisted.push(item);
        } else {
          const id = await addExperienceEntry(user.uid, payload);
          nextPersisted.push({ ...item, id });
        }
      }

      const nextExistingIds = new Set(
        items.filter((item) => existingIds.has(item.id)).map((item) => item.id)
      );
      await Promise.all(
        experience
          .filter((item) => !nextExistingIds.has(item.id))
          .map((item) => deleteExperienceEntry(user.uid, item.id))
      );

      setExperienceOverride(nextPersisted);
    } catch (error) {
      setExperienceOverride(previous);
      throw error;
    }
  };

  return (
    <main
      className="luxury-profile min-h-screen bg-velora-black text-velora-text safe-bottom"
      style={themeVars}
    >
      <IdentityHero
        profile={effectiveProfile}
        portfolioCount={effectivePortfolio.length}
        experienceCount={effectiveExperience.length}
        connectionsCount={connectionsCount}
        onEdit={() => setShowSettings(true)}
        onEditAvatar={() => setShowFullEdit(true)}
        localTab={localTab}
        setLocalTab={setLocalTab}
      />

      <div className="relative z-10 mx-auto w-full max-w-[980px] px-3 pb-24">
        {localTab === "overview" ? (
          <div className="grid grid-cols-2 gap-3 mt-4">
            
            {/* COLUMN 1 */}
            <div className="space-y-3 col-span-1">
              
              {/* About Block */}
              <OwnerEditableSurface editLabel={t("edit_bio")} onEdit={() => setEditingSection("bio")} buttonClassName="right-2 top-2">
                <div className="relative overflow-hidden rounded-[18px] border border-[var(--theme-accent)]/15 bg-velora-card/90 p-3.5 min-h-[150px] flex flex-col justify-between shadow-md">
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
                      {effectiveProfile.bio || "Professional synopsis is investing in professional communications, market strategy, and finance education."}
                    </p>
                  </div>
                  {effectiveProfile.company && (
                    <div className="text-[8px] text-velora-text-muted mt-2 border-t border-white/5 pt-1.5">
                      {effectiveProfile.title || "Premium Member"} • {effectiveProfile.company}
                    </div>
                  )}
                </div>
              </OwnerEditableSurface>

              {/* Skills Block */}
              <OwnerEditableSurface editLabel={t("edit_skills")} onEdit={() => setEditingSection("skills")} buttonClassName="right-2 top-2">
                <div className="relative overflow-hidden rounded-[18px] border border-[var(--theme-accent)]/15 bg-velora-card/90 p-3.5 min-h-[110px] flex flex-col justify-between shadow-md">
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
                    
                    {effectiveProfile.skills && effectiveProfile.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {effectiveProfile.skills.slice(0, 6).map((skill, index) => (
                          <span key={skill} className="inline-flex items-center gap-0.5 rounded-full border border-[var(--theme-accent)]/10 bg-velora-black/50 px-2 py-0.5 text-[8.5px] text-velora-text-secondary">
                            {skill} <span className="text-[7.5px] text-[var(--identity-accent)] opacity-85 font-mono">{[1, 13, 6, 4, 3, 2][index % 6]}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[9px] text-velora-text-muted mt-1">No skills listed yet.</p>
                    )}
                  </div>
                </div>
              </OwnerEditableSurface>

              {/* Experience Block */}
              <OwnerEditableSurface editLabel={t("edit_experience")} onEdit={() => setEditingSection("experience")} buttonClassName="right-2 top-2">
                <div className="relative overflow-hidden rounded-[18px] border border-[var(--theme-accent)]/15 bg-velora-card/90 p-3.5 min-h-[140px] flex flex-col justify-between shadow-md">
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
                    
                    {effectiveExperience && effectiveExperience.length > 0 ? (
                      <div className="space-y-2 mt-1">
                        {effectiveExperience.slice(0, 3).map((exp) => (
                          <div key={exp.id} className="flex items-start gap-2">
                            <div className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded bg-[var(--theme-accent)]/5 text-[var(--identity-accent)] text-[9px] border border-[var(--theme-accent)]/10 font-bold uppercase">
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
              </OwnerEditableSurface>

              {/* Dentist Clinic Details (if dentist mode) */}
              {effectiveProfile.professionalMode === "dentist" && (
                <OwnerEditableSurface editLabel={t("edit_clinic")} onEdit={() => setShowFullEdit(true)} buttonClassName="right-2 top-2">
                  <div className="relative overflow-hidden rounded-[18px] border border-[var(--theme-accent)]/15 bg-velora-card/90 p-3.5 min-h-[140px] flex flex-col justify-between shadow-md">
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
                      <h3 className="text-xs font-semibold text-velora-text leading-tight">{effectiveProfile.clinicName || "Clinic Details"}</h3>
                      <p className="text-[8px] text-[var(--identity-accent)] opacity-80 mb-2">{effectiveProfile.specialty || "Specialty Information"}</p>
                      <div className="space-y-1.5 mt-2">
                        {effectiveProfile.clinicAddress && (
                          <div className="flex items-start gap-1.5 text-[8.5px] text-velora-text-secondary">
                            <MapPin size={9} className="text-[var(--identity-accent)] shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{effectiveProfile.clinicAddress}</span>
                          </div>
                        )}
                        {effectiveProfile.workHours && (
                          <div className="flex items-start gap-1.5 text-[8.5px] text-velora-text-secondary">
                            <Clock size={9} className="text-[var(--identity-accent)] shrink-0 mt-0.5" />
                            <span>{effectiveProfile.workHours}</span>
                          </div>
                        )}
                        {effectiveProfile.orderNumber && (
                          <div className="text-[7.5px] font-mono text-velora-text-muted mt-1">
                            ONMD N° {effectiveProfile.orderNumber}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </OwnerEditableSurface>
              )}

              {/* Services Offered Block */}
              <OwnerEditableSurface editLabel={t("edit_services")} onEdit={() => setEditingSection("services")} buttonClassName="right-2 top-2">
                <div className="relative overflow-hidden rounded-[18px] border border-[var(--theme-accent)]/15 bg-velora-card/90 p-3.5 min-h-[120px] flex flex-col justify-between shadow-md">
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
                    {(!effectiveProfile.services || effectiveProfile.services.length === 0) ? (
                      <p className="text-[9px] text-velora-text-muted mt-2">Aucun service proposé pour le moment.</p>
                    ) : (
                      <div className="space-y-1.5 mt-2">
                        {effectiveProfile.services.slice(0, 3).map((srv) => (
                          <div key={srv.id} className="flex justify-between items-center bg-white/[0.02] border border-white/5 rounded-md p-1.5">
                            <span className="text-[9px] font-medium text-velora-text leading-tight truncate mr-2">{srv.title}</span>
                            {srv.price && <span className="text-[8px] font-mono text-[var(--identity-accent)] font-semibold shrink-0">{srv.price}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </OwnerEditableSurface>

              {/* Certifications Block */}
              <OwnerEditableSurface editLabel={t("edit_profile_skills_title") || "Certifications"} onEdit={() => setShowFullEdit(true)} buttonClassName="right-2 top-2">
                <div className="relative overflow-hidden rounded-[18px] border border-[var(--theme-accent)]/15 bg-velora-card/90 p-3.5 min-h-[110px] flex flex-col justify-between shadow-md">
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
                    {(!effectiveProfile.certifications || effectiveProfile.certifications.length === 0) ? (
                      <p className="text-[9px] text-velora-text-muted mt-2">Aucune certification enregistrée.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {effectiveProfile.certifications.map((cert) => (
                          <span key={cert} className="inline-flex items-center gap-0.5 rounded-full border border-[var(--theme-accent)]/10 bg-velora-black/50 px-2 py-0.5 text-[8.5px] text-velora-text-secondary">
                            {cert}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </OwnerEditableSurface>

            </div>

            {/* COLUMN 2 */}
            <div className="space-y-3 col-span-1">
              <ProfileCompletionCard
                profile={effectiveProfile}
                onEditSection={setEditingSection}
                onNavigate={onNavigate || (() => {})}
              />
              
              {/* Recent Activity Block */}
              <div className="relative overflow-hidden rounded-[18px] border border-[var(--theme-accent)]/15 bg-velora-card/90 p-3.5 min-h-[190px] flex flex-col justify-between shadow-md">
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
              <div className="relative overflow-hidden rounded-[18px] border border-[var(--theme-accent)]/15 bg-velora-card/90 p-3.5 min-h-[110px] flex flex-col justify-between shadow-md">
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
              <div className="relative overflow-hidden rounded-[18px] border border-[var(--theme-accent)]/15 bg-velora-card/90 p-3.5 min-h-[110px] flex flex-col justify-between shadow-md">
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
              <OwnerEditableSurface editLabel={t("edit_portfolio")} onEdit={() => setEditingSection("portfolio")} buttonClassName="right-2 top-2">
                <div className="relative overflow-hidden rounded-[18px] border border-[var(--theme-accent)]/15 bg-velora-card/90 p-3.5 min-h-[130px] flex flex-col justify-between shadow-md">
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
                    {(!effectivePortfolio || effectivePortfolio.length === 0) ? (
                      <div className="flex flex-col items-center justify-center border border-dashed border-[var(--theme-accent)]/10 bg-white/[0.01] rounded-lg p-4 mt-2">
                        <p className="text-[9px] text-velora-text-muted">Aucun projet dans le portfolio pour le moment.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-1 mt-1">
                        {effectivePortfolio.slice(0, 2).map((item, i) => (
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
              </OwnerEditableSurface>

              {/* Reputation & Trust Block */}
              <div className="relative overflow-hidden rounded-[18px] border border-[var(--theme-accent)]/15 bg-velora-card/90 p-3.5 min-h-[110px] flex flex-col justify-between shadow-md">
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
                    {effectiveProfile.isVerified || effectiveProfile.isPremium ? (
                      <>
                        <div className="flex justify-between text-[8px] text-velora-text-muted">
                          <span>Rating</span>
                          <span className="text-[var(--identity-accent)] font-semibold">{effectiveProfile.isVerified ? "100%" : "96%"}</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[var(--theme-accent)] to-[#fff1c2] rounded-full" style={{ width: effectiveProfile.isVerified ? "100%" : "96%" }} />
                        </div>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {effectiveProfile.isVerified && (
                            <span className="inline-flex items-center gap-0.5 text-[7px] uppercase font-bold text-velora-text-secondary bg-white/5 border border-white/10 px-1 py-0.5 rounded">
                              <Shield size={7} className="text-[var(--identity-accent)]" />
                              {t("verified")}
                            </span>
                          )}
                          {effectiveProfile.isPremium && (
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
            <div className="relative overflow-hidden rounded-[18px] border border-[var(--theme-accent)]/15 bg-velora-card/90 p-4 shadow-md">
              <h3 className="text-xs font-semibold text-velora-text leading-tight mb-3">Activity Timeline</h3>
              <div className="space-y-4">
                <div className="border-l border-[var(--theme-accent)]/20 pl-3 py-1 relative">
                  <div className="absolute left-[-4.5px] top-1.5 w-2 h-2 rounded-full bg-[var(--identity-accent)]" />
                  <span className="text-[8px] text-[var(--identity-accent)] font-semibold">Apr 15, 2023</span>
                  <h4 className="text-xs font-semibold text-velora-text mt-0.5">Insights on Global Markets</h4>
                  <p className="text-[10px] text-velora-text-secondary mt-1">Published deep analysis on the global economic shift and trade routes.</p>
                </div>
                <div className="border-l border-[var(--theme-accent)]/20 pl-3 py-1 relative">
                  <div className="absolute left-[-4.5px] top-1.5 w-2 h-2 rounded-full bg-[var(--identity-accent)]" />
                  <span className="text-[8px] text-[var(--identity-accent)] font-semibold">Jan 18, 2023</span>
                  <h4 className="text-xs font-semibold text-velora-text mt-0.5">Future of AI in Finance</h4>
                  <p className="text-[10px] text-velora-text-secondary mt-1">Presented at the annual FinTech forum on AI integration in private banking systems.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Command / Availability status bar */}
        <OwnerCommandDock
          availabilityStatus={effectiveProfile.availabilityStatus}
          onEditAvailability={() => setEditingSection("availability")}
          onSignOut={() => void signOut()}
        />
      </div>

      <ProfileEditorSheet
        section={editingSection}
        profile={effectiveProfile}
        portfolio={effectivePortfolio}
        experience={effectiveExperience}
        onClose={() => setEditingSection(null)}
        onSaveProfile={handleSaveProfile}
        onSavePortfolio={handleSavePortfolio}
        onSaveExperience={handleSaveExperience}
        onUploadAvatar={uploadAvatar}
        onUploadCover={uploadCover}
        onUploadPortfolioImage={uploadPortfolioImage}
      />

      <AnimatePresence>
        {showFullEdit && (
          <EditProfileScreen onClose={() => setShowFullEdit(false)} />
        )}
        {showSettings && (
          <SettingsScreen onClose={() => setShowSettings(false)} />
        )}
      </AnimatePresence>
    </main>
  );
}

function OwnerEditableSurface({
  children,
  editLabel,
  onEdit,
  className = "",
  buttonClassName = "right-0 top-8",
}: {
  children: ReactNode;
  editLabel: string;
  onEdit: () => void;
  className?: string;
  buttonClassName?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <FloatingEditButton label={editLabel} onClick={onEdit} className={buttonClassName} />
      {children}
    </div>
  );
}



function OwnerCommandDock({
  availabilityStatus,
  onEditAvailability,
  onSignOut,
}: {
  availabilityStatus: VeloraProfile["availabilityStatus"];
  onEditAvailability: () => void;
  onSignOut: () => void;
}) {
  const availability = {
    available: "Available",
    busy: "Selective",
    offline: "Unavailable",
  }[availabilityStatus || "available"];

  return (
    <Reveal delay={0.08}>
      <div className="pb-4 pt-8">
        <div className="identity-glass-card rounded-[26px] p-3">
          <div className="grid grid-cols-[1fr_auto] items-center gap-3">
            <button
              type="button"
              onClick={onEditAvailability}
              className="identity-reflective flex min-w-0 items-center gap-3 rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-3 text-left"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[rgba(var(--identity-accent-rgb),0.22)] bg-[rgba(var(--identity-accent-rgb),0.08)] text-[var(--identity-accent)]">
                <Check size={15} />
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-velora-text-muted">
                  Availability
                </span>
                <span className="mt-0.5 block text-sm font-semibold text-velora-text">
                  {availability}
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={onSignOut}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-velora-rose/20 bg-velora-rose/10 text-velora-rose transition-transform duration-300 hover:scale-105"
              aria-label="Sign out"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </div>
    </Reveal>
  );
}




