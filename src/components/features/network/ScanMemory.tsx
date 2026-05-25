"use client";

import { motion } from "framer-motion";
import {
  Nfc,
  QrCode,
  MessageCircle,
  MapPin,
  Calendar,
  Users,
  Shield,
  Star,
  ChevronRight,
  StickyNote,
  CheckCircle,
  Clock,
} from "lucide-react";
import { GlassCard } from "@/components/ui";
import { useTranslation } from "@/lib/i18n";
import { useProfile } from "@/hooks/useProfile";
import type { VeloraConnection } from "@/types";

/* ═══════════════════════════════════════════════════
   VELORA — Scan Memory
   Connection cards with trust context
   ═══════════════════════════════════════════════════ */

const METHOD_CONFIG = {
  nfc: {
    icon: Nfc,
    label: "NFC Tap",
    color: "text-velora-gold",
    bg: "bg-velora-gold-dim",
  },
  qr: {
    icon: QrCode,
    label: "QR Scan",
    color: "text-velora-blue",
    bg: "bg-velora-blue/10",
  },
  whatsapp: {
    icon: MessageCircle,
    label: "WhatsApp",
    color: "text-velora-whatsapp",
    bg: "bg-velora-whatsapp/10",
  },
  link: {
    icon: ChevronRight,
    label: "Link",
    color: "text-velora-violet",
    bg: "bg-velora-violet/10",
  },
  nearby: {
    icon: MapPin,
    label: "Nearby",
    color: "text-velora-emerald",
    bg: "bg-velora-emerald/10",
  },
} as const;

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "Recently";
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

/* ── Connection Card ── */
export function ConnectionCard({
  connection,
}: {
  connection: VeloraConnection;
}) {
  const { profile } = useProfile();
  const { t } = useTranslation(profile?.locale || "fr");
  const method = METHOD_CONFIG[connection.method] || METHOD_CONFIG.nfc;
  const MethodIcon = method.icon;
  const connectionProfile = connection.profile;
  const initials = (connectionProfile?.fullName || "V")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <motion.div whileTap={{ scale: 0.98 }}>
      <GlassCard className="p-4">
        {/* Header — avatar + info + method */}
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-11 h-11 rounded-full bg-velora-gold-dim flex items-center justify-center">
              <span className="text-xs font-semibold text-velora-gold font-[family-name:var(--font-display)]">
                {initials}
              </span>
            </div>
            {Boolean(connectionProfile?.isVerified) && (
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-velora-black flex items-center justify-center border border-velora-gold/30">
                <Shield
                  size={8}
                  className="text-velora-gold"
                  fill="currentColor"
                />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold text-velora-text truncate font-[family-name:var(--font-display)]">
                {connectionProfile?.fullName || "Unknown User"}
              </h3>
              {Boolean(connectionProfile?.isPremium) && (
                <Star
                  size={10}
                  className="text-velora-gold flex-shrink-0"
                  fill="currentColor"
                />
              )}
            </div>
            <div className="text-xs text-velora-text-secondary mt-0.5 truncate">
              {connectionProfile?.title || "Professional"} · {connectionProfile?.company || "Independent"}
            </div>
          </div>

          {/* Method badge */}
          <div
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${method.bg} flex-shrink-0`}
          >
            <MethodIcon size={11} className={method.color} />
            <span className={`text-[9px] font-medium ${method.color}`}>
              {method.label}
            </span>
          </div>
        </div>

        {/* Context row */}
        <div className="flex items-center flex-wrap gap-x-3 gap-y-1.5 mt-3 pt-3 border-t border-velora-border/30">
          {/* Location */}
          <div className="flex items-center gap-1">
            <MapPin size={10} className="text-velora-text-muted" />
            <span className="text-[10px] text-velora-text-muted">
              {connection.contextLabel}
            </span>
          </div>

          {/* Date */}
          <div className="flex items-center gap-1">
            <Calendar size={10} className="text-velora-text-muted" />
            <span className="text-[10px] text-velora-text-muted">
              {formatRelativeDate(connection.metAt)}
            </span>
          </div>

          {/* Follow-up status */}
          <div className="flex items-center gap-1">
            {connection.followUpSent ? (
              <>
                <CheckCircle size={10} className="text-velora-emerald" />
                <span className="text-[10px] text-velora-emerald">
                  {t("follow_up")} ✓
                </span>
              </>
            ) : (
              <>
                <Clock size={10} className="text-velora-rose" />
                <span className="text-[10px] text-velora-rose">
                  {t("follow_up")}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Introduced by */}
        {connection.introducedBy && (
          <div className="flex items-center gap-1.5 mt-2">
            <Users size={10} className="text-velora-gold/50" />
            <span className="text-[10px] text-velora-text-muted italic">
              {t("introduced_by")} {connection.introducedBy}
            </span>
          </div>
        )}

        {/* Personal note */}
        {connection.personalNote && (
          <div className="flex items-start gap-1.5 mt-2 p-2 rounded-md bg-velora-surface/30">
            <StickyNote size={10} className="text-velora-gold/40 mt-0.5 flex-shrink-0" />
            <span className="text-[10px] text-velora-text-muted leading-relaxed">
              {connection.personalNote}
            </span>
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}
