"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { Sparkles } from "lucide-react";
import type { VeloraProfile } from "@/types";
import EditorChrome from "./EditorChrome";
import { Field, textAreaClass } from "./shared";

interface BioEditorProps {
  profile: VeloraProfile;
  onCancel: () => void;
  onSave: (data: Partial<Omit<VeloraProfile, "id" | "username">>) => Promise<void>;
}

export default function BioEditor({ profile, onCancel, onSave }: BioEditorProps) {
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
    <EditorChrome
      title={t("edit_profile_bio_title")}
      icon={Sparkles}
      saving={saving}
      onCancel={onCancel}
      onSave={save}
    >
      <div className="space-y-3">
        <Field label={t("field_bio_short")}>
          <textarea
            rows={7}
            className={textAreaClass}
            value={bio}
            onChange={(event) => setBio(event.target.value)}
          />
        </Field>
      </div>
    </EditorChrome>
  );
}
