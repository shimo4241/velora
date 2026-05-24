"use client";

import { useState } from "react";
import { GlassCard, GoldBadge } from "@/components/ui";
import { FadeUp } from "@/components/motion/animations";
import {
  StatsGrid,
  ViewsChart,
  EngagementBreakdown,
} from "@/components/analytics";
import { useTranslation } from "@/lib/i18n";
import { useProfile } from "@/hooks/useProfile";
import { useStats } from "@/hooks/useStats";
import { Crown } from "lucide-react";

/* ═══════════════════════════════════════════════════
   VELORA — Insights Screen
   Performance analytics & networking intelligence
   ═══════════════════════════════════════════════════ */

export function AnalyticsScreen() {
  const { profile, isProfileReady } = useProfile();
  const { stats, loading: statsLoading } = useStats();
  const { t } = useTranslation(profile?.locale || "fr");
  const [activePeriod, setActivePeriod] = useState(0);

  if (!isProfileReady || !profile) return null;

  return (
    <div className="min-h-screen bg-velora-black safe-bottom">
      {/* Header */}
      <div className="px-5 pt-14 pb-4">
        <FadeUp>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-caption text-velora-gold mb-1">
                {t("performance")}
              </div>
              <h1 className="text-display text-2xl text-velora-text">
                {t("nav_insights")}
              </h1>
            </div>
            <GoldBadge variant="premium">
              <Crown size={10} />
              {t("premium")}
            </GoldBadge>
          </div>
        </FadeUp>
      </div>

      {/* Period toggle — visual only, 7 Days active */}
      <div className="section">
        <FadeUp delay={0.1}>
          <div className="flex gap-1 p-1 rounded-[var(--radius-sm)] glass">
            {["analytics_period_7d", "analytics_period_30d", "analytics_period_90d"].map((key, i) => (
              <button
                key={i}
                onClick={() => setActivePeriod(i)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                  activePeriod === i
                    ? "bg-velora-gold-dim text-velora-gold"
                    : "text-velora-text-muted"
                }`}
              >
                {t(key)}
                {i > 0 && (
                  <span className="ml-1 text-[8px] opacity-50">{t("soon")}</span>
                )}
              </button>
            ))}
          </div>
        </FadeUp>
      </div>

      <StatsGrid stats={stats} loading={statsLoading} />
      <ViewsChart stats={stats} loading={statsLoading} />
      <EngagementBreakdown stats={stats} loading={statsLoading} />

      {/* Premium CTA — disabled until premium system exists */}
      <div className="section py-6">
        <FadeUp delay={1.2}>
          <GlassCard className="p-5 text-center opacity-60" gold>
            <Crown size={20} className="text-velora-gold mx-auto mb-3" />
            <h3 className="text-heading text-sm text-velora-text mb-1.5">
              {t("analytics_advanced")}
            </h3>
            <p className="text-xs text-velora-text-muted mb-4 max-w-[240px] mx-auto">
              {t("analytics_advanced_desc")}
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-velora-gold-dim border border-velora-gold/15">
              <span className="text-[9px] text-velora-gold font-medium tracking-wider uppercase">
                {t("analytics_coming_soon")}
              </span>
            </div>
          </GlassCard>
        </FadeUp>
      </div>
    </div>
  );
}
