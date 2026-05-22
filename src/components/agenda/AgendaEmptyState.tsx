"use client";

import React from "react";
import { Calendar } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface AgendaEmptyStateProps {
  className?: string;
}

export const AgendaEmptyState: React.FC<AgendaEmptyStateProps> = ({ className = "" }) => {
  const { t } = useTranslation();

  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-md max-w-sm mx-auto ${className}`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-velora-gold/20 bg-velora-gold/5 text-velora-gold mb-4 shadow-[0_8px_32px_rgba(196,162,101,0.05)]">
        <Calendar className="w-6 h-6" />
      </div>
      <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-velora-text mb-2">
        {t("event_empty_title")}
      </h3>
      <p className="text-sm leading-6 text-velora-text-muted">
        {t("event_empty_desc")}
      </p>
    </div>
  );
};
