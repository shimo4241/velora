"use client";

import { type ReactNode } from "react";
import { useTranslation } from "@/lib/i18n";
import { AnimatePresence, motion } from "framer-motion";
import {
  Globe,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import dynamic from "next/dynamic";

import type {
  AvailabilityStatus,
  ExperienceEntry,
  PortfolioItem,
  ProfileService,
  SocialLink,
  VeloraProfile,
} from "@/types";

// Re-export visual theme helpers
export {
  themeMeta,
  getProfileThemeGradient,
} from "./editors/ThemeEditor";

// Re-export AI Writing Assistant
export { LocalAiWritingAssistant } from "./editors/LocalAiWritingAssistant";

// Shared Panel styling class
export { panelClass } from "./editors/shared";

// Lazy-loaded sub-editors to minimize bundle sizes
const HeaderEditor = dynamic(() => import("./editors/HeaderEditor"), { ssr: false });
const BioEditor = dynamic(() => import("./editors/BioEditor"), { ssr: false });
const SkillsEditor = dynamic(() => import("./editors/SkillsEditor"), { ssr: false });
const ServicesEditor = dynamic(() => import("./editors/ServicesEditor"), { ssr: false });
const PortfolioEditor = dynamic(() => import("./editors/PortfolioEditor"), { ssr: false });
const ExperienceEditor = dynamic(() => import("./editors/ExperienceEditor"), { ssr: false });
const ContactEditor = dynamic(() => import("./editors/ContactEditor"), { ssr: false });
const SocialEditor = dynamic(() => import("./editors/SocialEditor"), { ssr: false });
const ThemeEditor = dynamic(() => import("./editors/ThemeEditor"), { ssr: false });
const AvailabilityEditor = dynamic(() => import("./editors/AvailabilityEditor"), { ssr: false });

export type ProfileEditorSection =
  | "header"
  | "bio"
  | "skills"
  | "portfolio"
  | "experience"
  | "contact"
  | "social"
  | "services"
  | "theme"
  | "availability";

export function FloatingEditButton({
  label,
  onClick,
  className = "",
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      whileHover={{ y: -2, scale: 1.04 }}
      whileTap={{ scale: 0.92 }}
      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
      className={`absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-velora-gold/35 bg-[linear-gradient(135deg,var(--color-velora-gold-dim),rgba(255,255,255,0.06))] text-velora-gold shadow-[0_4px_12px_rgba(0,0,0,0.18),0_0_8px_var(--color-velora-gold-glow)] backdrop-blur-md transition-colors duration-300 hover:border-velora-gold/60 hover:bg-velora-gold/16 focus:border-velora-gold/70 ${className}`}
    >
      <Pencil size={14} />
    </motion.button>
  );
}

export function EditablePanel({
  title,
  icon: Icon,
  editLabel,
  onEdit,
  children,
  className = "",
}: {
  title: string;
  icon?: LucideIcon;
  editLabel: string;
  onEdit: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`relative px-5 py-5 ${className}`}>
      <div className="glass rounded-[var(--radius-card)] border border-white/10 relative overflow-hidden p-4">
        <FloatingEditButton label={editLabel} onClick={onEdit} />
        <div className="mb-3 flex items-center gap-2 pr-11">
          {Icon && (
            <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-velora-gold-dim text-velora-gold">
              <Icon size={14} />
            </span>
          )}
          <h2 className="text-heading text-base text-velora-text">{title}</h2>
        </div>
        {children}
      </div>
    </section>
  );
}

export function EmptyEditableState({
  children,
  ctaLabel,
  onAction,
}: {
  children: ReactNode;
  ctaLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex min-h-[112px] flex-col items-center justify-center rounded-[var(--radius-md)] border border-dashed border-velora-gold/20 bg-velora-gold/5 px-4 text-center">
      <div className="text-xs leading-relaxed text-velora-text-muted">{children}</div>
      {ctaLabel && onAction && (
        <motion.button
          type="button"
          onClick={onAction}
          whileTap={{ scale: 0.96 }}
          className="haptic-press mt-3 inline-flex items-center gap-1.5 rounded-full border border-velora-gold/25 bg-velora-gold/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-velora-gold"
        >
          <Plus size={12} />
          {ctaLabel}
        </motion.button>
      )}
    </div>
  );
}

