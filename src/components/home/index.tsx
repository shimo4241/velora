"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GlassCard, ProgressRing } from "@/components/ui";
import { FadeUp, StaggerChildren, StaggerItem } from "@/components/motion/animations";
import { PROFESSIONAL_MODES } from "@/lib/constants";
import { useTranslation, getGreetingKey } from "@/lib/i18n";
import { useProfile } from "@/hooks/useProfile";
import { useConnections } from "@/hooks/useConnections";
import { useStats, useActivity } from "@/hooks/useStats";
import { useSharing } from "@/hooks/useSharing";
import type { AppTab, VeloraProfile } from "@/types";
import {
  ArrowRight,
  Check,
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
  Search,
  Wifi,
  Calendar,
  MapPin,
  Clock,
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
  const router = useRouter();
  const { profile, isProfileReady } = useProfile();
  const { connections } = useConnections();
  const { t } = useTranslation(profile?.locale || "fr");
  const recentConnection = connections?.[0];

  if (!isProfileReady || !profile) return null;

  return (
    <FadeUp delay={0.5}>
      <GlassCard className="p-5 border border-white/5 bg-velora-card/65 shadow-2xl relative overflow-hidden" hover={false}>
        <div className="absolute inset-0 bg-gradient-to-b from-velora-gold/5 to-transparent pointer-events-none opacity-40" />
        {/* Header */}
        <div className="flex items-center justify-between mb-5 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-velora-gold-dim border border-velora-gold/15 flex items-center justify-center">
              <Wifi size={14} className="text-velora-gold animate-pulse" />
            </div>
            <span className="text-heading text-sm text-velora-text font-[family-name:var(--font-display)] tracking-wide">
              Networking Pulse
            </span>
          </div>
        </div>

        {/* Weekly stats row */}
        <div className="grid grid-cols-3 gap-4 mb-5 relative z-10">
          {[
            { value: String(connections?.length || 0), label: "TOTAL", icon: Users },
            { value: String(connections?.filter((c) => !c.followUpSent)?.length || 0), label: "PENDING", icon: Clock },
            { value: String(connections?.filter((c) => c.followUpSent)?.length || 0), label: "DONE", icon: Check },
          ].map((stat, i) => {
            const StatIcon = stat.icon;
            return (
              <div
                key={i}
                className="flex flex-col items-center justify-center p-3.5 rounded-[var(--radius-md)] bg-velora-black/40 border border-white/5 shadow-inner"
              >
                <StatIcon size={16} className="text-velora-gold/75 mb-2" />
                <div className="text-data text-2xl font-extrabold text-gold-gradient">
                  {stat.value}
                </div>
                <div className="text-[9px] font-bold text-velora-text-secondary tracking-widest uppercase mt-1">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Latest connection */}
        {recentConnection && (
          <div
            onClick={() => {
              const username = recentConnection.username || recentConnection.profile?.username;
              const uid = recentConnection.uid || recentConnection.profile?.id;
              if (username) {
                router.push(`/u/${username}`);
              } else if (uid) {
                router.push(`/p/${uid}`);
              }
            }}
            className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-velora-black/35 border border-white/5 cursor-pointer hover:border-velora-gold/30 hover:bg-white/[0.03] transition-all group relative z-10"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden border border-velora-gold/20 bg-velora-gold-dim flex items-center justify-center flex-shrink-0 bg-black/40 relative">
              {recentConnection.profile?.avatarUrl || recentConnection.photoURL ? (
                <img
                  src={recentConnection.profile?.avatarUrl || recentConnection.photoURL}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <span className="text-xs font-semibold text-velora-gold">
                  {recentConnection.profile?.fullName
                    ?.split(" ")
                    ?.map((n) => n[0])
                    ?.join("") || "U"}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-velora-text truncate group-hover:text-velora-gold transition-colors">
                {recentConnection.profile?.fullName || "Unknown User"}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <MapPin size={9} className="text-velora-text-muted flex-shrink-0" />
                <span className="text-[10px] text-velora-text-muted truncate">
                  {recentConnection.contextLabel || "Rencontré récemment"}
                </span>
              </div>
            </div>
            <div className="text-[10px] font-bold text-velora-gold/80 flex-shrink-0 group-hover:text-velora-gold flex items-center gap-1">
              {t("follow_up")} <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        )}
      </GlassCard>
    </FadeUp>
  );
}

/* ── Upcoming Section — Coming Soon ── */
function UpcomingEvents() {
  return (
    <FadeUp delay={0.6}>
      <GlassCard className="p-5 text-center" hover={false}>
        <div className="flex items-center justify-center gap-2 mb-3">
          <Calendar size={14} className="text-velora-gold/60" />
          <span className="text-heading text-sm text-velora-text">
            Événements
          </span>
        </div>
        <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center mx-auto mb-3">
          <Clock size={20} className="text-velora-text-muted" />
        </div>
        <p className="text-xs text-velora-text-muted leading-relaxed max-w-[220px] mx-auto">
          Les événements de networking seront bientôt disponibles.
        </p>
        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-velora-gold-dim border border-velora-gold/15">
          <span className="text-[9px] text-velora-gold font-medium tracking-wider uppercase">
            Coming Soon
          </span>
        </div>
      </GlassCard>
    </FadeUp>
  );
}

/* ── Main Home Screen ── */
export function HomeScreen({ onTabChange }: { onTabChange?: (tab: AppTab) => void }) {
  const { profile, isProfileReady, updateProfile } = useProfile();
  const { stats } = useStats();
  const { activity } = useActivity();
  const { shareViaWhatsApp, copyProfileLink } = useSharing();
  const [selectedModeOverride, setSelectedModeOverride] = useState<VeloraProfile["professionalMode"] | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const { t } = useTranslation(profile?.locale || "fr");
  const greetingKey = getGreetingKey();
  const selectedMode = selectedModeOverride || profile?.professionalMode || "entrepreneur";

  // Professional mode change persists to Firestore
  const handleModeChange = useCallback((modeId: string) => {
    setSelectedModeOverride(modeId as NonNullable<VeloraProfile["professionalMode"]>);
    updateProfile({ professionalMode: modeId as NonNullable<VeloraProfile["professionalMode"]> });
  }, [updateProfile]);

  if (!isProfileReady || !profile) return null;

  const firstName = profile?.fullName?.split(" ")[0] || "VELORA";

  // Quick share handlers
  const handleQuickWhatsApp = () => shareViaWhatsApp(profile);
  const handleQuickNFC = () => onTabChange?.("share");
  const handleQuickQR = () => onTabChange?.("share");
  const handleQuickLink = async () => {
    await copyProfileLink(profile.username);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  // Calculate profile completion
  const fields = [profile?.fullName, profile?.title, profile?.company, profile?.bio, profile?.avatarUrl, profile?.whatsapp, profile?.instagram, profile?.location];
  const filled = fields.filter(Boolean).length;
  const completion = Math.round((filled / fields.length) * 100);

  return (
    <div className="min-h-screen luxury-background safe-bottom relative overflow-hidden">
      {/* Background ambient glow layers */}
      <div className="gold-ambient animate-breathe" />
      <div className="cinematic-overlay" />
      <div className="premium-vignette" />

      <div className="relative z-10">
        {/* Header with cultural greeting */}
        <div className="px-5 pt-14 pb-4">
          <FadeUp>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[20px] font-medium text-velora-text-secondary/80 font-[family-name:var(--font-display)]">
                  {t(greetingKey)},
                </div>
                <h1 className="text-display text-3xl font-extrabold text-gold-gradient tracking-wide mt-1">
                  {firstName}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => onTabChange?.("discover")}
                  className="w-10 h-10 rounded-[var(--radius-sm)] glass flex items-center justify-center border border-white/5"
                  aria-label="Search"
                >
                  <Search size={18} className="text-velora-text-secondary" />
                </motion.button>
              </div>
            </div>
          </FadeUp>
        </div>

        {/* Profile completion */}
        <div className="section">
          <FadeUp delay={0.1}>
            <motion.div whileTap={{ scale: 0.98 }} onClick={() => onTabChange?.("identity")}>
              <GlassCard className="p-5 border border-velora-gold/25 shadow-xl relative overflow-hidden" gold hover={true}>
                <div className="absolute inset-0 bg-gradient-to-r from-velora-gold/5 to-transparent pointer-events-none" />
                <div className="flex items-center gap-4 relative z-10">
                  <ProgressRing progress={completion} size={52} strokeWidth={3} />
                  <div className="flex-1">
                    <div className="text-sm font-bold text-velora-text font-[family-name:var(--font-display)] tracking-wide">
                      {t("profile_completion")} {completion}%
                    </div>
                    <div className="text-xs text-velora-text-muted mt-0.5 font-medium">
                      {completion < 100 ? "Complétez votre profil pour plus de visibilité" : "Profil complet ✓"}
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-velora-gold/60 shrink-0" />
                </div>
              </GlassCard>
            </motion.div>
          </FadeUp>
        </div>

        {/* Quick share */}
        <div className="section">
          <FadeUp delay={0.2}>
            <div className="section-header">
              <div className="text-heading text-base font-semibold text-velora-text tracking-wide font-[family-name:var(--font-display)]">
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
              const handlers = [handleQuickWhatsApp, handleQuickNFC, handleQuickQR, handleQuickLink];
              const labels = [action.label, action.label, action.label, linkCopied ? "Copié ✓" : action.label];
              return (
                <StaggerItem key={i}>
                  <motion.button
                    onClick={handlers[i]}
                    whileHover={{ scale: 1.06, y: -2 }}
                    whileTap={{ scale: 0.94 }}
                    className="w-full flex flex-col items-center justify-center gap-3 p-3 rounded-[var(--radius-card)] glass-strong glass-glow-sheen border border-white/5 shadow-lg relative group transition-all duration-300 hover:border-velora-gold/30 min-h-[96px]"
                  >
                    {/* Circle icon container with gold reflection */}
                    <div
                      className="w-11 h-11 rounded-full border border-velora-gold/25 bg-gradient-to-b from-velora-card to-velora-elevated flex items-center justify-center shadow-md relative overflow-hidden group-hover:border-velora-gold transition-colors duration-300"
                    >
                      <div className="absolute inset-0 bg-velora-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <Icon size={18} className="text-velora-gold relative z-10 transition-transform duration-300 group-hover:scale-115" />
                    </div>
                    <span className="text-[10px] font-bold text-velora-text-secondary relative z-10 group-hover:text-velora-gold transition-colors duration-300 whitespace-nowrap">
                      {labels[i]}
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
                  onClick={() => handleModeChange(mode.id)}
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
          <GlassCard className="p-5 border border-white/5 bg-velora-card/65 shadow-2xl relative overflow-hidden" hover={false}>
            <div className="absolute inset-0 bg-gradient-to-b from-velora-gold/5 to-transparent pointer-events-none opacity-40" />
            <div className="flex items-center gap-2.5 mb-4 relative z-10">
              <TrendingUp size={14} className="text-velora-emerald" />
              <span className="text-xs font-bold text-velora-text font-[family-name:var(--font-display)] uppercase tracking-wider">
                {t("todays_activity")}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 relative z-10">
              {[
                { value: stats.views, label: t("views") },
                { value: stats.taps, label: t("taps") },
                { value: stats.scans, label: t("scans") },
                { value: stats.clicks, label: t("clicks") },
              ].map((stat, i) => (
                <div key={i} className="text-center p-2 rounded-[var(--radius-md)] bg-velora-black/45 border border-white/5">
                  <div className="text-data text-xl font-extrabold text-gold-gradient">
                    {stat.value}
                  </div>
                  <div className="text-[9px] font-bold text-velora-text-secondary tracking-wide mt-1 uppercase">
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
    </div>
  );
}
