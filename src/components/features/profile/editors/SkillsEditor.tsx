"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { Check, Plus, X } from "lucide-react";
import type { VeloraProfile } from "@/types";
import EditorChrome from "./EditorChrome";
import { inputClass } from "./shared";

interface SkillsEditorProps {
  profile: VeloraProfile;
  onCancel: () => void;
  onSave: (data: Partial<Omit<VeloraProfile, "id" | "username">>) => Promise<void>;
}

export default function SkillsEditor({ profile, onCancel, onSave }: SkillsEditorProps) {
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
    <EditorChrome
      title={t("edit_profile_skills_title_editor")}
      icon={Check}
      saving={saving}
      onCancel={onCancel}
      onSave={save}
    >
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