export function SkillChips({ skills }: { skills: string[] }) {
  const { t } = useTranslation();
  if (!skills.length) return <EmptyEditableState>{t("edit_profile_skills_add_cta")}</EmptyEditableState>;

  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill) => (
        <span key={skill} className="rounded-full border border-velora-gold/20 bg-velora-gold/10 px-3 py-1.5 text-xs text-velora-gold">
          {skill}
        </span>
      ))}
    </div>
  );
}

export function ServicesList({
  services,
  emptyLabel,
  ctaLabel,
  onAdd,
}: {
  services: ProfileService[];
  emptyLabel?: string;
  ctaLabel?: string;
  onAdd?: () => void;
}) {
  const { t } = useTranslation();
  const displayEmptyLabel = emptyLabel || t("edit_profile_services_empty");
  if (!services.length) {
    return (
      <EmptyEditableState ctaLabel={ctaLabel} onAction={onAdd}>
        {displayEmptyLabel}
      </EmptyEditableState>
    );
  }

  return (
    <div className="space-y-3">
      {services.map((service) => (
        <div key={service.id} className="rounded-[var(--radius-md)] border border-white/8 bg-white/[0.03] p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-velora-text">{service.title}</h3>
              {service.description && <p className="mt-1 text-xs leading-relaxed text-velora-text-muted">{service.description}</p>}
            </div>
            {service.price && <span className="shrink-0 text-[10px] font-medium uppercase tracking-[0.12em] text-velora-gold">{service.price}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

export function AvailabilityBadge({ status }: { status: AvailabilityStatus }) {
  const { t } = useTranslation();
  const meta = {
    available: { labelKey: "availability_available", className: "bg-velora-emerald/12 text-velora-emerald border-velora-emerald/25" },
    busy: { labelKey: "availability_selective", className: "bg-velora-gold/12 text-velora-gold border-velora-gold/25" },
    offline: { labelKey: "availability_unavailable", className: "bg-velora-rose/12 text-velora-rose border-velora-rose/25" },
  }[status || "available"];

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${meta.className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {t(meta.labelKey)}
    </span>
  );
}

export function ContactActionGrid({ profile }: { profile: VeloraProfile }) {
  const { t } = useTranslation();
  const actions = [
    {
      key: "whatsapp",
      label: t("contact_whatsapp"),
      icon: MessageCircle,
      enabled: profile.contactActions.whatsapp && Boolean(profile.whatsapp),
      href: profile.whatsapp ? `https://wa.me/${profile.whatsapp.replace(/\D/g, "")}` : "",
      className: "text-velora-whatsapp border-velora-whatsapp/20 bg-velora-whatsapp/10",
    },
    {
      key: "email",
      label: t("field_email"),
      icon: Mail,
      enabled: profile.contactActions.email && Boolean(profile.email),
      href: profile.email ? `mailto:${profile.email}` : "",
      className: "text-velora-blue border-velora-blue/15 bg-velora-blue/10",
    },
    {
      key: "phone",
      label: t("contact_call"),
      icon: Phone,
      enabled: profile.contactActions.phone && Boolean(profile.phone || profile.whatsapp),
      href: profile.phone || profile.whatsapp ? `tel:${profile.phone || profile.whatsapp}` : "",
      className: "text-velora-gold border-velora-gold/20 bg-velora-gold/10",
    },
    {
      key: "website",
      label: t("field_website"),
      icon: Globe,
      enabled: profile.contactActions.website && Boolean(profile.website),
      href: profile.website || "",
      className: "text-velora-violet border-velora-violet/20 bg-velora-violet/10",
    },
  ];
  const visible = actions.filter((action) => action.enabled);

  if (!visible.length) return <EmptyEditableState>{t("edit_profile_contact_empty")}</EmptyEditableState>;

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {visible.map((action) => {
        const Icon = action.icon;
        return (
          <a
            key={action.key}
            href={action.href}
            target={action.href.startsWith("http") ? "_blank" : undefined}
            rel={action.href.startsWith("http") ? "noopener noreferrer" : undefined}
            className={`flex flex-col items-center justify-center gap-1.5 rounded-[var(--radius-md)] border py-3 ${action.className}`}
          >
            <Icon size={18} />
            <span className="text-[10px] font-medium">{action.label}</span>
          </a>
        );
      })}
    </div>
  );
}

export function SocialLinkRow({ links }: { links: SocialLink[] }) {
  const { t } = useTranslation();
  if (!links.length) return <EmptyEditableState>{t("edit_profile_social_empty")}</EmptyEditableState>;

  return (
    <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
      {links.map((link, index) => (
        <a
          key={`${link.platform}-${index}`}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex shrink-0 items-center gap-2 rounded-[var(--radius-card)] border border-white/8 bg-white/[0.04] px-4 py-2.5"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold" style={{ backgroundColor: `${link.color}22`, color: link.color }}>
            {link.icon}
          </span>
          <span className="text-xs font-medium text-velora-text-secondary">{link.platform}</span>
          <ExternalLink size={10} className="text-velora-text-muted/60" />
        </a>
      ))}
    </div>
  );
}

export function ProfileEditorSheet({
  section,
  profile,
  portfolio,
  experience,
  onClose,
  onSaveProfile,
  onSavePortfolio,
  onSaveExperience,
  onUploadAvatar,
  onUploadCover,
  onUploadPortfolioImage,
}: {
  section: ProfileEditorSection | null;
  profile: VeloraProfile;
  portfolio: PortfolioItem[];
  experience: ExperienceEntry[];
  onClose: () => void;
  onSaveProfile: (data: Partial<Omit<VeloraProfile, "id" | "username">>) => Promise<void>;
  onSavePortfolio: (items: PortfolioItem[]) => Promise<void>;
  onSaveExperience: (items: ExperienceEntry[]) => Promise<void>;
  onUploadAvatar: (file: File, options?: any) => Promise<string>;
  onUploadCover: (file: File, options?: any) => Promise<string>;
  onUploadPortfolioImage: (file: File, options?: any) => Promise<string>;
}) {
  return (
    <AnimatePresence>
      {section === "header" && (
        <HeaderEditor
          key="header"
          profile={profile}
          onCancel={onClose}
          onSave={onSaveProfile}
          onUploadAvatar={onUploadAvatar}
          onUploadCover={onUploadCover}
        />
      )}
      {section === "bio" && (
        <BioEditor key="bio" profile={profile} onCancel={onClose} onSave={onSaveProfile} />
      )}
      {section === "skills" && (
        <SkillsEditor key="skills" profile={profile} onCancel={onClose} onSave={onSaveProfile} />
      )}
      {section === "services" && (
        <ServicesEditor key="services" profile={profile} onCancel={onClose} onSave={onSaveProfile} />
      )}
      {section === "portfolio" && (
        <PortfolioEditor
          key="portfolio"
          items={portfolio}
          onCancel={onClose}
          onSave={onSavePortfolio}
          onUploadImage={onUploadPortfolioImage}
        />
      )}
      {section === "experience" && (
        <ExperienceEditor
          key="experience"
          items={experience}
          onCancel={onClose}
          onSave={onSaveExperience}
        />
      )}
      {section === "contact" && (
        <ContactEditor key="contact" profile={profile} onCancel={onClose} onSave={onSaveProfile} />
      )}
      {section === "social" && (
        <SocialEditor key="social" profile={profile} onCancel={onClose} onSave={onSaveProfile} />
      )}
      {section === "theme" && (
        <ThemeEditor key="theme" profile={profile} onCancel={onClose} onSave={onSaveProfile} />
      )}
      {section === "availability" && (
        <AvailabilityEditor key="availability" profile={profile} onCancel={onClose} onSave={onSaveProfile} />
      )}
    </AnimatePresence>
  );
}
