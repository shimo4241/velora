"use client";
import { logger } from "@/lib/logger";


import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "@/lib/i18n";
import { AnimatePresence, motion } from "framer-motion";
import { ModalPortal } from "@/components/ui/ModalPortal";

import {
  Briefcase,
  Camera,
  Check,
  Clipboard,
  ExternalLink,
  Globe,
  Loader2,
  Mail,
  MessageCircle,
  Palette,
  Pencil,
  Phone,
  Plus,
  Save,
  Sparkles,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import { GoldButton } from "@/components/ui";
import { useToast } from "@/components/providers/ToastProvider";
import {
  getUploadErrorMessage,
  validateUploadImageFile,
  type UploadOptions,
} from "@/lib/firestore";
import type {
  AvailabilityStatus,
  ContactActionSettings,
  ExperienceEntry,
  PortfolioItem,
  ProfileService,
  ProfileTheme,
  ProfileThemePalette,
  SocialLink,
  VeloraProfile,
} from "@/types";

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

const inputClass =
  "w-full bg-transparent text-sm text-velora-text placeholder:text-velora-text-muted/35 outline-none";
const textAreaClass = `${inputClass} resize-none leading-relaxed`;
const panelClass = "glass rounded-[var(--radius-card)] border border-white/10";

type AiStylePreset = "Luxury" | "Corporate" | "Founder" | "Executive";

const aiStylePresets: AiStylePreset[] = ["Luxury", "Corporate", "Founder", "Executive"];

const aiProviderLinks = [
  { label: "ChatGPT", href: "https://chatgpt.com/" },
  { label: "Gemini", href: "https://gemini.google.com/" },
  { label: "Claude", href: "https://claude.ai/" },
];

function buildAiPrompt({
  preset,
  notes,
  fallbackContext,
  language,
}: {
  preset: AiStylePreset;
  notes: string;
  fallbackContext: string;
  language: string;
}) {
  const context = notes.trim() || fallbackContext.trim();
  return [
    `Write a premium professional bio in a ${preset.toLowerCase()} style.`,
    `Write in ${language}.`,
    `Context: ${context || "Create a tasteful bio for a premium digital identity profile."}`,
    "Keep it elegant, specific, credible, and ready to paste into Velora. Use 2-3 concise sentences.",
  ].join("\n");
}

export function LocalAiWritingAssistant({
  profile,
  compact = false,
}: {
  profile?: Partial<VeloraProfile>;
  compact?: boolean;
}) {
  const { showToast } = useToast();
  const [preset, setPreset] = useState<AiStylePreset>(
    profile?.professionalMode === "corporate"
      ? "Corporate"
      : profile?.professionalMode === "luxury" || profile?.professionalMode === "vip"
        ? "Luxury"
        : profile?.professionalMode === "business"
          ? "Executive"
          : "Founder"
  );
  const [notes, setNotes] = useState("");
  const [prompt, setPrompt] = useState("");

  const language = profile?.locale === "en" ? "English" : profile?.locale === "es" ? "Spanish" : profile?.locale === "ar" ? "Arabic" : "French";
  const fallbackContext = [
    profile?.title,
    profile?.company,
    profile?.location,
    profile?.industry,
    profile?.skills?.length ? `Skills: ${profile.skills.join(", ")}` : "",
    profile?.bio,
  ].filter(Boolean).join(". ");

  const openPrompt = () => {
    setPrompt(buildAiPrompt({ preset, notes, fallbackContext, language }));
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      showToast({ tone: "success", title: "Prompt copied", message: "Paste it into your preferred AI assistant." });
    } catch {
      showToast({ tone: "error", title: "Copy failed", message: "Select the prompt text and copy it manually." });
    }
  };

  return (
    <>
      <div className={`${compact ? "rounded-[var(--radius-md)]" : "glass rounded-[var(--radius-card)]"} border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.065),var(--color-velora-gold-dim),color-mix(in srgb, var(--color-velora-black) 12%, transparent))] p-4 shadow-[0_8px_24px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.06)]`}>
        <div className="mb-4 flex items-center gap-2">
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-velora-gold-light),var(--color-velora-gold),var(--color-velora-gold-muted))] text-velora-black shadow-[0_0_8px_var(--color-velora-gold-glow)]">
            <Sparkles size={14} />
          </span>
          <p className="text-sm font-semibold text-velora-text">AI Bio Studio</p>
        </div>

        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Tell Velora about yourself..."
          rows={5}
          className="w-full resize-none rounded-[var(--radius-md)] border border-white/10 bg-black/18 px-4 py-3 text-sm leading-relaxed text-velora-text outline-none placeholder:text-velora-text-muted/40 focus:border-velora-gold/35"
        />

        <div className="mt-3 grid grid-cols-4 gap-1.5 rounded-full border border-white/8 bg-black/18 p-1">
          {aiStylePresets.map((style) => (
            <button
              key={style}
              type="button"
              onClick={() => setPreset(style)}
              className={`min-h-9 rounded-full px-2 text-[10px] font-semibold transition-colors ${preset === style ? "bg-velora-gold text-velora-black shadow-[0_4px_10px_var(--color-velora-gold-glow)]" : "text-velora-text-muted hover:text-velora-text"}`}
            >
              {style}
            </button>
          ))}
        </div>

        <motion.button
          type="button"
          onClick={openPrompt}
          whileTap={{ scale: 0.98 }}
          className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--color-velora-gold-light),var(--color-velora-gold),var(--color-velora-gold-muted))] text-sm font-semibold text-velora-black shadow-[0_6px_16px_var(--color-velora-gold-glow)]"
        >
          <Sparkles size={16} />
          Generate Bio
        </motion.button>
      </div>

      <AnimatePresence>
        {prompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[260] flex items-center justify-center bg-black/78 px-4 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)]"
          >
            <motion.div
              initial={{ y: 34, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-[460px] flex flex-col max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-3.5rem)] overflow-hidden rounded-[var(--radius-lg)] border border-velora-gold/25 bg-velora-dark shadow-[0_-8px_30px_rgba(0,0,0,0.4),0_0_12px_var(--color-velora-gold-glow)]"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-velora-gold-light),var(--color-velora-gold),var(--color-velora-gold-muted))] text-velora-black">
                    <Sparkles size={17} />
                  </span>
                  <div>
                    <h3 className="text-heading text-base text-velora-text">Generated AI prompt</h3>
                    <p className="text-[10px] text-velora-text-muted">{preset} bio</p>
                  </div>
                </div>
                <button type="button" onClick={() => setPrompt("")} className="flex h-9 w-9 items-center justify-center rounded-full text-velora-text-muted hover:text-velora-text" aria-label="Close AI prompt">
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4">
                <textarea readOnly value={prompt} rows={9} className="w-full resize-none rounded-[var(--radius-md)] border border-white/10 bg-white/[0.04] p-3 text-sm leading-relaxed text-velora-text outline-none" />
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button type="button" onClick={copyPrompt} className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-velora-gold text-sm font-semibold text-velora-black">
                    <Clipboard size={15} />
                    Copy prompt
                  </button>
                  {aiProviderLinks.map((provider) => (
                    <a key={provider.label} href={provider.href} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-white/10 bg-white/[0.04] text-sm font-medium text-velora-text-secondary hover:border-velora-gold/30 hover:text-velora-gold">
                      <ExternalLink size={14} />
                      Open {provider.label}
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

const themeMeta: Record<ProfileThemePalette, { labelKey: string; swatch: string; gradient: string }> = {
  noir: {
    labelKey: "theme_noir",
    swatch: "bg-velora-card",
    gradient: "linear-gradient(160deg, var(--theme-bg) 0%, #141310 42%, var(--theme-bg) 100%)",
  },
  gold: {
    labelKey: "theme_gold",
    swatch: "bg-velora-gold",
    gradient: "linear-gradient(160deg, var(--theme-bg) 0%, #1a1510 34%, #12100b 68%, var(--theme-bg) 100%)",
  },
  emerald: {
    labelKey: "theme_emerald",
    swatch: "bg-velora-emerald",
    gradient: "linear-gradient(160deg, var(--theme-bg) 0%, #102018 42%, #090d09 100%)",
  },
  violet: {
    labelKey: "theme_violet",
    swatch: "bg-velora-violet",
    gradient: "linear-gradient(160deg, var(--theme-bg) 0%, #1d1726 42%, #09070d 100%)",
  },
};

export function getProfileThemeGradient(theme?: ProfileTheme): string {
  return themeMeta[theme?.palette || "gold"].gradient;
}

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
      <div className={`${panelClass} relative overflow-hidden p-4`}>
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

function createLocalId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 10000)}`;
}

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed) || /^tel:/i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block rounded-[var(--radius-md)] border border-white/8 bg-white/[0.03] p-3">
      <span className="mb-2 block text-[10px] font-medium uppercase tracking-[0.16em] text-velora-text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

function EditorChrome({
  title,
  icon: Icon,
  children,
  saving,
  onCancel,
  onSave,
}: {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  saving: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  const { t } = useTranslation();
  return (
    <ModalPortal>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-[var(--z-modal)] flex items-start justify-center overflow-y-auto bg-black/78 px-4 py-6 md:items-center"
      >
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col my-auto max-h-[calc(100dvh-3rem)] w-full max-w-[430px] overflow-hidden rounded-[var(--radius-lg)] border border-velora-gold/20 bg-velora-dark shadow-[0_-8px_30px_rgba(0,0,0,0.4),0_0_12px_var(--color-velora-gold-dim)]"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-5 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-velora-gold-dim text-velora-gold">
                <Icon size={16} />
              </span>
              <h3 className="text-heading truncate text-base text-velora-text">{title}</h3>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="flex h-9 w-9 items-center justify-center rounded-full text-velora-text-muted transition-colors hover:text-velora-text"
              aria-label={t("cancel")}
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {children}
          </div>

          <div className="flex shrink-0 gap-3 border-t border-white/8 px-5 py-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="h-11 flex-1 rounded-[var(--radius-md)] border border-white/10 text-sm font-medium text-velora-text-secondary disabled:opacity-50"
            >
              {t("cancel")}
            </button>
            <GoldButton onClick={onSave} disabled={saving} className="h-11 flex-1">
              {saving ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <>
                  <Save size={14} />
                  {t("save")}
                </>
              )}
            </GoldButton>
          </div>
        </motion.div>
      </motion.div>
    </ModalPortal>
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
  onUploadAvatar: (file: File, options?: UploadOptions) => Promise<string>;
  onUploadCover: (file: File, options?: UploadOptions) => Promise<string>;
  onUploadPortfolioImage: (file: File, options?: UploadOptions) => Promise<string>;
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

function HeaderEditor({
  profile,
  onCancel,
  onSave,
  onUploadAvatar,
  onUploadCover,
}: {
  profile: VeloraProfile;
  onCancel: () => void;
  onSave: (data: Partial<Omit<VeloraProfile, "id" | "username">>) => Promise<void>;
  onUploadAvatar: (file: File, options?: UploadOptions) => Promise<string>;
  onUploadCover: (file: File, options?: UploadOptions) => Promise<string>;
}) {
  const { showToast } = useToast();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const previewUrlsRef = useRef<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [avatarProgress, setAvatarProgress] = useState(0);
  const [coverProgress, setCoverProgress] = useState(0);
  const [form, setForm] = useState({
    fullName: profile.fullName || "",
    title: profile.title || "",
    company: profile.company || "",
    location: profile.location || "",
    avatarUrl: profile.avatarUrl || "",
    coverUrl: profile.coverUrl || "",
    professionalMode: profile.professionalMode || "entrepreneur",
  });

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current = [];
    };
  }, []);

  const setLocalPreview = (field: "avatarUrl" | "coverUrl", file: File) => {
    const previewUrl = URL.createObjectURL(file);
    previewUrlsRef.current.push(previewUrl);
    setForm((current) => ({ ...current, [field]: previewUrl }));
  };

  const clearLocalPreviews = () => {
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrlsRef.current = [];
  };

  const handleAvatar = async (file?: File) => {
    if (!file) {
      logger.warn("[Upload:avatar] image-picker:no file selected");
      return;
    }
    const previousAvatarUrl = form.avatarUrl;
    setUploading(true);
    setAvatarProgress(0);
    try {
      validateUploadImageFile(file, "avatar");
      setLocalPreview("avatarUrl", file);
      const avatarUrl = await onUploadAvatar(file, {
        onProgress: ({ percent }) => setAvatarProgress(percent),
      });
      clearLocalPreviews();
      setForm((current) => ({ ...current, avatarUrl }));
      showToast({ tone: "success", title: t("toast_avatar_success_title"), message: t("toast_avatar_success_msg") });
    } catch (error) {
      logger.error("[Upload:avatar] UI handler failed", error);
      setForm((current) => ({ ...current, avatarUrl: previousAvatarUrl }));
      showToast({ tone: "error", title: t("toast_avatar_error_title"), message: getUploadErrorMessage(error, "avatar") });
    } finally {
      setUploading(false);
      setAvatarProgress(0);
    }
  };

  const handleCover = async (file?: File) => {
    if (!file) {
      logger.warn("[Upload:cover] image-picker:no file selected");
      return;
    }
    const previousCoverUrl = form.coverUrl;
    setCoverUploading(true);
    setCoverProgress(0);
    try {
      validateUploadImageFile(file, "cover");
      setLocalPreview("coverUrl", file);
      const coverUrl = await onUploadCover(file, {
        onProgress: ({ percent }) => setCoverProgress(percent),
      });
      clearLocalPreviews();
      setForm((current) => ({ ...current, coverUrl }));
      showToast({ tone: "success", title: t("toast_banner_success_title"), message: t("toast_banner_success_msg") });
    } catch (error) {
      logger.error("[Upload:cover] UI handler failed", error);
      setForm((current) => ({ ...current, coverUrl: previousCoverUrl }));
      showToast({ tone: "error", title: t("toast_banner_error_title"), message: getUploadErrorMessage(error, "cover") });
    } finally {
      setCoverUploading(false);
      setCoverProgress(0);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await onSave(form);
      onCancel();
    } finally {
      setSaving(false);
    }
  };

  return (
    <EditorChrome title={t("edit_profile_header_title")} icon={Briefcase} saving={saving || uploading || coverUploading} onCancel={onCancel} onSave={save}>
      <div className="space-y-3">
        <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-velora-gold/20 bg-velora-surface">
          <div className="relative aspect-[16/7] min-h-[128px]">
            {form.coverUrl ? (
              <div className="h-full w-full bg-cover bg-center opacity-80" style={{ backgroundImage: `url(${form.coverUrl})` }} />
            ) : (
              <div className="h-full w-full bg-[radial-gradient(circle_at_50%_12%,var(--color-velora-gold-glow),transparent_34%),linear-gradient(145deg,var(--color-velora-surface),var(--color-velora-black))]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/10 to-transparent" />
            {coverUploading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/45">
                <Loader2 size={20} className="animate-spin text-velora-gold" />
                <span className="text-xs font-medium text-velora-gold">{coverProgress}%</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className="absolute bottom-3 right-3 inline-flex h-10 items-center gap-2 rounded-full border border-velora-gold/30 bg-black/35 px-3 text-xs font-semibold text-velora-gold backdrop-blur-md"
            >
              <Camera size={14} />
              {t("edit_profile_upload_banner")}
            </button>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.currentTarget.value = "";
                void handleCover(file);
              }}
              className="hidden"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-velora-gold/30 bg-velora-surface">
            {form.avatarUrl ? (
              <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${form.avatarUrl})` }} />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-velora-gold">
                {form.fullName.split(" ").map((part) => part[0]).join("") || "V"}
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/45">
                <Loader2 size={18} className="animate-spin text-velora-gold" />
                <span className="text-[10px] font-medium text-velora-gold">{avatarProgress}%</span>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-sm)] border border-velora-gold/25 px-3 text-xs font-medium text-velora-gold"
            >
              <Camera size={14} />
              {t("edit_profile_upload_portrait")}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.currentTarget.value = "";
                void handleAvatar(file);
              }}
              className="hidden"
            />
          </div>
        </div>
        <Field label={t("field_fullname")}>
          <input className={inputClass} value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} />
        </Field>
        <Field label={t("field_headline")}>
          <input className={inputClass} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        </Field>
        <Field label={t("field_company")}>
          <input className={inputClass} value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} />
        </Field>
        <Field label={t("field_location")}>
          <input className={inputClass} value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
        </Field>
        <Field label={t("edit_profile_cover_url")}>
          <input className={inputClass} value={form.coverUrl} onChange={(event) => setForm({ ...form, coverUrl: event.target.value })} placeholder="https://..." />
        </Field>
        <Field label={t("field_mode")}>
          <select
            className={inputClass}
            value={form.professionalMode}
            onChange={(event) => setForm({ ...form, professionalMode: event.target.value as VeloraProfile["professionalMode"] })}
          >
            <option className="bg-velora-black" value="entrepreneur">{t("setup_mode_entrepreneur")}</option>
            <option className="bg-velora-black" value="corporate">{t("setup_mode_corporate")}</option>
            <option className="bg-velora-black" value="creative">{t("setup_mode_creative")}</option>
            <option className="bg-velora-black" value="luxury">{t("setup_mode_luxury")}</option>
            <option className="bg-velora-black" value="nightlife">{t("setup_mode_nightlife")}</option>
          </select>
        </Field>
      </div>
    </EditorChrome>
  );
}

