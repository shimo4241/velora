"use client";

import { motion } from "framer-motion";
import {
  Eye,
  Nfc,
  QrCode,
  MessageCircle,
  TrendingUp,
  ArrowUpRight,
  BarChart3,
} from "lucide-react";
import { GlassCard } from "../ui";
import { FadeUp, StaggerChildren, StaggerItem } from "../motion/animations";

/* ── Stats Grid ── */
export function StatsGrid() {
  const stats = [
    {
      icon: Eye,
      value: 1247,
      label: "Profile Views",
      trend: "+23%",
      color: "text-velora-blue",
      bg: "bg-velora-blue/10",
    },
    {
      icon: Nfc,
      value: 89,
      label: "NFC Taps",
      trend: "+12%",
      color: "text-velora-gold",
      bg: "bg-velora-gold/10",
    },
    {
      icon: QrCode,
      value: 156,
      label: "QR Scans",
      trend: "+34%",
      color: "text-velora-emerald",
      bg: "bg-velora-emerald/10",
    },
    {
      icon: MessageCircle,
      value: 423,
      label: "WhatsApp Clicks",
      trend: "+8%",
      color: "text-green-400",
      bg: "bg-green-500/10",
    },
  ];

  return (
    <div className="px-5 py-4">
      <StaggerChildren staggerDelay={0.1} delay={0.3} className="grid grid-cols-2 gap-3">
        {stats.map((stat, i) => {
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
                  <div className="flex items-center gap-0.5">
                    <ArrowUpRight size={12} className="text-velora-emerald" />
                    <span className="text-[10px] text-velora-emerald font-mono font-medium">
                      {stat.trend}
                    </span>
                  </div>
                </div>
                <div className="text-data text-xl text-velora-text font-semibold">
                  {stat.value.toLocaleString()}
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

/* ── Views Chart (Simplified visual) ── */
export function ViewsChart() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const values = [35, 55, 42, 78, 65, 90, 72];
  const maxValue = Math.max(...values);

  return (
    <FadeUp delay={0.7}>
      <div className="px-5 py-4">
        <GlassCard className="p-5" hover={false}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-heading text-base text-velora-text">
                Weekly Activity
              </h3>
              <p className="text-xs text-velora-text-muted mt-0.5">
                Profile engagement this week
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-velora-emerald/10 border border-velora-emerald/15">
              <TrendingUp size={12} className="text-velora-emerald" />
              <span className="text-[10px] text-velora-emerald font-mono font-semibold">
                +18%
              </span>
            </div>
          </div>

          {/* Bar chart */}
          <div className="flex items-end justify-between gap-2 h-32">
            {values.map((value, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <motion.div
                  className="w-full rounded-t-lg relative overflow-hidden"
                  style={{
                    background:
                      i === 5
                        ? "linear-gradient(to top, #C9A84C, #E8D48B)"
                        : "rgba(255,255,255,0.06)",
                  }}
                  initial={{ height: 0 }}
                  animate={{
                    height: `${(value / maxValue) * 100}%`,
                  }}
                  transition={{
                    duration: 0.8,
                    delay: 0.9 + i * 0.08,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  {/* Shimmer on highest bar */}
                  {i === 5 && (
                    <div className="absolute inset-0 animate-shimmer opacity-30" />
                  )}
                </motion.div>
                <span
                  className={`text-[9px] font-medium ${
                    i === 5
                      ? "text-velora-gold"
                      : "text-velora-text-muted"
                  }`}
                >
                  {days[i]}
                </span>
              </div>
            ))}
          </div>

          {/* Summary row */}
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/5">
            <div className="text-center">
              <div className="text-data text-sm text-velora-text">437</div>
              <div className="text-[9px] text-velora-text-muted mt-0.5 uppercase tracking-wider">
                Total Views
              </div>
            </div>
            <div className="text-center">
              <div className="text-data text-sm text-velora-text">62</div>
              <div className="text-[9px] text-velora-text-muted mt-0.5 uppercase tracking-wider">
                Avg/Day
              </div>
            </div>
            <div className="text-center">
              <div className="text-data text-sm text-velora-gold">90</div>
              <div className="text-[9px] text-velora-text-muted mt-0.5 uppercase tracking-wider">
                Peak Day
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </FadeUp>
  );
}

/* ── Engagement Breakdown ── */
export function EngagementBreakdown() {
  const sources = [
    { label: "Direct Link", percentage: 42, color: "bg-velora-gold" },
    { label: "QR Code", percentage: 28, color: "bg-velora-emerald" },
    { label: "NFC Tap", percentage: 18, color: "bg-velora-blue" },
    { label: "WhatsApp", percentage: 12, color: "bg-green-400" },
  ];

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
