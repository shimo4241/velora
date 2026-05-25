"use client";

import React, { useMemo } from "react";
import { useTranslation } from "@/lib/i18n";
import { calculateProfileCompletion, type ProfileCompletionItem } from "@/utils/profileCompletion";
import type { VeloraProfile, AppTab } from "@/types";
import { ChevronRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import type { ProfileEditorSection } from "./ProfileEditor";

interface ProfileCompletionCardProps {
  profile: VeloraProfile;
  onEditSection: (section: ProfileEditorSection) => void;
  onNavigate: (tab: AppTab) => void;
}

export function ProfileCompletionCard({
  profile,
  onEditSection,
  onNavigate,
}: ProfileCompletionCardProps) {
  const { t } = useTranslation(profile?.locale || "fr");
  const { score, items } = useMemo(() => calculateProfileCompletion(profile), [profile]);



  const incompleteItems = useMemo(() => {
    return items.filter((item: ProfileCompletionItem) => !item.complete);
  }, [items]);

  // SVG parameters for the circular progress
  const radius = 24;
  const strokeWidth = 4;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  if (score >= 100) {
    return null; // Don't show if profile is 100% complete
  }

  const handleItemClick = (item: ProfileCompletionItem) => {
    if (item.section === "share") {
      onNavigate("share");
    } else {
      onEditSection(item.section as ProfileEditorSection);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="identity-glass-card rounded-[26px] p-5 border border-[var(--theme-accent)]/15 relative overflow-hidden bg-white/[0.01] shadow-lg mb-6"
    >
      {/* Visual background sparkles accent */}
      <div className="absolute -top-6 -right-6 w-24 h-24 overflow-hidden pointer-events-none opacity-[0.03] select-none">
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M 50 0 L 64 36 L 100 50 L 64 64 L 50 100 L 36 64 L 0 50 L 36 36 Z" />
        </svg>
      </div>

      <div className="flex items-center gap-5">
        {/* Circular Progress Ring */}
        <div className="relative shrink-0 flex items-center justify-center w-16 h-16">
          <svg className="w-full h-full transform -rotate-95">
            {/* Background circle */}
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill="transparent"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth={strokeWidth}
            />
            {/* Foreground circle (progress) */}
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill="transparent"
              stroke={`url(#completion-grad-${profile.id})`}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
            {/* Definitions for gradient */}
            <defs>
              <linearGradient id={`completion-grad-${profile.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--theme-accent)" />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>
            </defs>
          </svg>
          {/* Centered Percentage */}
          <span className="absolute text-sm font-semibold text-velora-text">
            {score}%
          </span>
        </div>

        {/* Text descriptions */}
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-velora-text">
            <Sparkles size={12} className="text-[var(--theme-accent)]" />
            {t("completion_title_main")}
          </h3>
          <p className="mt-1 text-[11px] leading-relaxed text-velora-text-muted">
            {t("completion_subtitle_desc") || `${incompleteItems.length} étapes restantes pour un profil à fort impact.`}
          </p>
        </div>
      </div>

      {/* Suggested Checklist Items */}
      <div className="mt-4 border-t border-white/5 pt-3 space-y-2.5">
        {incompleteItems.slice(0, 3).map((item: ProfileCompletionItem) => (
          <button
            key={item.id}
            onClick={() => handleItemClick(item)}
            className="w-full flex items-center justify-between gap-3 text-left rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] px-3.5 py-2.5 transition-colors group"
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Radio Indicator (uncompleted) */}
              <span className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0 group-hover:border-[var(--theme-accent)]/40 transition-colors" />
              <span className="text-xs text-velora-text-secondary truncate">
                {t(item.labelKey)}
              </span>
            </div>
            
            <div className="flex items-center gap-1 shrink-0 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--theme-accent)] group-hover:text-white transition-colors">
              <span>{t("completion_cta")}</span>
              <ChevronRight size={10} className="transform group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
