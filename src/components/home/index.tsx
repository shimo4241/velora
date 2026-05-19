"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { GlassCard, GoldButton, ProgressRing } from "@/components/ui";
import { FadeUp, StaggerChildren, StaggerItem } from "@/components/motion/animations";
import { PROFESSIONAL_MODES, MOTION } from "@/lib/constants";
import { useTranslation, getGreetingKey } from "@/lib/i18n";
import { useProfile } from "@/hooks/useProfile";
import { useConnections } from "@/hooks/useConnections";
import { useStats, useActivity } from "@/hooks/useStats";
import {
  ChevronRight,
  Nfc,
  QrCode,
  Link2,
  MessageCircle,
  Eye,
  Users,
  Zap,
  Building2,
  Palette,
  Music,
  Gem,
  TrendingUp,
  Bell,
  Search,
  ArrowUpRight,
  Wifi,
  Calendar,
  MapPin,
} from "lucide-react";

/* ═══════════════════════════════════════════════════
   VELORA — Home Dashboard
   Cultural greeting · Quick share · Networking pulse
   ═══════════════════════════════════════════════════ */

const MODE_ICONS: Record<string, typeof Zap> = {
  entrepreneur: Zap,
  corporate: Building2,
  creative: Palette,
  nightlife: Music,
  luxury: Gem,
};

const ACTIVITY_ICONS: Record<string, typeof Eye> = {
  eye: Eye,
  nfc: Nfc,
  qr: QrCode,
  whatsapp: MessageCircle,
  users: Users,
};

/* WhatsApp is promoted to first position — primary sharing method in MENA */
const quickActions = [
  {
    icon: MessageCircle,
    label: "WhatsApp",
    color: "text-velora-whatsapp",
    bg: "bg-velora-whatsapp/10",
    highlight: true,
  },
  {
    icon: Nfc,
    label: "NFC Tap",
    color: "text-velora-gold",
    bg: "bg-velora-gold-dim",
    highlight: false,
  },
  {
    icon: QrCode,
    label: "QR Code",
    color: "text-velora-blue",
    bg: "bg-velora-blue/10",
    highlight: false,
  },
  {
    icon: Link2,
    label: "Link",
    color: "text-velora-violet",
    bg: "bg-velora-violet/10",
    highlight: false,
  },
];

