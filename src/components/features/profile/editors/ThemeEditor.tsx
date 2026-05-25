"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { Palette } from "lucide-react";
import type { VeloraProfile, ProfileTheme, ProfileThemePalette } from "@/types";
import EditorChrome from "./EditorChrome";

export const themeMeta: Record<
  ProfileThemePalette,
  { labelKey: string; swatch: string; gradient: string }
> = {
  noir: {
    labelKey: "theme_noir",
    swatch: "bg-velora-card",
    gradient: "linear-gradient(160deg, var(--theme-bg) 0%, #141310 42%, var(--theme-bg) 100%)",
  },
  gold: {
    labelKey: "theme_gold",
    swatch: "bg-velora-gold",
    gradient:
      "linear-gradient(160deg, var(--theme-bg) 0%, #1a1510 34%, #12100b 68%, var(--theme-bg) 100%)",
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

interface ThemeEditorProps {
  profile: VeloraProfile;
  onCancel: () => void;
  onSave: (data: Partial<Omit<VeloraProfile, "id" | "username">>) => Promise<void>;
}

export default function ThemeEditor({ profile, onCancel, onSave }: ThemeEditorProps) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState<ProfileTheme>(
    profile.profileTheme || { palette: "gold" }
  );

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
    <EditorChrome
      title={t("edit_profile_theme_title")}
      icon={Palette}
      saving={saving}
      onCancel={onCancel}
      onSave={save}
    >
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
              <span
                className={`mb-3 block h-10 rounded-[var(--radius-sm)] ${themeMeta[palette].swatch}`}
              />
              <span className="text-sm font-medium text-velora-text">
                {t(themeMeta[palette].labelKey)}
              </span>
            </button>
          );
        })}
      </div>
    </EditorChrome>
  );
}
