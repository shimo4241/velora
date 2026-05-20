"use client";

import { useMemo, useState } from "react";
import { Divider } from "@/components/ui";
import { FadeUp } from "@/components/motion/animations";
import { PremiumPortfolioGallery, ProfileHero } from "@/components/profile";
import {
  AvailabilityBadge,
  ContactActionGrid,
  EditablePanel,
  EmptyEditableState,
  FloatingEditButton,
  getProfileThemeGradient,
  ProfileEditorSheet,
  ServicesList,
  SkillChips,
  SocialLinkRow,
  type ProfileEditorSection,
} from "@/components/profile/ProfileEditor";
import { useProfile, usePortfolio, useExperience } from "@/hooks/useProfile";
import { useConnections } from "@/hooks/useConnections";
import { useActivity, useStats } from "@/hooks/useStats";
import {
  addExperienceEntry,
  addPortfolioItem,
  deleteExperienceEntry,
  deletePortfolioItem,
  updateExperienceEntry,
  updatePortfolioItem,
} from "@/lib/firestore";
import {
  Briefcase,
  Check,
  Activity,
  Eye,
  Globe,
  LogOut,
  MessageCircle,
  Palette,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import type { ActivityItem, ExperienceEntry, PortfolioItem, VeloraProfile } from "@/types";

export function ProfileScreen() {
  const {
    profile,
    isProfileReady,
    updateProfile,
    uploadAvatar,
    uploadPortfolioImage,
  } = useProfile();
  const { user, signOut } = useAuth();
  const { portfolio } = usePortfolio();
  const { experience } = useExperience();
  const { connections, count: connectionsCount } = useConnections();
  const { stats } = useStats();
  const { activity } = useActivity();
  const [editingSection, setEditingSection] = useState<ProfileEditorSection | null>(null);
  const [profileOverride, setProfileOverride] = useState<Partial<Omit<VeloraProfile, "id" | "username">>>({});
  const [portfolioOverride, setPortfolioOverride] = useState<PortfolioItem[] | null>(null);
  const [experienceOverride, setExperienceOverride] = useState<ExperienceEntry[] | null>(null);

  const effectiveProfile = useMemo(() => {
    if (!profile) return null;
    return { ...profile, ...profileOverride } as VeloraProfile;
  }, [profile, profileOverride]);

  const effectivePortfolio = portfolioOverride ?? portfolio;
  const effectiveExperience = experienceOverride ?? experience;
  const themeStyle = useMemo(
    () => ({ background: getProfileThemeGradient(effectiveProfile?.profileTheme) }),
    [effectiveProfile?.profileTheme]
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

      const nextExistingIds = new Set(items.filter((item) => existingIds.has(item.id)).map((item) => item.id));
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

      const nextExistingIds = new Set(items.filter((item) => existingIds.has(item.id)).map((item) => item.id));
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
    <div className="min-h-screen bg-velora-black safe-bottom">
      <div className="relative">
        <ProfileHero
          name={effectiveProfile.fullName || "VELORA User"}
          title={effectiveProfile.title || ""}
          company={effectiveProfile.company || ""}
          location={effectiveProfile.location || ""}
          bio={effectiveProfile.bio || ""}
          avatarUrl={effectiveProfile.avatarUrl || ""}
          coverUrl={effectiveProfile.coverUrl || ""}
          isVerified={Boolean(effectiveProfile.isVerified)}
          isPremium={Boolean(effectiveProfile.isPremium)}
          mode={effectiveProfile.professionalMode === "entrepreneur" ? "Entrepreneur" : effectiveProfile.professionalMode || ""}
          connectionsCount={connectionsCount}
          portfolioCount={effectivePortfolio.length}
          profileViews={stats.views}
          profileTheme={effectiveProfile.profileTheme}
          showBio={false}
        />
        <FloatingEditButton label="Edit profile header" onClick={() => setEditingSection("header")} className="top-5" />
      </div>

      <PremiumSocialProof
        profile={effectiveProfile}
        views={stats.views}
        connectionsCount={connectionsCount}
        mutualConnections={connections.slice(0, 3).map((connection) => connection.profile.fullName || "VELORA")}
        recentActivity={activity.slice(0, 3)}
      />

      <Divider className="mx-5" />
      <EditablePanel title="Bio" icon={Sparkles} editLabel="Edit bio" onEdit={() => setEditingSection("bio")}>
        {effectiveProfile.bio ? (
          <p className="pr-8 text-sm leading-relaxed text-velora-text-secondary">{effectiveProfile.bio}</p>
        ) : (
          <EmptyEditableState>Add a short professional bio</EmptyEditableState>
        )}
      </EditablePanel>

      <Divider className="mx-5" />
      <EditablePanel title="Skills" icon={Check} editLabel="Edit skills" onEdit={() => setEditingSection("skills")}>
        <SkillChips skills={effectiveProfile.skills || []} />
      </EditablePanel>

      <Divider className="mx-5" />
      <EditablePanel title="Portfolio" icon={Sparkles} editLabel="Edit portfolio" onEdit={() => setEditingSection("portfolio")}>
        {effectivePortfolio.length ? (
          <PremiumPortfolioGallery portfolio={effectivePortfolio} compact />
        ) : (
          <EmptyEditableState ctaLabel="Add project" onAction={() => setEditingSection("portfolio")}>
            Add your first project
          </EmptyEditableState>
        )}
      </EditablePanel>

      <Divider className="mx-5" />
      <EditablePanel title="Experience" icon={Briefcase} editLabel="Edit experience" onEdit={() => setEditingSection("experience")}>
        {effectiveExperience.length ? (
          <div className="space-y-4">
            {effectiveExperience.map((item) => (
              <div key={item.id} className="border-l border-velora-gold/25 pl-4">
                <div className="text-[10px] uppercase tracking-[0.16em] text-velora-gold/70">
                  {item.isCurrent ? `${item.startYear} - Present` : `${item.startYear} - ${item.endYear || ""}`}
                </div>
                <h3 className="mt-1 text-sm font-semibold text-velora-text">{item.role}</h3>
                <p className="text-xs text-velora-text-secondary">{item.company}</p>
                {item.description && <p className="mt-1 text-xs leading-relaxed text-velora-text-muted">{item.description}</p>}
              </div>
            ))}
          </div>
        ) : (
          <EmptyEditableState ctaLabel="Add experience" onAction={() => setEditingSection("experience")}>
            Show your experience
          </EmptyEditableState>
        )}
      </EditablePanel>

      <Divider className="mx-5" />
      <EditablePanel title="Services" icon={Briefcase} editLabel="Edit services" onEdit={() => setEditingSection("services")}>
        <ServicesList
          services={effectiveProfile.services || []}
          emptyLabel="Add your services"
          ctaLabel="Add service"
          onAdd={() => setEditingSection("services")}
        />
      </EditablePanel>

      <Divider className="mx-5" />
      <EditablePanel title="Contact actions" icon={MessageCircle} editLabel="Edit contact actions" onEdit={() => setEditingSection("contact")}>
        <ContactActionGrid profile={effectiveProfile} />
      </EditablePanel>

      <Divider className="mx-5" />
      <EditablePanel title="Social links" icon={Globe} editLabel="Edit social links" onEdit={() => setEditingSection("social")}>
        <SocialLinkRow links={effectiveProfile.socialLinks || []} />
      </EditablePanel>

      <Divider className="mx-5" />
      <EditablePanel title="Availability" icon={Check} editLabel="Edit availability" onEdit={() => setEditingSection("availability")}>
        <AvailabilityBadge status={effectiveProfile.availabilityStatus || "available"} />
      </EditablePanel>

      <Divider className="mx-5" />
      <EditablePanel title="Theme customization" icon={Palette} editLabel="Edit profile theme" onEdit={() => setEditingSection("theme")}>
        <div className="h-20 rounded-[var(--radius-md)] border border-white/8" style={themeStyle} />
      </EditablePanel>

      <Divider className="mx-5" />

      <div className="px-5 py-8 pb-32">
        <FadeUp delay={0.25}>
          <button
            onClick={() => void signOut()}
            className="mx-auto flex items-center gap-2 text-sm text-velora-rose/80 transition-colors hover:text-velora-rose"
          >
            <LogOut size={14} />
            Deconnexion
          </button>
        </FadeUp>
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
        onUploadPortfolioImage={uploadPortfolioImage}
      />
    </div>
  );
}

function PremiumSocialProof({
  profile,
  views,
  connectionsCount,
  mutualConnections,
  recentActivity,
}: {
  profile: VeloraProfile;
  views: number;
  connectionsCount: number;
  mutualConnections: string[];
  recentActivity: ActivityItem[];
}) {
  const proofStats = [
    { label: "Profile views", value: views, icon: Eye },
    { label: "Connections", value: connectionsCount, icon: Users },
    { label: "Trust level", value: profile.isVerified ? "Verified" : "Review", icon: Shield },
  ];
  const activityItems = recentActivity.length
    ? recentActivity
    : [
        { id: "ready", text: "Profile is ready for sharing", time: "now", icon: "sparkles", type: "view" as const },
      ];

  return (
    <section className="px-5 pb-5">
      <FadeUp delay={0.12}>
        <div className="glass relative overflow-hidden rounded-[var(--radius-card)] border border-white/10 p-4">
          <div className="pointer-events-none absolute inset-x-8 -top-20 h-36 rounded-full bg-velora-gold/10 blur-3xl" />
          <div className="relative grid grid-cols-3 gap-2">
            {proofStats.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-[var(--radius-md)] border border-white/8 bg-white/[0.035] p-3">
                  <Icon size={14} className="mb-2 text-velora-gold" />
                  <div className="text-data text-sm text-velora-text">{item.value}</div>
                  <div className="mt-1 text-[9px] uppercase tracking-[0.12em] text-velora-text-muted">{item.label}</div>
                </div>
              );
            })}
          </div>

          <div className="relative mt-3 grid grid-cols-1 gap-3">
            <div className="rounded-[var(--radius-md)] border border-velora-gold/15 bg-velora-gold/5 p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-velora-gold">Verified badge architecture</span>
                <span className={`h-2 w-2 rounded-full ${profile.isVerified ? "bg-velora-emerald" : "bg-velora-gold"}`} />
              </div>
              <p className="text-xs leading-relaxed text-velora-text-secondary">
                {profile.isVerified
                  ? "Identity, premium profile, and professional signals are active."
                  : "Verification-ready profile structure is in place for approval."}
              </p>
            </div>

            <div className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-[var(--radius-md)] border border-white/8 bg-white/[0.035] p-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-velora-text-muted">Mutual connections</div>
                <div className="mt-1 text-xs text-velora-text-secondary">
                  {mutualConnections.length ? `${mutualConnections.length} shared network signal${mutualConnections.length > 1 ? "s" : ""}` : "No mutual signals yet"}
                </div>
              </div>
              <div className="flex -space-x-2">
                {(mutualConnections.length ? mutualConnections : ["V"]).map((name, index) => (
                  <div
                    key={`${name}-${index}`}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-velora-black bg-velora-gold-dim text-[10px] font-semibold text-velora-gold"
                  >
                    {name.split(" ").map((part) => part[0]).join("").slice(0, 2) || "V"}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[var(--radius-md)] border border-white/8 bg-white/[0.035] p-3">
              <div className="mb-2 flex items-center gap-2">
                <Activity size={13} className="text-velora-gold" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-velora-text-muted">Recent activity</span>
              </div>
              <div className="space-y-2">
                {activityItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 text-xs">
                    <span className="truncate text-velora-text-secondary">{item.text}</span>
                    <span className="shrink-0 font-mono text-[10px] text-velora-gold/70">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </FadeUp>
    </section>
  );
}
