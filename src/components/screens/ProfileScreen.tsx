"use client";

import { useMemo, useState } from "react";
import { Divider } from "@/components/ui";
import { FadeUp } from "@/components/motion/animations";
import { ProfileHero } from "@/components/profile";
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
  ExternalLink,
  Globe,
  LogOut,
  MessageCircle,
  Palette,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import type { ExperienceEntry, PortfolioItem, VeloraProfile } from "@/types";

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
  const { count: connectionsCount } = useConnections();
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
          isVerified={Boolean(effectiveProfile.isVerified)}
          isPremium={Boolean(effectiveProfile.isPremium)}
          mode={effectiveProfile.professionalMode === "entrepreneur" ? "Entrepreneur" : effectiveProfile.professionalMode || ""}
          connectionsCount={connectionsCount}
          portfolioCount={effectivePortfolio.length}
          profileTheme={effectiveProfile.profileTheme}
          showBio={false}
        />
        <FloatingEditButton label="Edit profile header" onClick={() => setEditingSection("header")} className="top-5" />
      </div>

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
          <div className="grid grid-cols-1 gap-3">
            {effectivePortfolio.map((project) => (
              <article key={project.id} className="overflow-hidden rounded-[var(--radius-md)] border border-white/8 bg-white/[0.03]">
                {project.imageUrl && (
                  <div className="aspect-[16/9] bg-cover bg-center" style={{ backgroundImage: `url(${project.imageUrl})` }} />
                )}
                <div className="p-3">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-velora-gold/70">{project.category || "Project"}</div>
                  <h3 className="mt-1 text-sm font-semibold text-velora-text">{project.title}</h3>
                  {project.description && <p className="mt-1 text-xs leading-relaxed text-velora-text-muted">{project.description}</p>}
                  {project.link && (
                    <a href={project.link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-[11px] text-velora-gold">
                      View project
                      <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyEditableState>Add your first project</EmptyEditableState>
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
          <EmptyEditableState>Add experience</EmptyEditableState>
        )}
      </EditablePanel>

      <Divider className="mx-5" />
      <EditablePanel title="Services" icon={Briefcase} editLabel="Edit services" onEdit={() => setEditingSection("services")}>
        <ServicesList services={effectiveProfile.services || []} />
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

