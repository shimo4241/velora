"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { Briefcase, Trash2, Plus } from "lucide-react";
import type { ExperienceEntry } from "@/types";
import EditorChrome from "./EditorChrome";
import { createLocalId, inputClass, textAreaClass } from "./shared";

interface ExperienceEditorProps {
  items: ExperienceEntry[];
  onCancel: () => void;
  onSave: (items: ExperienceEntry[]) => Promise<void>;
}

export default function ExperienceEditor({ items, onCancel, onSave }: ExperienceEditorProps) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [drafts, setDrafts] = useState<ExperienceEntry[]>(
    items.length
      ? items
      : [
          {
            id: createLocalId("experience"),
            company: "",
            role: "",
            description: "",
            startYear: new Date().getFullYear(),
            endYear: undefined,
            isCurrent: true,
            order: 0,
          },
        ]
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
    <EditorChrome
      title={t("edit_profile_experience_title")}
      icon={Briefcase}
      saving={saving}
      onCancel={onCancel}
      onSave={save}
    >
      <div className="space-y-3">
        {drafts.map((item) => (
          <div key={item.id} className="rounded-[var(--radius-md)] border border-white/8 bg-white/[0.03] p-3">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-velora-text-muted">
                {t("edit_profile_experience_label")}
              </span>
              <button
                type="button"
                onClick={() => setDrafts(drafts.filter((draft) => draft.id !== item.id))}
                className="text-velora-rose"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className="space-y-3">
              <input
                className={inputClass}
                value={item.role}
                onChange={(event) => updateItem(item.id, { role: event.target.value })}
                placeholder={t("edit_profile_experience_role_placeholder")}
              />
              <input
                className={inputClass}
                value={item.company}
                onChange={(event) => updateItem(item.id, { company: event.target.value })}
                placeholder={t("edit_profile_experience_company_placeholder")}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  className={inputClass}
                  type="number"
                  value={item.startYear}
                  onChange={(event) =>
                    updateItem(item.id, { startYear: Number(event.target.value) })
                  }
                  placeholder={t("edit_profile_experience_start_placeholder")}
                />
                <input
                  className={inputClass}
                  type="number"
                  value={item.endYear || ""}
                  disabled={item.isCurrent}
                  onChange={(event) =>
                    updateItem(item.id, {
                      endYear: event.target.value ? Number(event.target.value) : undefined,
                    })
                  }
                  placeholder={t("edit_profile_experience_end_placeholder")}
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-velora-text-secondary">
                <input
                  type="checkbox"
                  checked={item.isCurrent}
                  onChange={(event) =>
                    updateItem(item.id, {
                      isCurrent: event.target.checked,
                      endYear: event.target.checked ? undefined : item.endYear,
                    })
                  }
                />
                {t("edit_profile_experience_current")}
              </label>
              <textarea
                rows={3}
                className={textAreaClass}
                value={item.description || ""}
                onChange={(event) => updateItem(item.id, { description: event.target.value })}
                placeholder={t("field_description")}
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
                id: createLocalId("experience"),
                company: "",
                role: "",
                description: "",
                startYear: new Date().getFullYear(),
                endYear: undefined,
                isCurrent: true,
                order: drafts.length,
              },
            ])
          }
          className="flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-velora-gold/25 text-sm font-medium text-velora-gold"
        >
          <Plus size={15} />
          {t("edit_profile_experience_add")}
        </button>
      </div>
    </EditorChrome>
  );
}