/* ── Networking Pulse Card ── */
function NetworkingPulse() {
  const { profile, isProfileReady } = useProfile();
  const { connections } = useConnections();
  const { t } = useTranslation(profile?.locale || "fr");
  const recentConnection = connections?.[0];

  if (!isProfileReady || !profile) return null;

  return (
    <FadeUp delay={0.5}>
      <GlassCard className="p-4" hover={false}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-velora-gold-dim flex items-center justify-center">
              <Wifi size={14} className="text-velora-gold" />
            </div>
            <span className="text-heading text-sm text-velora-text">
              Networking Pulse
            </span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-velora-emerald/10">
            <ArrowUpRight size={10} className="text-velora-emerald" />
            <span className="text-[10px] text-velora-emerald font-mono font-medium">
              +{connections?.length > 0 ? "18" : "0"}%
            </span>
          </div>
        </div>

        {/* Weekly stats row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { value: String(connections?.length || 0), label: "This week", sub: "connections" },
            { value: "0", label: "This month", sub: "interactions" },
            { value: String(connections?.filter((c) => !c.followUpSent)?.length || 0), label: "Pending", sub: "follow-ups" },
          ].map((stat, i) => (
            <div
              key={i}
              className="text-center py-2 rounded-[var(--radius-sm)] bg-velora-surface/50"
            >
              <div className="text-data text-lg text-velora-text font-semibold">
                {stat.value}
              </div>
              <div className="text-[8px] text-velora-text-muted uppercase tracking-wider mt-0.5">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Latest connection */}
        {recentConnection && (
          <div className="flex items-center gap-3 p-2.5 rounded-[var(--radius-sm)] bg-velora-surface/30 border border-velora-border/50">
            <div className="w-9 h-9 rounded-full bg-velora-gold-dim flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-velora-gold">
                {recentConnection.profile?.fullName
                  ?.split(" ")
                  ?.map((n) => n[0])
                  ?.join("") || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-velora-text truncate">
                {recentConnection.profile?.fullName || "Unknown User"}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <MapPin size={9} className="text-velora-text-muted flex-shrink-0" />
                <span className="text-[10px] text-velora-text-muted truncate">
                  {recentConnection.contextLabel}
                </span>
              </div>
            </div>
            <div className="text-[10px] text-velora-text-muted flex-shrink-0">
              {t("follow_up")}
            </div>
          </div>
        )}
      </GlassCard>
    </FadeUp>
  );
}

/* ── Upcoming Section ── */
function UpcomingEvents() {
  return (
    <FadeUp delay={0.6}>
      <GlassCard className="p-4" hover={false}>
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={14} className="text-velora-gold" />
          <span className="text-heading text-sm text-velora-text">
            Upcoming
          </span>
        </div>

        <div className="space-y-2.5">
          {[
            {
              name: "Hive Networking Café",
              date: "Tomorrow · 18h",
              attendees: "23 professionals",
              location: "Casablanca",
            },
            {
              name: "GITEX Africa Side Event",
              date: "May 24 · 10h",
              attendees: "127 professionals",
              location: "Marrakech",
            },
          ].map((event, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-3 p-2.5 rounded-[var(--radius-sm)] bg-velora-surface/30"
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-velora-gold-dim flex items-center justify-center flex-shrink-0">
                <Calendar size={16} className="text-velora-gold/70" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-velora-text truncate">
                  {event.name}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-velora-gold">
                    {event.date}
                  </span>
                  <span className="text-[10px] text-velora-text-muted">
                    · {event.attendees}
                  </span>
                </div>
              </div>
              <ChevronRight size={14} className="text-velora-text-muted/40 flex-shrink-0" />
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </FadeUp>
  );
}

/* ── Main Home Screen ── */
export function HomeScreen() {
  const { profile, isProfileReady } = useProfile();
  const { stats } = useStats();
  const { activity } = useActivity();
  const [selectedMode, setSelectedMode] = useState(profile?.professionalMode || "entrepreneur");
  const { t } = useTranslation(profile?.locale || "fr");
  const greetingKey = getGreetingKey();

  if (!isProfileReady || !profile) return null;

  const firstName = profile?.fullName?.split(" ")[0] || "VELORA";

  // Calculate profile completion
  const fields = [profile?.fullName, profile?.title, profile?.company, profile?.bio, profile?.avatarUrl, profile?.whatsapp, profile?.instagram, profile?.location];
  const filled = fields.filter(Boolean).length;
  const completion = Math.round((filled / fields.length) * 100);

  return (
    <div className="min-h-screen bg-velora-black safe-bottom">
      {/* Header with cultural greeting */}
      <div className="px-5 pt-14 pb-4">
        <FadeUp>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-caption text-velora-gold mb-1">
                {t(greetingKey)}
              </div>
              <h1 className="text-display text-2xl text-velora-text">
                {firstName}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.92 }}
                className="w-10 h-10 rounded-[var(--radius-sm)] glass flex items-center justify-center"
                aria-label="Search"
              >
                <Search size={18} className="text-velora-text-secondary" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.92 }}
                className="w-10 h-10 rounded-[var(--radius-sm)] glass flex items-center justify-center relative"
                aria-label="Notifications"
              >
                <Bell size={18} className="text-velora-text-secondary" />
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-velora-rose" />
              </motion.button>
            </div>
          </div>
        </FadeUp>
      </div>

      {/* Profile completion */}
      <div className="section">
        <FadeUp delay={0.1}>
          <GlassCard className="p-4" gold>
            <div className="flex items-center gap-4">
              <ProgressRing progress={completion} size={52} strokeWidth={2.5} />
              <div className="flex-1">
                <div className="text-sm font-semibold text-velora-text font-[family-name:var(--font-display)]">
                  {t("profile_completion")} {completion}%
                </div>
                <div className="text-xs text-velora-text-muted mt-0.5">
                  {completion < 100 ? "Complétez votre profil pour plus de visibilité" : "Profil complet ✓"}
                </div>
              </div>
              <ChevronRight size={16} className="text-velora-gold/40" />
            </div>
          </GlassCard>
        </FadeUp>
      </div>

      {/* Quick share — WhatsApp hero */}
      <div className="section">
        <FadeUp delay={0.2}>
          <div className="section-header">
            <div className="text-heading text-base text-velora-text">
              {t("quick_share")}
            </div>
          </div>
        </FadeUp>

        <StaggerChildren
          staggerDelay={0.06}
          delay={0.25}
          className="grid grid-cols-4 gap-3"
        >
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <StaggerItem key={i}>
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  className={`w-full flex flex-col items-center gap-2 p-3 rounded-[var(--radius-card)] ${
                    action.highlight
                      ? "glass-gold border-velora-whatsapp/15"
                      : "glass"
                  }`}
                >
                  <div
                    className={`w-11 h-11 rounded-[var(--radius-sm)] ${action.bg} flex items-center justify-center`}
                  >
                    <Icon size={20} className={action.color} />
                  </div>
                  <span
                    className={`text-[10px] font-medium ${
                      action.highlight
                        ? "text-velora-whatsapp"
                        : "text-velora-text-secondary"
                    }`}
                  >
                    {action.label}
                  </span>
                </motion.button>
              </StaggerItem>
            );
          })}
        </StaggerChildren>
      </div>

      {/* Professional modes */}
      <div className="section">
        <FadeUp delay={0.35}>
          <div className="section-header">
            <div className="text-heading text-base text-velora-text">
              {t("professional_mode")}
            </div>
          </div>
        </FadeUp>

        <FadeUp delay={0.4}>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {PROFESSIONAL_MODES.map((mode) => {
              const Icon = MODE_ICONS[mode.id] || Zap;
              const isActive = selectedMode === mode.id;
              return (
                <motion.button
                  key={mode.id}
                  onClick={() => setSelectedMode(mode.id)}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    flex-shrink-0 flex items-center gap-2 px-4 py-2.5
                    rounded-full text-xs font-medium transition-all duration-300
                    ${
                      isActive
                        ? "bg-velora-gold-dim text-velora-gold border border-velora-gold/25"
                        : "glass text-velora-text-muted"
                    }
                  `}
                >
                  <Icon size={14} />
                  {mode.labelKey}
                </motion.button>
              );
            })}
          </div>
        </FadeUp>
      </div>

      {/* Networking Pulse — weekly summary */}
      <div className="section">
        <NetworkingPulse />
      </div>

      {/* Today's stats mini */}
      <div className="section">
        <FadeUp delay={0.55}>
          <GlassCard className="p-4" hover={false}>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={14} className="text-velora-emerald" />
              <span className="text-xs font-semibold text-velora-text font-[family-name:var(--font-display)]">
                {t("todays_activity")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              {[
                { value: stats.views, label: t("views") },
                { value: stats.taps, label: t("taps") },
                { value: stats.scans, label: t("scans") },
                { value: stats.clicks, label: t("clicks") },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-data text-lg text-velora-text font-semibold">
                    {stat.value}
                  </div>
                  <div className="text-[9px] text-velora-text-muted uppercase tracking-wider mt-0.5">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </FadeUp>
      </div>

      {/* Upcoming events */}
      <div className="section">
        <UpcomingEvents />
      </div>

      {/* Recent activity */}
      <div className="section">
        <FadeUp delay={0.7}>
          <div className="section-header">
            <div className="text-heading text-base text-velora-text">
              {t("recent_activity")}
            </div>
          </div>
        </FadeUp>

        <StaggerChildren staggerDelay={0.06} delay={0.75} className="space-y-2">
          {activity?.length > 0 ? (
            activity.map((activityItem) => {
              const Icon = ACTIVITY_ICONS[activityItem.icon] || Eye;
              return (
                <StaggerItem key={activityItem.id}>
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)] glass">
                    <div className="w-8 h-8 rounded-lg bg-velora-gold-dim flex items-center justify-center flex-shrink-0">
                      <Icon size={14} className="text-velora-gold/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-velora-text-secondary truncate">
                        {activityItem.text}
                      </div>
                    </div>
                    <span className="text-[10px] text-velora-text-muted flex-shrink-0">
                      {activityItem.time}
                    </span>
                  </div>
                </StaggerItem>
              );
            })
          ) : (
            <StaggerItem>
              <div className="text-center py-6 text-xs text-velora-text-muted">
                Partagez votre profil pour voir l&apos;activité ici
              </div>
            </StaggerItem>
          )}
        </StaggerChildren>
      </div>
    </div>
  );
}