function BioEditor({
  profile,
  onCancel,
  onSave,
}: {
  profile: VeloraProfile;
  onCancel: () => void;
  onSave: (data: Partial<Omit<VeloraProfile, "id" | "username">>) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [bio, setBio] = useState(profile.bio || "");

  const save = async () => {
    setSaving(true);
    try {
      await onSave({ bio });
      onCancel();
    } finally {
      setSaving(false);
    }
  };

  return (
    <EditorChrome title={t("edit_profile_bio_title")} icon={Sparkles} saving={saving} onCancel={onCancel} onSave={save}>
      <div className="space-y-3">
        <Field label={t("field_bio_short")}>
          <textarea rows={7} className={textAreaClass} value={bio} onChange={(event) => setBio(event.target.value)} />
        </Field>
      </div>
    </EditorChrome>
  );
}

function SkillsEditor({
  profile,
  onCancel,
  onSave,
}: {
  profile: VeloraProfile;
  onCancel: () => void;
  onSave: (data: Partial<Omit<VeloraProfile, "id" | "username">>) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [skills, setSkills] = useState<string[]>(profile.skills || []);
  const [draft, setDraft] = useState("");

  const addSkill = () => {
    const next = draft.trim();
    if (!next || skills.some((skill) => skill.toLowerCase() === next.toLowerCase())) return;
    setSkills([...skills, next]);
    setDraft("");
  };

  const save = async () => {
    setSaving(true);
    try {
      await onSave({ skills });
      onCancel();
    } finally {
      setSaving(false);
    }
  };

  return (
    <EditorChrome title={t("edit_profile_skills_title_editor")} icon={Check} saving={saving} onCancel={onCancel} onSave={save}>
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            className={`${inputClass} h-11 rounded-[var(--radius-md)] border border-white/8 bg-white/[0.03] px-3`}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addSkill();
              }
            }}
            placeholder={t("edit_profile_skills_placeholder_ex")}
          />
          <button
            type="button"
            onClick={addSkill}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-velora-gold text-velora-black"
            aria-label="Add skill"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <button
              key={skill}
              type="button"
              onClick={() => setSkills(skills.filter((item) => item !== skill))}
              className="inline-flex items-center gap-1.5 rounded-full border border-velora-gold/20 bg-velora-gold/10 px-3 py-1.5 text-xs text-velora-gold"
            >
              {skill}
              <X size={12} />
            </button>
          ))}
        </div>
      </div>
    </EditorChrome>
  );
}

