"use client";

import { motion } from "framer-motion";
import {
  Eye,
  Nfc,
  QrCode,
  MessageCircle,
  TrendingUp,
  BarChart3,
  Inbox,
} from "lucide-react";
import { GlassCard } from "@/components/ui";
import { FadeUp, StaggerChildren, StaggerItem } from "../motion/animations";
import type { DailyStats } from "@/types";

const EMPTY_STATS: DailyStats = { views: 0, taps: 0, scans: 0, clicks: 0 };

/* ── Stats Grid — Real Firestore Data ── */
export function StatsGrid({
  stats = EMPTY_STATS,
  loading = false,
}: {
  stats?: DailyStats;
  loading?: boolean;
}) {

  const statCards = [
    {
      icon: Eye,
      value: stats.views,
      label: "Profile Views",
      color: "text-velora-blue",
      bg: "bg-velora-blue/10",
    },
    {
      icon: Nfc,
      value: stats.taps,
      label: "NFC Taps",
      color: "text-velora-gold",
      bg: "bg-velora-gold/10",
    },
    {
      icon: QrCode,
      value: stats.scans,
      label: "QR Scans",
      color: "text-velora-emerald",
      bg: "bg-velora-emerald/10",
    },
    {
      icon: MessageCircle,
      value: stats.clicks,
      label: "WhatsApp Clicks",
      color: "text-green-400",
      bg: "bg-green-500/10",
    },
  ];

  return (
    <div className="px-5 py-4">
      <StaggerChildren staggerDelay={0.1} delay={0.3} className="grid grid-cols-2 gap-3">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <StaggerItem key={i}>
              <GlassCard className="p-4" hover={false}>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center`}
                  >
                    <Icon size={18} className={stat.color} />
                  </div>
                </div>
                <div className="text-data text-xl text-velora-text font-semibold">
                  {loading ? "—" : stat.value.toLocaleString()}
                </div>
                <div className="text-caption mt-1">{stat.label}</div>
              </GlassCard>
            </StaggerItem>
          );
        })}
      </StaggerChildren>
    </div>
  );
}

/* ── Views Chart — Real data or empty state ── */
export function ViewsChart({
  stats = EMPTY_STATS,
  loading = false,
}: {
  stats?: DailyStats;
  loading?: boolean;
}) {
  const totalActivity = stats.views + stats.taps + stats.scans + stats.clicks;

  if (!loading && totalActivity === 0) {
    return (
      <FadeUp delay={0.7}>
        <div className="px-5 py-4">
          <GlassCard className="p-5" hover={false}>
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp size={16} className="text-velora-gold/60" />
              <h3 className="text-heading text-base text-velora-text">
                Weekly Activity
              </h3>
            </div>
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center mb-4">
                <Inbox size={22} className="text-velora-text-muted" />
              </div>
              <p className="text-xs text-velora-text-muted text-center max-w-[220px] leading-relaxed">
                Pas encore d&apos;activité. Partagez votre profil pour voir les statistiques.
              </p>
            </div>
          </GlassCard>
        </div>
      </FadeUp>
    );
  }

  // Show a summary of real activity when data exists
  return (
    <FadeUp delay={0.7}>
      <div className="px-5 py-4">
        <GlassCard className="p-5" hover={false}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-heading text-base text-velora-text">
                Activity Summary
              </h3>
              <p className="text-xs text-velora-text-muted mt-0.5">
                Today&apos;s engagement
              </p>
            </div>
          </div>

          {/* Summary row */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-center">
              <div className="text-data text-sm text-velora-text">{stats.views}</div>
              <div className="text-[9px] text-velora-text-muted mt-0.5 uppercase tracking-wider">
                Views
              </div>
            </div>
            <div className="text-center">
              <div className="text-data text-sm text-velora-text">{stats.taps}</div>
              <div className="text-[9px] text-velora-text-muted mt-0.5 uppercase tracking-wider">
                Taps
              </div>
            </div>
            <div className="text-center">
              <div className="text-data text-sm text-velora-text">{stats.scans}</div>
              <div className="text-[9px] text-velora-text-muted mt-0.5 uppercase tracking-wider">
                Scans
              </div>
            </div>
            <div className="text-center">
              <div className="text-data text-sm text-velora-text">{stats.clicks}</div>
              <div className="text-[9px] text-velora-text-muted mt-0.5 uppercase tracking-wider">
                Clicks
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </FadeUp>
  );
}

/* ── Engagement Breakdown — Real data or empty state ── */
export function EngagementBreakdown({
  stats = EMPTY_STATS,
  loading = false,
}: {
  stats?: DailyStats;
  loading?: boolean;
}) {
  const total = stats.views + stats.taps + stats.scans + stats.clicks;

  if (!loading && total === 0) {
    return null; // Don't show breakdown if no data
  }

  const sources = [
    { label: "Profile Views", count: stats.views, color: "bg-velora-gold" },
    { label: "QR Scans", count: stats.scans, color: "bg-velora-emerald" },
    { label: "NFC Taps", count: stats.taps, color: "bg-velora-blue" },
    { label: "Link Clicks", count: stats.clicks, color: "bg-green-400" },
  ].map(s => ({
    ...s,
    percentage: total > 0 ? Math.round((s.count / total) * 100) : 0,
  }));

  return (
    <FadeUp delay={1.0}>
      <div className="px-5 py-4">
        <GlassCard className="p-5" hover={false}>
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 size={16} className="text-velora-gold" />
            <h3 className="text-heading text-base text-velora-text">
              Traffic Sources
            </h3>
          </div>

          <div className="space-y-4">
            {sources.map((source, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-velora-text-secondary">
                    {source.label}
                  </span>
                  <span className="text-data text-xs text-velora-text">
                    {source.percentage}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${source.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${source.percentage}%` }}
                    transition={{
                      duration: 1,
                      delay: 1.2 + i * 0.15,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </FadeUp>
  );
}
