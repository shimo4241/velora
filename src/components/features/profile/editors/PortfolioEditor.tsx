"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { Sparkles, Trash2, Camera, Loader2, Plus } from "lucide-react";
import { useToast } from "@/providers/ToastProvider";
import { logger } from "@/lib/logger";
import {
  validateUploadImageFile,
  getUploadErrorMessage,
  type UploadOptions,
} from "@/services";
import type { PortfolioItem } from "@/types";
import EditorChrome from "./EditorChrome";
import { createLocalId, normalizeUrl, inputClass, textAreaClass } from "./shared";

interface PortfolioEditorProps {
  items: PortfolioItem[];
  onCancel: () => void;
  onSave: (items: PortfolioItem[]) => Promise<void>;
  onUploadImage: (file: File, options?: UploadOptions) => Promise<string>;
}

export default function PortfolioEditor({
  items,
  onCancel,
  onSave,
  onUploadImage,
}: PortfolioEditorProps) {
  const { showToast } = useToast();
  const { t } = useTranslation();
  const previewUrlsRef = useRef<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [drafts, setDrafts] = useState<PortfolioItem[]>(
    items.length
      ? items
      : [
          {
            id: createLocalId("portfolio"),
            title: "",
            category: "General",
            description: "",
            link: "",
            imageUrl: "",
            order: 0,
          },
        ]
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
      showToast({
        tone: "success",
        title: t("toast_portfolio_success_title"),
        message: t("toast_portfolio_success_msg"),
      });
    } catch (error) {
      logger.error("[Upload:portfolio] UI handler failed", error);
      updateItem(id, { imageUrl: previousImageUrl });
      showToast({
        tone: "error",
        title: t("toast_portfolio_error_title"),
        message: getUploadErrorMessage(error, "portfolio"),
      });
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
          .map((item, index) => ({
            ...item,
            link: normalizeUrl(item.link || ""),
            order: index,
          }))
      );
      onCancel();
    } finally {
      setSaving(false);
    }
  };

  return (
    <EditorChrome
      title={t("edit_profile_portfolio_title")}
      icon={Sparkles}
      saving={saving || Boolean(uploadingId)}
      onCancel={onCancel}
      onSave={save}
    >
      <div className="space-y-3">
        {drafts.map((item) => (
          <div key={item.id} className="rounded-[var(--radius-md)] border border-white/8 bg-white/[0.03] p-3">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-velora-text-muted">
                {t("edit_profile_project_label")}
              </span>
              <button
                type="button"
                onClick={() => setDrafts(drafts.filter((draft) => draft.id !== item.id))}
                className="text-velora-rose"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <label className="mb-3 flex aspect-[16/9] cursor-pointer items-center justify-center overflow-hidden rounded-[var(--radius-md)] border border-dashed border-velora-gold/25 bg-velora-gold/5">
              {item.imageUrl ? (
                <div className="relative h-full w-full">
                  <div
                    className="h-full w-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${item.imageUrl})` }}
                  />
                  {uploadingId === item.id && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/45">
                      <Loader2 size={16} className="animate-spin text-velora-gold" />
                      <span className="text-xs font-medium text-velora-gold">{uploadProgress}%</span>
                    </div>
                  )}
                </div>
              ) : (
                <span className="flex items-center gap-2 text-xs text-velora-gold">
                  {uploadingId === item.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Camera size={14} />
                  )}
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
              <input
                className={inputClass}
                value={item.title}
                onChange={(event) => updateItem(item.id, { title: event.target.value })}
                placeholder={t("edit_profile_project_title_placeholder")}
              />
              <input
                className={inputClass}
                value={item.category}
                onChange={(event) => updateItem(item.id, { category: event.target.value })}
                placeholder={t("edit_profile_project_category_placeholder")}
              />
              <textarea
                rows={2}
                className={textAreaClass}
                value={item.description || ""}
                onChange={(event) => updateItem(item.id, { description: event.target.value })}
                placeholder={t("field_description")}
              />
              <input
                className={inputClass}
                value={item.link || ""}
                onChange={(event) => updateItem(item.id, { link: event.target.value })}
                placeholder={t("edit_profile_project_link_placeholder")}
              />
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            setDrafts([
              ...drafts,
              {
                id: createLocalId("portfolio"),
                title: "",
                category: "General",
                description: "",
                link: "",
                imageUrl: "",
                order: drafts.length,
              },
            ])
          }
          className="flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-velora-gold/25 text-sm font-medium text-velora-gold"
        >
          <Plus size={15} />
          {t("edit_profile_project_add")}
        </button>
      </div>
    </EditorChrome>
  );
}
