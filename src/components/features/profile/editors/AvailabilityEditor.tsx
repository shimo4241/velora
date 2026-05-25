"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { Check } from "lucide-react";
import type { VeloraProfile, AvailabilityStatus } from "@/types";
import EditorChrome from "./EditorChrome";

interface AvailabilityEditorProps {
  profile: VeloraProfile;
  onCancel: () => void;
  onSave: (data: Partial<Omit<VeloraProfile, "id" | "username">>) => Promise<void>;
}

export default function AvailabilityEditor({
  profile,
  onCancel,
  onSave,
}: AvailabilityEditorProps) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<AvailabilityStatus>(
    profile.availabilityStatus || "available"
  );

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
    <EditorChrome
      title={t("edit_profile_availability_title")}
      icon={Check}
      saving={saving}
      onCancel={onCancel}
      onSave={save}
    >
      <div className="space-y-2">
        {[
          {
            key: "available",
            labelKey: "availability_available",
            descKey: "availability_available_desc",
          },
          {
            key: "busy",
            labelKey: "availability_selective",
            descKey: "availability_selective_desc",
          },
          {
            key: "offline",
            labelKey: "availability_unavailable",
            descKey: "availability_unavailable_desc",
          },
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
