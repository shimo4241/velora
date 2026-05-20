"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  BarChart3,
  Briefcase,
  Check,
  Eye,
  Globe,
  LogOut,
  MessageCircle,
  MousePointerClick,
  Pencil,
  QrCode,
  Shield,
  Settings as SettingsIcon,
  Sparkles,
  Users,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import {
  ContactSection,
  ExperienceTimeline,
  IdentityHero,
  IdentitySection,
  LUXURY_EASE,
  LuxuryQrSection,
  PortfolioShowcase,
  Reveal,
  ServiceDeck,
  SkillMatrix,
  SocialChannelRail,
  getIdentityTheme,
} from "@/app/u/[username]/PublicProfileClient";
import {
  FloatingEditButton,
  ProfileEditorSheet,
  type ProfileEditorSection,
} from "@/components/profile/ProfileEditor";
import { useAuth } from "@/components/providers/AuthProvider";
import { useTranslation } from "@/lib/i18n";
import { getProfileShortUrl, getProfileUrl } from "@/lib/profileUrls";
import { EditProfileScreen } from "./EditProfileScreen";
import { SettingsScreen } from "./SettingsScreen";
import { useConnections } from "@/hooks/useConnections";
import { usePortfolio, useExperience, useProfile } from "@/hooks/useProfile";
import { useActivity, useStats } from "@/hooks/useStats";
import {
  addExperienceEntry,
  addPortfolioItem,
  deleteExperienceEntry,
  deletePortfolioItem,
  updateExperienceEntry,
  updatePortfolioItem,
} from "@/lib/firestore";
import type {
  ActivityItem,
  DailyStats,
  ExperienceEntry,
  PortfolioItem,
  VeloraProfile,
} from "@/types";

type IdentityVarStyle = CSSProperties & Record<`--${string}`, string>;