function ServicesEditor({
  profile,
  onCancel,
  onSave,
}: {
  profile: VeloraProfile;
  onCancel: () => void;
  onSave: (data: Partial<Omit<VeloraProfile, "id" | "username">>) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<ProfileService[]>(profile.services || []);

  const updateService = (id: string, data: Partial<ProfileService>) => {
    setServices(services.map((service) => (service.id === id ? { ...service, ...data } : service)));
  };

  const save = async () => {
    setSaving(true);
    try {
      await onSave({ services: services.filter((service) => service.title.trim()) });
      onCancel();
    } finally {
      setSaving(false);
    }
  };

  return (
    <EditorChrome title={t("edit_profile_services_title")} icon={Briefcase} saving={saving} onCancel={onCancel} onSave={save}>
      <div className="space-y-3">
        {services.map((service) => (
          <div key={service.id} className="rounded-[var(--radius-md)] border border-white/8 bg-white/[0.03] p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-velora-text-muted">{t("edit_profile_service_label")}</span>
              <button type="button" onClick={() => setServices(services.filter((item) => item.id !== service.id))} className="text-velora-rose">
                <Trash2 size={14} />
              </button>
            </div>
            <div className="space-y-3">
              <input className={inputClass} value={service.title} onChange={(event) => updateService(service.id, { title: event.target.value })} placeholder={t("edit_profile_service_title_placeholder")} />
              <textarea rows={2} className={textAreaClass} value={service.description || ""} onChange={(event) => updateService(service.id, { description: event.target.value })} placeholder={t("edit_profile_service_desc_placeholder")} />
              <input className={inputClass} value={service.price || ""} onChange={(event) => updateService(service.id, { price: event.target.value })} placeholder={t("edit_profile_service_price_placeholder")} />
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setServices([...services, { id: createLocalId("service"), title: "", description: "", price: "" }])}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-velora-gold/25 text-sm font-medium text-velora-gold"
        >
          <Plus size={15} />
          {t("edit_profile_service_add")}
        </button>
      </div>
    </EditorChrome>
  );
}

function PortfolioEditor({
  items,
  onCancel,
  onSave,
  onUploadImage,
}: {
  items: PortfolioItem[];
  onCancel: () => void;
  onSave: (items: PortfolioItem[]) => Promise<void>;
  onUploadImage: (file: File, options?: UploadOptions) => Promise<string>;
}) {
  const { showToast } = useToast();
  const { t } = useTranslation();
  const previewUrlsRef = useRef<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [drafts, setDrafts] = useState<PortfolioItem[]>(
    items.length ? items : [{ id: createLocalId("portfolio"), title: "", category: "General", description: "", link: "", imageUrl: "", order: 0 }]
  );

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current = [];
    };
  }, []);

  const updateItem = (id: string, data: Partial<PortfolioItem>) => {
    setDrafts((current) => current.map((item) => (item.id === id ? { ...item, ...data } : item)));
  };

  const handleImage = async (id: string, file?: File) => {
    if (!file) {
      logger.warn("[Upload:portfolio] image-picker:no file selected", { id });
      return;
    }
    const previousImageUrl = drafts.find((item) => item.id === id)?.imageUrl || "";

    setUploadingId(id);
    setUploadProgress(0);
    try {
      validateUploadImageFile(file, "portfolio");
      const previewUrl = URL.createObjectURL(file);
      previewUrlsRef.current.push(previewUrl);
      updateItem(id, { imageUrl: previewUrl });
      const imageUrl = await onUploadImage(file, {
        onProgress: ({ percent }) => setUploadProgress(percent),
      });
      updateItem(id, { imageUrl });
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current = [];
      showToast({ tone: "success", title: t("toast_portfolio_success_title"), message: t("toast_portfolio_success_msg") });
    } catch (error) {
      logger.error("[Upload:portfolio] UI handler failed", error);
      updateItem(id, { imageUrl: previousImageUrl });
      showToast({ tone: "error", title: t("toast_portfolio_error_title"), message: getUploadErrorMessage(error, "portfolio") });
    } finally {
      setUploadingId(null);
      setUploadProgress(0);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await onSave(
        drafts
          .filter((item) => item.title.trim())
          .map((item, index) => ({ ...item, link: normalizeUrl(item.link || ""), order: index }))
      );
      onCancel();
    } finally {
      setSaving(false);
    }
  };

  return (
    <EditorChrome title={t("edit_profile_portfolio_title")} icon={Sparkles} saving={saving || Boolean(uploadingId)} onCancel={onCancel} onSave={save}>
      <div className="space-y-3">
        {drafts.map((item) => (
          <div key={item.id} className="rounded-[var(--radius-md)] border border-white/8 bg-white/[0.03] p-3">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-velora-text-muted">{t("edit_profile_project_label")}</span>
              <button type="button" onClick={() => setDrafts(drafts.filter((draft) => draft.id !== item.id))} className="text-velora-rose">
                <Trash2 size={14} />
              </button>
            </div>
            <label className="mb-3 flex aspect-[16/9] cursor-pointer items-center justify-center overflow-hidden rounded-[var(--radius-md)] border border-dashed border-velora-gold/25 bg-velora-gold/5">
              {item.imageUrl ? (
                <div className="relative h-full w-full">
                  <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${item.imageUrl})` }} />
                  {uploadingId === item.id && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/45">
                      <Loader2 size={16} className="animate-spin text-velora-gold" />
                      <span className="text-xs font-medium text-velora-gold">{uploadProgress}%</span>
                    </div>
                  )}
                </div>
              ) : (
                <span className="flex items-center gap-2 text-xs text-velora-gold">
                  {uploadingId === item.id ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                  {uploadingId === item.id ? `${uploadProgress}%` : t("edit_profile_project_upload")}
                </span>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.currentTarget.value = "";
                  void handleImage(item.id, file);
                }}
              />
            </label>
            <div className="space-y-3">
              <input className={inputClass} value={item.title} onChange={(event) => updateItem(item.id, { title: event.target.value })} placeholder={t("edit_profile_project_title_placeholder")} />
              <input className={inputClass} value={item.category} onChange={(event) => updateItem(item.id, { category: event.target.value })} placeholder={t("edit_profile_project_category_placeholder")} />
              <textarea rows={2} className={textAreaClass} value={item.description || ""} onChange={(event) => updateItem(item.id, { description: event.target.value })} placeholder={t("field_description")} />
              <input className={inputClass} value={item.link || ""} onChange={(event) => updateItem(item.id, { link: event.target.value })} placeholder={t("edit_profile_project_link_placeholder")} />
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setDrafts([...drafts, { id: createLocalId("portfolio"), title: "", category: "General", description: "", link: "", imageUrl: "", order: drafts.length }])}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-velora-gold/25 text-sm font-medium text-velora-gold"
        >
          <Plus size={15} />
          {t("edit_profile_project_add")}
        </button>
      </div>
    </EditorChrome>
  );
}

function ExperienceEditor({
  items,
  onCancel,
  onSave,
}: {
  items: ExperienceEntry[];
  onCancel: () => void;
  onSave: (items: ExperienceEntry[]) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [drafts, setDrafts] = useState<ExperienceEntry[]>(
    items.length
      ? items
      : [{ id: createLocalId("experience"), company: "", role: "", description: "", startYear: new Date().getFullYear(), endYear: undefined, isCurrent: true, order: 0 }]
  );

  const updateItem = (id: string, data: Partial<ExperienceEntry>) => {
    setDrafts(drafts.map((item) => (item.id === id ? { ...item, ...data } : item)));
  };

  const save = async () => {
    setSaving(true);
    try {
      await onSave(
        drafts
          .filter((item) => item.role.trim() || item.company.trim())
          .map((item, index) => ({ ...item, order: index }))
      );
      onCancel();
    } finally {
      setSaving(false);
    }
  };

  return (
    <EditorChrome title={t("edit_profile_experience_title")} icon={Briefcase} saving={saving} onCancel={onCancel} onSave={save}>
      <div className="space-y-3">
        {drafts.map((item) => (
          <div key={item.id} className="rounded-[var(--radius-md)] border border-white/8 bg-white/[0.03] p-3">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-velora-text-muted">{t("edit_profile_experience_label")}</span>
              <button type="button" onClick={() => setDrafts(drafts.filter((draft) => draft.id !== item.id))} className="text-velora-rose">
                <Trash2 size={14} />
              </button>
            </div>
            <div className="space-y-3">
              <input className={inputClass} value={item.role} onChange={(event) => updateItem(item.id, { role: event.target.value })} placeholder={t("edit_profile_experience_role_placeholder")} />
              <input className={inputClass} value={item.company} onChange={(event) => updateItem(item.id, { company: event.target.value })} placeholder={t("edit_profile_experience_company_placeholder")} />
              <div className="grid grid-cols-2 gap-3">
                <input className={inputClass} type="number" value={item.startYear} onChange={(event) => updateItem(item.id, { startYear: Number(event.target.value) })} placeholder={t("edit_profile_experience_start_placeholder")} />
                <input className={inputClass} type="number" value={item.endYear || ""} disabled={item.isCurrent} onChange={(event) => updateItem(item.id, { endYear: event.target.value ? Number(event.target.value) : undefined })} placeholder={t("edit_profile_experience_end_placeholder")} />
              </div>
              <label className="flex items-center gap-2 text-xs text-velora-text-secondary">
                <input type="checkbox" checked={item.isCurrent} onChange={(event) => updateItem(item.id, { isCurrent: event.target.checked, endYear: event.target.checked ? undefined : item.endYear })} />
                {t("edit_profile_experience_current")}
              </label>
              <textarea rows={3} className={textAreaClass} value={item.description || ""} onChange={(event) => updateItem(item.id, { description: event.target.value })} placeholder={t("field_description")} />
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setDrafts([...drafts, { id: createLocalId("experience"), company: "", role: "", description: "", startYear: new Date().getFullYear(), endYear: undefined, isCurrent: true, order: drafts.length }])}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-velora-gold/25 text-sm font-medium text-velora-gold"
        >
          <Plus size={15} />
          {t("edit_profile_experience_add")}
        </button>
      </div>
    </EditorChrome>
  );
}

function ContactEditor({
  profile,
  onCancel,
  onSave,
}: {
  profile: VeloraProfile;
  onCancel: () => void;
  onSave: (data: Partial<Omit<VeloraProfile, "id" | "username">>) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    email: profile.email || "",
    phone: profile.phone || "",
    whatsapp: profile.whatsapp || "",
    website: profile.website || "",
    contactActions: profile.contactActions,
  });

  const updateAction = (data: Partial<ContactActionSettings>) => {
    setForm({ ...form, contactActions: { ...form.contactActions, ...data } });
  };

  const save = async () => {
    setSaving(true);
    try {
      await onSave({
        email: form.email,
        phone: form.phone,
        whatsapp: form.whatsapp,
        website: normalizeUrl(form.website),
        contactActions: {
          ...form.contactActions,
          bookingUrl: normalizeUrl(form.contactActions.bookingUrl || ""),
        },
      });
      onCancel();
    } finally {
      setSaving(false);
    }
  };

  return (
    <EditorChrome title={t("edit_profile_contact_title")} icon={MessageCircle} saving={saving} onCancel={onCancel} onSave={save}>
      <div className="space-y-3">
        <Field label={t("contact_whatsapp")}>
          <input className={inputClass} value={form.whatsapp} onChange={(event) => setForm({ ...form, whatsapp: event.target.value })} />
        </Field>
        <Field label={t("field_email")}>
          <input className={inputClass} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        </Field>
        <Field label={t("field_phone")}>
          <input className={inputClass} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
        </Field>
        <Field label={t("field_website")}>
          <input className={inputClass} value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} />
        </Field>
        <Field label={t("edit_profile_booking_link")}>
          <input className={inputClass} value={form.contactActions.bookingUrl || ""} onChange={(event) => updateAction({ bookingUrl: event.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          {(["whatsapp", "email", "phone", "website"] as const).map((key) => (
            <label key={key} className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-white/8 bg-white/[0.03] p-3 text-xs capitalize text-velora-text-secondary">
              <input type="checkbox" checked={Boolean(form.contactActions[key])} onChange={(event) => updateAction({ [key]: event.target.checked })} />
              {key === "whatsapp" ? t("contact_whatsapp") : key === "email" ? t("field_email") : key === "phone" ? t("field_phone") : t("field_website")}
            </label>
          ))}
        </div>
        <Field label={t("edit_profile_primary_action")}>
          <select className={inputClass} value={form.contactActions.primary} onChange={(event) => updateAction({ primary: event.target.value as ContactActionSettings["primary"] })}>
            <option className="bg-velora-black" value="whatsapp">{t("contact_whatsapp")}</option>
            <option className="bg-velora-black" value="email">{t("field_email")}</option>
            <option className="bg-velora-black" value="phone">{t("field_phone")}</option>
            <option className="bg-velora-black" value="website">{t("field_website")}</option>
            <option className="bg-velora-black" value="booking">{t("edit_profile_booking")}</option>
          </select>
        </Field>
      </div>
    </EditorChrome>
  );
}

function SocialEditor({
  profile,
  onCancel,
  onSave,
}: {
  profile: VeloraProfile;
  onCancel: () => void;
  onSave: (data: Partial<Omit<VeloraProfile, "id" | "username">>) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [links, setLinks] = useState<SocialLink[]>(profile.socialLinks || []);

  const updateLink = (index: number, data: Partial<SocialLink>) => {
    setLinks(links.map((link, i) => (i === index ? { ...link, ...data } : link)));
  };

  const save = async () => {
    setSaving(true);
    try {
      await onSave({
        socialLinks: links
          .filter((link) => link.platform.trim() && link.url.trim())
          .map((link) => ({ ...link, url: normalizeUrl(link.url) })),
      });
      onCancel();
    } finally {
      setSaving(false);
    }
  };

  return (
    <EditorChrome title={t("edit_profile_social_title")} icon={ExternalLink} saving={saving} onCancel={onCancel} onSave={save}>
      <div className="space-y-3">
        {links.map((link, index) => (
          <div key={index} className="rounded-[var(--radius-md)] border border-white/8 bg-white/[0.03] p-3">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-velora-text-muted">{t("edit_profile_social_label")}</span>
              <button type="button" onClick={() => setLinks(links.filter((_, i) => i !== index))} className="text-velora-rose">
                <Trash2 size={14} />
              </button>
            </div>
            <div className="grid grid-cols-[1fr_54px] gap-3">
              <input className={inputClass} value={link.platform} onChange={(event) => updateLink(index, { platform: event.target.value })} placeholder={t("edit_profile_social_platform_placeholder")} />
              <input className={inputClass} value={link.icon} onChange={(event) => updateLink(index, { icon: event.target.value.slice(0, 2) })} placeholder={t("edit_profile_social_icon_placeholder")} />
            </div>
            <input className={`${inputClass} mt-3`} value={link.url} onChange={(event) => updateLink(index, { url: event.target.value })} placeholder={t("edit_profile_social_url_placeholder")} />
            <input className={`${inputClass} mt-3`} value={link.color} onChange={(event) => updateLink(index, { color: event.target.value })} placeholder={t("edit_profile_social_color_placeholder")} />
          </div>
        ))}
        <button
          type="button"
          onClick={() => setLinks([...links, { platform: "", url: "", color: "#C4A265", icon: "in" }])}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-velora-gold/25 text-sm font-medium text-velora-gold"
        >
          <Plus size={15} />
          {t("edit_profile_social_add")}
        </button>
      </div>
    </EditorChrome>
  );
}

function ThemeEditor({
  profile,
  onCancel,
  onSave,
}: {
  profile: VeloraProfile;
  onCancel: () => void;
  onSave: (data: Partial<Omit<VeloraProfile, "id" | "username">>) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState<ProfileTheme>(profile.profileTheme || { palette: "gold" });

  const save = async () => {
    setSaving(true);
    try {
      await onSave({ profileTheme: theme });
      onCancel();
    } finally {
      setSaving(false);
    }
  };

  return (
    <EditorChrome title={t("edit_profile_theme_title")} icon={Palette} saving={saving} onCancel={onCancel} onSave={save}>
      <div className="grid grid-cols-2 gap-3">
        {(Object.keys(themeMeta) as ProfileThemePalette[]).map((palette) => {
          const active = theme.palette === palette;
          return (
            <button
              key={palette}
              type="button"
              onClick={() => setTheme({ ...theme, palette })}
              className={`rounded-[var(--radius-md)] border p-3 text-left transition-colors ${active ? "border-velora-gold/50 bg-velora-gold/10" : "border-white/8 bg-white/[0.03]"}`}
            >
              <span className={`mb-3 block h-10 rounded-[var(--radius-sm)] ${themeMeta[palette].swatch}`} />
              <span className="text-sm font-medium text-velora-text">{t(themeMeta[palette].labelKey)}</span>
            </button>
          );
        })}
      </div>
    </EditorChrome>
  );
}

function AvailabilityEditor({
  profile,
  onCancel,
  onSave,
}: {
  profile: VeloraProfile;
  onCancel: () => void;
  onSave: (data: Partial<Omit<VeloraProfile, "id" | "username">>) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<AvailabilityStatus>(profile.availabilityStatus || "available");

  const save = async () => {
    setSaving(true);
    try {
      await onSave({ availabilityStatus: status });
      onCancel();
    } finally {
      setSaving(false);
    }
  };

  return (
    <EditorChrome title={t("edit_profile_availability_title")} icon={Check} saving={saving} onCancel={onCancel} onSave={save}>
      <div className="space-y-2">
        {[
          { key: "available", labelKey: "availability_available", descKey: "availability_available_desc" },
          { key: "busy", labelKey: "availability_selective", descKey: "availability_selective_desc" },
          { key: "offline", labelKey: "availability_unavailable", descKey: "availability_unavailable_desc" },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setStatus(item.key as AvailabilityStatus)}
            className={`w-full rounded-[var(--radius-md)] border p-3 text-left transition-colors ${status === item.key ? "border-velora-gold/50 bg-velora-gold/10" : "border-white/8 bg-white/[0.03]"}`}
          >
            <span className="block text-sm font-medium text-velora-text">{t(item.labelKey)}</span>
            <span className="mt-1 block text-xs text-velora-text-muted">{t(item.descKey)}</span>
          </button>
        ))}
      </div>
    </EditorChrome>
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
