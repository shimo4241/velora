"use client";

import { useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Briefcase,
  Camera,
  Check,
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

const themeMeta: Record<ProfileThemePalette, { label: string; swatch: string; gradient: string }> = {
  noir: {
    label: "Noir",
    swatch: "bg-velora-card",
    gradient: "linear-gradient(160deg, #070705 0%, #141310 42%, #070705 100%)",
  },
  gold: {
    label: "Gold",
    swatch: "bg-velora-gold",
    gradient: "linear-gradient(160deg, #070705 0%, #1a1510 34%, #12100b 68%, #070705 100%)",
  },
  emerald: {
    label: "Emerald",
    swatch: "bg-velora-emerald",
    gradient: "linear-gradient(160deg, #070705 0%, #102018 42%, #090d09 100%)",
  },
  violet: {
    label: "Violet",
    swatch: "bg-velora-violet",
    gradient: "linear-gradient(160deg, #070705 0%, #1d1726 42%, #09070d 100%)",
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
      whileTap={{ scale: 0.92 }}
      className={`absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/8 text-velora-gold shadow-[0_8px_24px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-colors duration-300 hover:border-velora-gold/45 hover:bg-velora-gold/12 focus:border-velora-gold/60 ${className}`}
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

export function EmptyEditableState({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[92px] items-center justify-center rounded-[var(--radius-md)] border border-dashed border-velora-gold/20 bg-velora-gold/5 px-4 text-center text-xs text-velora-text-muted">
      {children}
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
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[220] flex items-end justify-center bg-black/55 px-0 backdrop-blur-sm sm:items-center sm:px-5"
    >
      <motion.div
        initial={{ y: 28, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 28, opacity: 0 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="glass-strong max-h-[88dvh] w-full max-w-[430px] overflow-hidden rounded-t-[var(--radius-lg)] border border-white/12 bg-velora-black/96 shadow-[0_-20px_80px_rgba(0,0,0,0.55)] sm:rounded-[var(--radius-lg)]"
      >
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
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
            aria-label="Cancel"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[calc(88dvh-130px)] overflow-y-auto px-5 py-4">
          {children}
        </div>

        <div className="flex gap-3 border-t border-white/8 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="h-11 flex-1 rounded-[var(--radius-md)] border border-white/10 text-sm font-medium text-velora-text-secondary disabled:opacity-50"
          >
            Cancel
          </button>
          <GoldButton onClick={onSave} disabled={saving} className="h-11 flex-1">
            {saving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <>
                <Save size={14} />
                Save
              </>
            )}
          </GoldButton>
        </div>
      </motion.div>
    </motion.div>
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
  onUploadAvatar: (file: File) => Promise<string>;
  onUploadPortfolioImage: (file: File) => Promise<string>;
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
}: {
  profile: VeloraProfile;
  onCancel: () => void;
  onSave: (data: Partial<Omit<VeloraProfile, "id" | "username">>) => Promise<void>;
  onUploadAvatar: (file: File) => Promise<string>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    fullName: profile.fullName || "",
    title: profile.title || "",
    company: profile.company || "",
    location: profile.location || "",
    avatarUrl: profile.avatarUrl || "",
    professionalMode: profile.professionalMode || "entrepreneur",
  });

  const handleAvatar = async (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setForm((current) => ({ ...current, avatarUrl: String(event.target?.result || "") }));
    };
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const avatarUrl = await onUploadAvatar(file);
      setForm((current) => ({ ...current, avatarUrl }));
    } finally {
      setUploading(false);
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
    <EditorChrome title="Edit profile header" icon={Briefcase} saving={saving || uploading} onCancel={onCancel} onSave={save}>
      <div className="space-y-3">
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
              <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                <Loader2 size={18} className="animate-spin text-velora-gold" />
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
              Upload portrait
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(event) => void handleAvatar(event.target.files?.[0])}
              className="hidden"
            />
          </div>
        </div>
        <Field label="Full name">
          <input className={inputClass} value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} />
        </Field>
        <Field label="Headline">
          <input className={inputClass} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        </Field>
        <Field label="Company">
          <input className={inputClass} value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} />
        </Field>
        <Field label="Location">
          <input className={inputClass} value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
        </Field>
        <Field label="Mode">
          <select
            className={inputClass}
            value={form.professionalMode}
            onChange={(event) => setForm({ ...form, professionalMode: event.target.value as VeloraProfile["professionalMode"] })}
          >
            <option className="bg-velora-black" value="entrepreneur">Entrepreneur</option>
            <option className="bg-velora-black" value="corporate">Corporate</option>
            <option className="bg-velora-black" value="creative">Creative</option>
            <option className="bg-velora-black" value="luxury">Luxury</option>
            <option className="bg-velora-black" value="nightlife">Nightlife</option>
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
    <EditorChrome title="Edit bio" icon={Sparkles} saving={saving} onCancel={onCancel} onSave={save}>
      <Field label="Bio">
        <textarea rows={7} className={textAreaClass} value={bio} onChange={(event) => setBio(event.target.value)} />
      </Field>
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
    <EditorChrome title="Edit skills" icon={Check} saving={saving} onCancel={onCancel} onSave={save}>
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
            placeholder="Brand strategy"
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
    <EditorChrome title="Edit services" icon={Briefcase} saving={saving} onCancel={onCancel} onSave={save}>
      <div className="space-y-3">
        {services.map((service) => (
          <div key={service.id} className="rounded-[var(--radius-md)] border border-white/8 bg-white/[0.03] p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-velora-text-muted">Service</span>
              <button type="button" onClick={() => setServices(services.filter((item) => item.id !== service.id))} className="text-velora-rose">
                <Trash2 size={14} />
              </button>
            </div>
            <div className="space-y-3">
              <input className={inputClass} value={service.title} onChange={(event) => updateService(service.id, { title: event.target.value })} placeholder="Private consultation" />
              <textarea rows={2} className={textAreaClass} value={service.description || ""} onChange={(event) => updateService(service.id, { description: event.target.value })} placeholder="Short description" />
              <input className={inputClass} value={service.price || ""} onChange={(event) => updateService(service.id, { price: event.target.value })} placeholder="From 1,500 MAD" />
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setServices([...services, { id: createLocalId("service"), title: "", description: "", price: "" }])}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-velora-gold/25 text-sm font-medium text-velora-gold"
        >
          <Plus size={15} />
          Add service
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
  onUploadImage: (file: File) => Promise<string>;
}) {
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<PortfolioItem[]>(
    items.length ? items : [{ id: createLocalId("portfolio"), title: "", category: "General", description: "", link: "", imageUrl: "", order: 0 }]
  );

  const updateItem = (id: string, data: Partial<PortfolioItem>) => {
    setDrafts(drafts.map((item) => (item.id === id ? { ...item, ...data } : item)));
  };

  const handleImage = async (id: string, file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => updateItem(id, { imageUrl: String(event.target?.result || "") });
    reader.readAsDataURL(file);

    setUploadingId(id);
    try {
      const imageUrl = await onUploadImage(file);
      updateItem(id, { imageUrl });
    } finally {
      setUploadingId(null);
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
    <EditorChrome title="Edit portfolio" icon={Sparkles} saving={saving || Boolean(uploadingId)} onCancel={onCancel} onSave={save}>
      <div className="space-y-3">
        {drafts.map((item) => (
          <div key={item.id} className="rounded-[var(--radius-md)] border border-white/8 bg-white/[0.03] p-3">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-velora-text-muted">Project</span>
              <button type="button" onClick={() => setDrafts(drafts.filter((draft) => draft.id !== item.id))} className="text-velora-rose">
                <Trash2 size={14} />
              </button>
            </div>
            <label className="mb-3 flex aspect-[16/9] cursor-pointer items-center justify-center overflow-hidden rounded-[var(--radius-md)] border border-dashed border-velora-gold/25 bg-velora-gold/5">
              {item.imageUrl ? (
                <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${item.imageUrl})` }} />
              ) : (
                <span className="flex items-center gap-2 text-xs text-velora-gold">
                  {uploadingId === item.id ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                  Upload image
                </span>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={(event) => void handleImage(item.id, event.target.files?.[0])} />
            </label>
            <div className="space-y-3">
              <input className={inputClass} value={item.title} onChange={(event) => updateItem(item.id, { title: event.target.value })} placeholder="Project title" />
              <input className={inputClass} value={item.category} onChange={(event) => updateItem(item.id, { category: event.target.value })} placeholder="Category" />
              <textarea rows={2} className={textAreaClass} value={item.description || ""} onChange={(event) => updateItem(item.id, { description: event.target.value })} placeholder="Description" />
              <input className={inputClass} value={item.link || ""} onChange={(event) => updateItem(item.id, { link: event.target.value })} placeholder="https://project.com" />
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setDrafts([...drafts, { id: createLocalId("portfolio"), title: "", category: "General", description: "", link: "", imageUrl: "", order: drafts.length }])}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-velora-gold/25 text-sm font-medium text-velora-gold"
        >
          <Plus size={15} />
          Add project
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
    <EditorChrome title="Edit experience" icon={Briefcase} saving={saving} onCancel={onCancel} onSave={save}>
      <div className="space-y-3">
        {drafts.map((item) => (
          <div key={item.id} className="rounded-[var(--radius-md)] border border-white/8 bg-white/[0.03] p-3">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-velora-text-muted">Experience</span>
              <button type="button" onClick={() => setDrafts(drafts.filter((draft) => draft.id !== item.id))} className="text-velora-rose">
                <Trash2 size={14} />
              </button>
            </div>
            <div className="space-y-3">
              <input className={inputClass} value={item.role} onChange={(event) => updateItem(item.id, { role: event.target.value })} placeholder="Role" />
              <input className={inputClass} value={item.company} onChange={(event) => updateItem(item.id, { company: event.target.value })} placeholder="Company" />
              <div className="grid grid-cols-2 gap-3">
                <input className={inputClass} type="number" value={item.startYear} onChange={(event) => updateItem(item.id, { startYear: Number(event.target.value) })} placeholder="Start year" />
                <input className={inputClass} type="number" value={item.endYear || ""} disabled={item.isCurrent} onChange={(event) => updateItem(item.id, { endYear: event.target.value ? Number(event.target.value) : undefined })} placeholder="End year" />
              </div>
              <label className="flex items-center gap-2 text-xs text-velora-text-secondary">
                <input type="checkbox" checked={item.isCurrent} onChange={(event) => updateItem(item.id, { isCurrent: event.target.checked, endYear: event.target.checked ? undefined : item.endYear })} />
                Current role
              </label>
              <textarea rows={3} className={textAreaClass} value={item.description || ""} onChange={(event) => updateItem(item.id, { description: event.target.value })} placeholder="Description" />
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setDrafts([...drafts, { id: createLocalId("experience"), company: "", role: "", description: "", startYear: new Date().getFullYear(), endYear: undefined, isCurrent: true, order: drafts.length }])}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-velora-gold/25 text-sm font-medium text-velora-gold"
        >
          <Plus size={15} />
          Add experience
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
    <EditorChrome title="Edit contact actions" icon={MessageCircle} saving={saving} onCancel={onCancel} onSave={save}>
      <div className="space-y-3">
        <Field label="WhatsApp">
          <input className={inputClass} value={form.whatsapp} onChange={(event) => setForm({ ...form, whatsapp: event.target.value })} />
        </Field>
        <Field label="Email">
          <input className={inputClass} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        </Field>
        <Field label="Phone">
          <input className={inputClass} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
        </Field>
        <Field label="Website">
          <input className={inputClass} value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} />
        </Field>
        <Field label="Booking link">
          <input className={inputClass} value={form.contactActions.bookingUrl || ""} onChange={(event) => updateAction({ bookingUrl: event.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          {(["whatsapp", "email", "phone", "website"] as const).map((key) => (
            <label key={key} className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-white/8 bg-white/[0.03] p-3 text-xs capitalize text-velora-text-secondary">
              <input type="checkbox" checked={Boolean(form.contactActions[key])} onChange={(event) => updateAction({ [key]: event.target.checked })} />
              {key}
            </label>
          ))}
        </div>
        <Field label="Primary action">
          <select className={inputClass} value={form.contactActions.primary} onChange={(event) => updateAction({ primary: event.target.value as ContactActionSettings["primary"] })}>
            <option className="bg-velora-black" value="whatsapp">WhatsApp</option>
            <option className="bg-velora-black" value="email">Email</option>
            <option className="bg-velora-black" value="phone">Phone</option>
            <option className="bg-velora-black" value="website">Website</option>
            <option className="bg-velora-black" value="booking">Booking</option>
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
    <EditorChrome title="Edit social links" icon={ExternalLink} saving={saving} onCancel={onCancel} onSave={save}>
      <div className="space-y-3">
        {links.map((link, index) => (
          <div key={index} className="rounded-[var(--radius-md)] border border-white/8 bg-white/[0.03] p-3">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-velora-text-muted">Social link</span>
              <button type="button" onClick={() => setLinks(links.filter((_, i) => i !== index))} className="text-velora-rose">
                <Trash2 size={14} />
              </button>
            </div>
            <div className="grid grid-cols-[1fr_54px] gap-3">
              <input className={inputClass} value={link.platform} onChange={(event) => updateLink(index, { platform: event.target.value })} placeholder="LinkedIn" />
              <input className={inputClass} value={link.icon} onChange={(event) => updateLink(index, { icon: event.target.value.slice(0, 2) })} placeholder="in" />
            </div>
            <input className={`${inputClass} mt-3`} value={link.url} onChange={(event) => updateLink(index, { url: event.target.value })} placeholder="https://linkedin.com/in/..." />
            <input className={`${inputClass} mt-3`} value={link.color} onChange={(event) => updateLink(index, { color: event.target.value })} placeholder="#C4A265" />
          </div>
        ))}
        <button
          type="button"
          onClick={() => setLinks([...links, { platform: "", url: "", color: "#C4A265", icon: "in" }])}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-velora-gold/25 text-sm font-medium text-velora-gold"
        >
          <Plus size={15} />
          Add social link
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
    <EditorChrome title="Customize theme" icon={Palette} saving={saving} onCancel={onCancel} onSave={save}>
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
              <span className="text-sm font-medium text-velora-text">{themeMeta[palette].label}</span>
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
    <EditorChrome title="Edit availability" icon={Check} saving={saving} onCancel={onCancel} onSave={save}>
      <div className="space-y-2">
        {[
          { key: "available", label: "Available", description: "Open to new projects and introductions" },
          { key: "busy", label: "Selective", description: "Available for select opportunities" },
          { key: "offline", label: "Unavailable", description: "Not taking new requests right now" },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setStatus(item.key as AvailabilityStatus)}
            className={`w-full rounded-[var(--radius-md)] border p-3 text-left transition-colors ${status === item.key ? "border-velora-gold/50 bg-velora-gold/10" : "border-white/8 bg-white/[0.03]"}`}
          >
            <span className="block text-sm font-medium text-velora-text">{item.label}</span>
            <span className="mt-1 block text-xs text-velora-text-muted">{item.description}</span>
          </button>
        ))}
      </div>
    </EditorChrome>
  );
}

export function SkillChips({ skills }: { skills: string[] }) {
  if (!skills.length) return <EmptyEditableState>Add skills</EmptyEditableState>;

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

export function ServicesList({ services }: { services: ProfileService[] }) {
  if (!services.length) return <EmptyEditableState>Add your first service</EmptyEditableState>;

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
  const meta = {
    available: { label: "Available", className: "bg-velora-emerald/12 text-velora-emerald border-velora-emerald/25" },
    busy: { label: "Selective", className: "bg-velora-gold/12 text-velora-gold border-velora-gold/25" },
    offline: { label: "Unavailable", className: "bg-velora-rose/12 text-velora-rose border-velora-rose/25" },
  }[status || "available"];

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${meta.className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {meta.label}
    </span>
  );
}

export function ContactActionGrid({ profile }: { profile: VeloraProfile }) {
  const actions = [
    {
      key: "whatsapp",
      label: "WhatsApp",
      icon: MessageCircle,
      enabled: profile.contactActions.whatsapp && Boolean(profile.whatsapp),
      href: profile.whatsapp ? `https://wa.me/${profile.whatsapp.replace(/\D/g, "")}` : "",
      className: "text-velora-whatsapp border-velora-whatsapp/20 bg-velora-whatsapp/10",
    },
    {
      key: "email",
      label: "Email",
      icon: Mail,
      enabled: profile.contactActions.email && Boolean(profile.email),
      href: profile.email ? `mailto:${profile.email}` : "",
      className: "text-velora-blue border-velora-blue/15 bg-velora-blue/10",
    },
    {
      key: "phone",
      label: "Call",
      icon: Phone,
      enabled: profile.contactActions.phone && Boolean(profile.phone || profile.whatsapp),
      href: profile.phone || profile.whatsapp ? `tel:${profile.phone || profile.whatsapp}` : "",
      className: "text-velora-gold border-velora-gold/20 bg-velora-gold/10",
    },
    {
      key: "website",
      label: "Website",
      icon: Globe,
      enabled: profile.contactActions.website && Boolean(profile.website),
      href: profile.website || "",
      className: "text-velora-violet border-velora-violet/20 bg-velora-violet/10",
    },
  ];
  const visible = actions.filter((action) => action.enabled);

  if (!visible.length) return <EmptyEditableState>Add contact actions</EmptyEditableState>;

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
  if (!links.length) return <EmptyEditableState>Add social links</EmptyEditableState>;

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

