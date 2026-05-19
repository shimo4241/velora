"use client";

import { GlassCard, GoldButton, GoldBadge } from "@/components/ui";
import { FadeUp } from "@/components/motion/animations";
import {
  StatsGrid,
  ViewsChart,
  EngagementBreakdown,
} from "@/components/analytics";
import { useTranslation } from "@/lib/i18n";
import { useProfile } from "@/hooks/useProfile";
import { Crown } from "lucide-react";

/* ═══════════════════════════════════════════════════
   VELORA — Insights Screen
   Performance analytics & networking intelligence
   ═══════════════════════════════════════════════════ */

export function AnalyticsScreen() {
  const { profile, isProfileReady } = useProfile();
  const { t } = useTranslation(profile?.locale || "fr");

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

      {/* Period toggle */}
      <div className="section">
        <FadeUp delay={0.1}>
          <div className="flex gap-1 p-1 rounded-[var(--radius-sm)] glass">
            {["7 Days", "30 Days", "90 Days"].map((period, i) => (
              <button
                key={i}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                  i === 0
                    ? "bg-velora-gold-dim text-velora-gold"
                    : "text-velora-text-muted"
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </FadeUp>
      </div>

      <StatsGrid />
      <ViewsChart />
      <EngagementBreakdown />

      {/* Premium CTA */}
      <div className="section py-6">
        <FadeUp delay={1.2}>
          <GlassCard className="p-5 text-center" gold>
            <Crown size={20} className="text-velora-gold mx-auto mb-3" />
            <h3 className="text-heading text-sm text-velora-text mb-1.5">
              Unlock Advanced Analytics
            </h3>
            <p className="text-xs text-velora-text-muted mb-4 max-w-[240px] mx-auto">
              Get detailed insights, visitor demographics, and networking intelligence
            </p>
            <GoldButton size="sm">
              <Crown size={12} />
              Upgrade to Premium
            </GoldButton>
          </GlassCard>
        </FadeUp>
      </div>
    </div>
  );
}