export function ProfileScreen() {
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
  const { connections, count: connectionsCount } = useConnections();
  const { stats } = useStats();
  const { activity } = useActivity();
  const { t } = useTranslation(profile?.locale || "fr");
  const [editingSection, setEditingSection] = useState<ProfileEditorSection | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showFullEdit, setShowFullEdit] = useState(false);
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
    () => getIdentityTheme(effectiveProfile?.professionalMode),
    [effectiveProfile?.professionalMode]
  );
  const profileUrl = effectiveProfile ? getProfileUrl(effectiveProfile.username) : "";
  const shortUrl = effectiveProfile ? getProfileShortUrl(effectiveProfile.username) : "";
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
      className="luxury-profile min-h-screen overflow-hidden bg-velora-black text-velora-text safe-bottom"
      style={themeVars}
    >
      <div className="relative">
        <IdentityHero
          profile={effectiveProfile}
          portfolioCount={effectivePortfolio.length}
          experienceCount={effectiveExperience.length}
          profileUrl={profileUrl}
          shortUrl={shortUrl}
          theme={theme}
          t={t}
        />
        <div className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-20 flex items-center gap-2">
          <motion.button
            type="button"
            aria-label="Edit Profile"
            title="Edit Profile"
            onClick={() => setShowFullEdit(true)}
            whileHover={{ y: -2, scale: 1.04 }}
            whileTap={{ scale: 0.92 }}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-velora-gold/30 bg-black/45 text-velora-gold shadow-[0_4px_12px_rgba(0,0,0,0.3)] backdrop-blur-md transition-colors hover:border-velora-gold/60"
          >
            <Pencil size={15} />
          </motion.button>

          <motion.button
            type="button"
            aria-label="Settings"
            title="Settings"
            onClick={() => setShowSettings(true)}
            whileHover={{ y: -2, scale: 1.04 }}
            whileTap={{ scale: 0.92 }}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/45 text-velora-text-secondary shadow-[0_4px_12px_rgba(0,0,0,0.3)] backdrop-blur-md transition-colors hover:border-white/20 hover:text-white"
          >
            <SettingsIcon size={16} />
          </motion.button>
        </div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[980px] px-5 pb-28">
        <OwnerEditableSurface
          editLabel="Edit contact cards"
          onEdit={() => setEditingSection("contact")}
          buttonClassName="right-1 top-1"
        >
          {hasContactCards(effectiveProfile) ? (
            <ContactSection profile={effectiveProfile} theme={theme} t={t} />
          ) : (
            <section className="-mt-6 pb-8">
              <LuxuryEmptyState
                icon={MessageCircle}
                title="Build contact cards"
                actionLabel="Edit contact"
                onAction={() => setEditingSection("contact")}
              >
                Add WhatsApp, email, phone, website, or booking access.
              </LuxuryEmptyState>
            </section>
          )}
        </OwnerEditableSurface>

        <OwnerAnalyticsDeck
          stats={stats}
          connectionsCount={connectionsCount}
          recentActivity={activity.slice(0, 3)}
          mutualConnections={connections
            .slice(0, 3)
            .map((connection) => connection.profile.fullName || "VELORA")}
          isVerified={Boolean(effectiveProfile.isVerified)}
        />

        <OwnerIdentitySection
          eyebrow="Narrative"
          title="Signature Bio"
          editLabel="Edit bio"
          onEdit={() => setEditingSection("bio")}
        >
          {effectiveProfile.bio ? (
            <Reveal delay={0.04}>
              <div className="identity-glass-card identity-reflective rounded-[24px] p-5">
                <p className="text-sm leading-7 text-velora-text-secondary">
                  {effectiveProfile.bio}
                </p>
              </div>
            </Reveal>
          ) : (
            <LuxuryEmptyState
              icon={Sparkles}
              title="Write your cinematic bio"
              actionLabel="Edit bio"
              onAction={() => setEditingSection("bio")}
            >
              A focused founder-style narrative appears in the hero and profile body.
            </LuxuryEmptyState>
          )}
        </OwnerIdentitySection>

        <OwnerIdentitySection
          eyebrow="Expertise"
          title="Signal Stack"
          editLabel="Edit skills"
          onEdit={() => setEditingSection("skills")}
        >
          {(effectiveProfile.skills || []).length ? (
            <SkillMatrix skills={effectiveProfile.skills || []} />
          ) : (
            <LuxuryEmptyState
              icon={Check}
              title="Add premium skill signals"
              actionLabel="Edit skills"
              onAction={() => setEditingSection("skills")}
            >
              Skills render as the same animated glass chips as the public profile.
            </LuxuryEmptyState>
          )}
        </OwnerIdentitySection>

        <OwnerIdentitySection
          eyebrow="Services"
          title="Private Offering"
          editLabel="Edit services"
          onEdit={() => setEditingSection("services")}
        >
          {(effectiveProfile.services || []).length ? (
            <ServiceDeck services={effectiveProfile.services || []} />
          ) : (
            <LuxuryEmptyState
              icon={Briefcase}
              title="Shape your service deck"
              actionLabel="Add service"
              onAction={() => setEditingSection("services")}
            >
              Services become cinematic offering cards with pricing signals.
            </LuxuryEmptyState>
          )}
        </OwnerIdentitySection>

        <OwnerIdentitySection
          eyebrow={t("portfolio")}
          title="Selected Work"
          editLabel="Edit portfolio"
          onEdit={() => setEditingSection("portfolio")}
        >
          {effectivePortfolio.length ? (
            <PortfolioShowcase portfolio={effectivePortfolio} theme={theme} />
          ) : (
            <LuxuryEmptyState
              icon={Sparkles}
              title="Curate selected work"
              actionLabel="Add project"
              onAction={() => setEditingSection("portfolio")}
            >
              Portfolio items use the same cinematic media cards and full-screen preview.
            </LuxuryEmptyState>
          )}
        </OwnerIdentitySection>

        <OwnerIdentitySection
          eyebrow={t("experience")}
          title="Trajectory"
          editLabel="Edit experience"
          onEdit={() => setEditingSection("experience")}
        >
          {effectiveExperience.length ? (
            <ExperienceTimeline experience={effectiveExperience} presentLabel={t("present")} />
          ) : (
            <LuxuryEmptyState
              icon={Briefcase}
              title="Add your trajectory"
              actionLabel="Add experience"
              onAction={() => setEditingSection("experience")}
            >
              Experience entries render on the same glowing public timeline.
            </LuxuryEmptyState>
          )}
        </OwnerIdentitySection>

        <OwnerEditableSurface
          editLabel="Edit profile theme"
          onEdit={() => setEditingSection("theme")}
          buttonClassName="right-1 top-10"
        >
          <LuxuryQrSection
            profile={effectiveProfile}
            profileUrl={profileUrl}
            shortUrl={shortUrl}
            theme={theme}
          />
        </OwnerEditableSurface>

        <OwnerIdentitySection
          eyebrow={t("connect")}
          title="Digital Channels"
          editLabel="Edit social links"
          onEdit={() => setEditingSection("social")}
        >
          {(effectiveProfile.socialLinks || []).length ? (
            <SocialChannelRail links={effectiveProfile.socialLinks || []} />
          ) : (
            <LuxuryEmptyState
              icon={Globe}
              title="Add social channels"
              actionLabel="Edit social"
              onAction={() => setEditingSection("social")}
            >
              Social links become horizontal glass buttons with hover glow.
            </LuxuryEmptyState>
          )}
        </OwnerIdentitySection>

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

