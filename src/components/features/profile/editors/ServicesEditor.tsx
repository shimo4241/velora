"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { Briefcase, Trash2, Plus } from "lucide-react";
import type { VeloraProfile, ProfileService } from "@/types";
import EditorChrome from "./EditorChrome";
import { createLocalId, inputClass, textAreaClass } from "./shared";

interface ServicesEditorProps {
  profile: VeloraProfile;
  onCancel: () => void;
  onSave: (data: Partial<Omit<VeloraProfile, "id" | "username">>) => Promise<void>;
}

export default function ServicesEditor({ profile, onCancel, onSave }: ServicesEditorProps) {
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
    <EditorChrome
      title={t("edit_profile_services_title")}
      icon={Briefcase}
      saving={saving}
      onCancel={onCancel}
      onSave={save}
    >
      <div className="space-y-3">
        {services.map((service) => (
          <div key={service.id} className="rounded-[var(--radius-md)] border border-white/8 bg-white/[0.03] p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-velora-text-muted">
                {t("edit_profile_service_label")}
              </span>
              <button
                type="button"
                onClick={() => setServices(services.filter((item) => item.id !== service.id))}
                className="text-velora-rose"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className="space-y-3">
              <input
                className={inputClass}
                value={service.title}
                onChange={(event) => updateService(service.id, { title: event.target.value })}
                placeholder={t("edit_profile_service_title_placeholder")}
              />
              <textarea
                rows={2}
                className={textAreaClass}
                value={service.description || ""}
                onChange={(event) => updateService(service.id, { description: event.target.value })}
                placeholder={t("edit_profile_service_desc_placeholder")}
              />
              <input
                className={inputClass}
                value={service.price || ""}
                onChange={(event) => updateService(service.id, { price: event.target.value })}
                placeholder={t("edit_profile_service_price_placeholder")}
              />
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            setServices([
              ...services,
              { id: createLocalId("service"), title: "", description: "", price: "" },
            ])
          }
          className="flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-velora-gold/25 text-sm font-medium text-velora-gold"
        >
          <Plus size={15} />
          {t("edit_profile_service_add")}
        </button>
      </div>
    </EditorChrome>
  );
}
