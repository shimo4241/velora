"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { ExternalLink, Trash2, Plus } from "lucide-react";
import type { VeloraProfile, SocialLink } from "@/types";
import EditorChrome from "./EditorChrome";
import { inputClass, normalizeUrl } from "./shared";

interface SocialEditorProps {
  profile: VeloraProfile;
  onCancel: () => void;
  onSave: (data: Partial<Omit<VeloraProfile, "id" | "username">>) => Promise<void>;
}

export default function SocialEditor({ profile, onCancel, onSave }: SocialEditorProps) {
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
    <EditorChrome
      title={t("edit_profile_social_title")}
      icon={ExternalLink}
      saving={saving}
      onCancel={onCancel}
      onSave={save}
    >
      <div className="space-y-3">
        {links.map((link, index) => (
          <div key={index} className="rounded-[var(--radius-md)] border border-white/8 bg-white/[0.03] p-3">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-velora-text-muted">
                {t("edit_profile_social_label")}
              </span>
              <button
                type="button"
                onClick={() => setLinks(links.filter((_, i) => i !== index))}
                className="text-velora-rose"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className="grid grid-cols-[1fr_54px] gap-3">
              <input
                className={inputClass}
                value={link.platform}
                onChange={(event) => updateLink(index, { platform: event.target.value })}
                placeholder={t("edit_profile_social_platform_placeholder")}
              />
              <input
                className={inputClass}
                value={link.icon}
                onChange={(event) => updateLink(index, { icon: event.target.value.slice(0, 2) })}
                placeholder={t("edit_profile_social_icon_placeholder")}
              />
            </div>
            <input
              className={`${inputClass} mt-3`}
              value={link.url}
              onChange={(event) => updateLink(index, { url: event.target.value })}
              placeholder={t("edit_profile_social_url_placeholder")}
            />
            <input
              className={`${inputClass} mt-3`}
              value={link.color}
              onChange={(event) => updateLink(index, { color: event.target.value })}
              placeholder={t("edit_profile_social_color_placeholder")}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            setLinks([...links, { platform: "", url: "", color: "#C4A265", icon: "in" }])
          }
          className="flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-velora-gold/25 text-sm font-medium text-velora-gold"
        >
          <Plus size={15} />
          {t("edit_profile_social_add")}
        </button>
      </div>
    </EditorChrome>
  );
}