function OwnerIdentitySection({
  eyebrow,
  title,
  editLabel,
  onEdit,
  children,
}: {
  eyebrow: string;
  title: string;
  editLabel: string;
  onEdit: () => void;
  children: ReactNode;
}) {
  return (
    <OwnerEditableSurface editLabel={editLabel} onEdit={onEdit}>
      <IdentitySection eyebrow={eyebrow} title={title}>
        {children}
      </IdentitySection>
    </OwnerEditableSurface>
  );
}

function OwnerAnalyticsDeck({
  stats,
  connectionsCount,
  recentActivity,
  mutualConnections,
  isVerified,
}: {
  stats: DailyStats;
  connectionsCount: number;
  recentActivity: ActivityItem[];
  mutualConnections: string[];
  isVerified: boolean;
}) {
  const totalReach = stats.views + stats.taps + stats.scans + stats.clicks;
  const cards = [
    { label: "Views", value: stats.views, icon: Eye },
    { label: "Taps", value: stats.taps, icon: MousePointerClick },
    { label: "QR scans", value: stats.scans, icon: QrCode },
    { label: "Clicks", value: stats.clicks, icon: BarChart3 },
  ];
  const activityItems = recentActivity.length
    ? recentActivity
    : [{ id: "ready", text: "Profile is ready for premium sharing", time: "now" }];

  return (
    <IdentitySection eyebrow="Owner dashboard" title="Command Layer">
      <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
        <Reveal delay={0.03}>
          <div className="identity-glass-card identity-reflective rounded-[26px] p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--identity-accent)]">
                  Live analytics
                </div>
                <div className="mt-1 font-[family-name:var(--font-display)] text-lg font-semibold text-velora-text">
                  {totalReach.toLocaleString()} total signals
                </div>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(var(--identity-accent-rgb),0.24)] bg-black/20 text-[var(--identity-accent)]">
                <Activity size={18} />
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {cards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <motion.div
                    key={card.label}
                    className="rounded-[20px] border border-white/10 bg-white/[0.045] p-3"
                    whileHover={{ y: -3, scale: 1.01 }}
                    whileTap={{ scale: 0.985 }}
                    transition={{ duration: 0.26, ease: LUXURY_EASE }}
                  >
                    <Icon size={15} className="mb-3 text-[var(--identity-accent)]" />
                    <div className="font-mono text-xl font-semibold text-velora-text">
                      {card.value.toLocaleString()}
                    </div>
                    <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-velora-text-muted">
                      {card.label}
                    </div>
                    <span
                      className="mt-3 block h-1 rounded-full bg-[rgba(var(--identity-accent-rgb),0.16)]"
                      style={{ opacity: 0.5 + index * 0.12 }}
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="identity-glass-card rounded-[26px] p-4">
            <div className="grid grid-cols-2 gap-2.5">
              <TrustPill icon={Shield} label="Trust" value={isVerified ? "Verified" : "Review"} />
              <TrustPill icon={Users} label="Network" value={connectionsCount.toLocaleString()} />
            </div>

            <div className="mt-3 rounded-[20px] border border-white/10 bg-white/[0.04] p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-velora-text-muted">
                  Mutual signals
                </span>
                <div className="flex -space-x-2">
                  {(mutualConnections.length ? mutualConnections : ["V"]).map((name, index) => (
                    <span
                      key={`${name}-${index}`}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-black bg-[rgba(var(--identity-accent-rgb),0.14)] text-[9px] font-semibold text-[var(--identity-accent)]"
                    >
                      {getInitials(name)}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-xs leading-6 text-velora-text-muted">
                {mutualConnections.length
                  ? `${mutualConnections.length} shared network signal${
                      mutualConnections.length > 1 ? "s" : ""
                    }`
                  : "No shared network signals yet"}
              </div>
            </div>

            <div className="mt-3 rounded-[20px] border border-white/10 bg-white/[0.04] p-3">
              <div className="mb-2 flex items-center gap-2">
                <Wifi size={13} className="text-[var(--identity-accent)]" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-velora-text-muted">
                  Recent activity
                </span>
              </div>
              <div className="space-y-2">
                {activityItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 text-xs">
                    <span className="truncate text-velora-text-secondary">{item.text}</span>
                    <span className="shrink-0 font-mono text-[10px] text-[var(--identity-accent)]">
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </IdentitySection>
  );
}

function TrustPill({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[20px] border border-[rgba(var(--identity-accent-rgb),0.16)] bg-[rgba(var(--identity-accent-rgb),0.06)] p-3">
      <Icon size={14} className="mb-2 text-[var(--identity-accent)]" />
      <div className="text-sm font-semibold text-velora-text">{value}</div>
      <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-velora-text-muted">
        {label}
      </div>
    </div>
  );
}

function LuxuryEmptyState({
  icon: Icon,
  title,
  actionLabel,
  onAction,
  children,
}: {
  icon: LucideIcon;
  title: string;
  actionLabel: string;
  onAction: () => void;
  children: ReactNode;
}) {
  return (
    <Reveal delay={0.04}>
      <div className="identity-glass-card identity-reflective rounded-[26px] p-5 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(var(--identity-accent-rgb),0.24)] bg-black/25 text-[var(--identity-accent)]">
          <Icon size={18} />
        </div>
        <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-velora-text">
          {title}
        </h3>
        <p className="mx-auto mt-2 max-w-[320px] text-sm leading-6 text-velora-text-muted">
          {children}
        </p>
        <motion.button
          type="button"
          onClick={onAction}
          whileHover={{ y: -2, scale: 1.01 }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.24, ease: LUXURY_EASE }}
          className="identity-reflective mt-5 inline-flex items-center gap-2 rounded-full border border-[rgba(var(--identity-accent-rgb),0.3)] bg-[rgba(var(--identity-accent-rgb),0.1)] px-4 py-2.5 text-xs font-semibold text-[var(--identity-accent)] backdrop-blur-md"
        >
          <Pencil size={13} />
          {actionLabel}
        </motion.button>
      </div>
    </Reveal>
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

function hasContactCards(profile: VeloraProfile) {
  const settings = profile.contactActions;
  return Boolean(
    (settings?.whatsapp !== false && profile.whatsapp) ||
      (settings?.email !== false && profile.email) ||
      (settings?.phone !== false && (profile.phone || profile.whatsapp)) ||
      (settings?.website !== false && profile.website) ||
      settings?.bookingUrl
  );
}

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2) || "V"
  );
}
