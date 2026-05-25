"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { Briefcase, Camera, Loader2 } from "lucide-react";
import { useToast } from "@/providers/ToastProvider";
import { logger } from "@/lib/logger";
import {
  validateUploadImageFile,
  getUploadErrorMessage,
  type UploadOptions,
} from "@/services";
import type { VeloraProfile } from "@/types";
import EditorChrome from "./EditorChrome";
import { Field, inputClass } from "./shared";

interface HeaderEditorProps {
  profile: VeloraProfile;
  onCancel: () => void;
  onSave: (data: Partial<Omit<VeloraProfile, "id" | "username">>) => Promise<void>;
  onUploadAvatar: (file: File, options?: UploadOptions) => Promise<string>;
  onUploadCover: (file: File, options?: UploadOptions) => Promise<string>;
}

export default function HeaderEditor({
  profile,
  onCancel,
  onSave,
  onUploadAvatar,
  onUploadCover,
}: HeaderEditorProps) {
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
      showToast({
        tone: "success",
        title: t("toast_avatar_success_title"),
        message: t("toast_avatar_success_msg"),
      });
    } catch (error) {
      logger.error("[Upload:avatar] UI handler failed", error);
      setForm((current) => ({ ...current, avatarUrl: previousAvatarUrl }));
      showToast({
        tone: "error",
        title: t("toast_avatar_error_title"),
        message: getUploadErrorMessage(error, "avatar"),
      });
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
      showToast({
        tone: "success",
        title: t("toast_banner_success_title"),
        message: t("toast_banner_success_msg"),
      });
    } catch (error) {
      logger.error("[Upload:cover] UI handler failed", error);
      setForm((current) => ({ ...current, coverUrl: previousCoverUrl }));
      showToast({
        tone: "error",
        title: t("toast_banner_error_title"),
        message: getUploadErrorMessage(error, "cover"),
      });
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
    <EditorChrome
      title={t("edit_profile_header_title")}
      icon={Briefcase}
      saving={saving || uploading || coverUploading}
      onCancel={onCancel}
      onSave={save}
    >
      <div className="space-y-3">
        <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-velora-gold/20 bg-velora-surface">
          <div className="relative aspect-[16/7] min-h-[128px]">
            {form.coverUrl ? (
              <div
                className="h-full w-full bg-cover bg-center opacity-80"
                style={{ backgroundImage: `url(${form.coverUrl})` }}
              />
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
              <div
                className="h-full w-full bg-cover bg-center"
                style={{ backgroundImage: `url(${form.avatarUrl})` }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-velora-gold">
                {form.fullName
                  .split(" ")
                  .map((part) => part[0])
                  .join("") || "V"}
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
          <input
            className={inputClass}
            value={form.fullName}
            onChange={(event) => setForm({ ...form, fullName: event.target.value })}
          />
        </Field>
        <Field label={t("field_headline")}>
          <input
            className={inputClass}
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
          />
        </Field>
        <Field label={t("field_company")}>
          <input
            className={inputClass}
            value={form.company}
            onChange={(event) => setForm({ ...form, company: event.target.value })}
          />
        </Field>
        <Field label={t("field_location")}>
          <input
            className={inputClass}
            value={form.location}
            onChange={(event) => setForm({ ...form, location: event.target.value })}
          />
        </Field>
        <Field label={t("edit_profile_cover_url")}>
          <input
            className={inputClass}
            value={form.coverUrl}
            onChange={(event) => setForm({ ...form, coverUrl: event.target.value })}
            placeholder="https://..."
          />
        </Field>
        <Field label={t("field_mode")}>
          <select
            className={inputClass}
            value={form.professionalMode}
            onChange={(event) =>
              setForm({
                ...form,
                professionalMode: event.target.value as VeloraProfile["professionalMode"],
              })
            }
          >
            <option className="bg-velora-black" value="entrepreneur">
              {t("setup_mode_entrepreneur")}
            </option>
            <option className="bg-velora-black" value="corporate">
              {t("setup_mode_corporate")}
            </option>
            <option className="bg-velora-black" value="creative">
              {t("setup_mode_creative")}
            </option>
            <option className="bg-velora-black" value="luxury">
              {t("setup_mode_luxury")}
            </option>
            <option className="bg-velora-black" value="nightlife">
              {t("setup_mode_nightlife")}
            </option>
          </select>
        </Field>
      </div>
    </EditorChrome>
  );
}
