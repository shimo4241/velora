"use client";

import { memo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Briefcase, MapPin, MessageSquare, Shield, Sparkles, Star, StickyNote, Users } from "lucide-react";
import { getDistanceLabel } from "@/utils/geolocation";
import { NetworkActions } from "./NetworkActions";
import type { VeloraConnection } from "@/types";

function initials(name?: string) {
  return (name || "V")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function badges(connection: VeloraConnection) {
  const profile = connection.profile;
  const result: string[] = [];
  if (profile.professionalMode === "dentist" || connection.connectionType === "Dentist") result.push("Dentiste Verifie");
  if (profile.professionalMode === "vip" || connection.connectionType === "VIP") result.push("VIP");
  if (profile.professionalMode === "business" || connection.connectionType === "Business") result.push("Business");
  if (profile.professionalMode === "creator") result.push("Createur");
  return result;
}

function relativeMeeting(value?: string) {
  if (!value) return "Rencontre recente";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Rencontre recente";
  const days = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  if (days < 7) return `Il y a ${days} jours`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export const NetworkContactCard = memo(function NetworkContactCard({
  connection,
  onToggleFavorite,
  onEdit,
  onChat,
}: {
  connection: VeloraConnection;
  onToggleFavorite: (connection: VeloraConnection) => void;
  onEdit: (connection: VeloraConnection) => void;
  onChat: (connection: VeloraConnection) => void;
}) {
  const router = useRouter();
  const profile = connection.profile;
  const distanceLabel =
    typeof connection.distance === "number" ? getDistanceLabel(connection.distance, profile.locale || "fr") : "—";
  const cardBadges = badges(connection);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="relative overflow-hidden rounded-[24px] border border-white/10 bg-velora-dark p-4 shadow-[0_8px_20px_rgba(0,0,0,0.22)]"
    >
      <div className="pointer-events-none absolute inset-x-8 -top-20 h-32 rounded-full bg-velora-gold/5 blur-xl" />
      <div className="relative flex items-start gap-3.5">
        <div
          onClick={() => {
            const username = connection.username || profile.username;
            const uid = connection.uid || profile.id;
            if (username) {
              router.push(`/u/${username}`);
            } else {
              router.push(`/p/${uid}`);
            }
          }}
          className="flex flex-1 items-start gap-3.5 cursor-pointer min-w-0 group"
        >
          <div className="relative shrink-0">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-velora-gold/20 bg-[radial-gradient(circle_at_50%_18%,var(--color-velora-gold-muted),rgba(255,255,255,0.04)_58%,rgba(0,0,0,0.35))] group-hover:border-velora-gold/50 transition-colors">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <span className="font-[family-name:var(--font-display)] text-lg font-semibold text-velora-gold">
                  {initials(profile.fullName)}
                </span>
              )}
            </div>
            {profile.isVerified && (
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-velora-gold/35 bg-black text-velora-gold">
                <Shield size={10} fill="currentColor" />
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-[family-name:var(--font-display)] text-base font-semibold text-velora-text group-hover:text-velora-gold transition-colors">
                {profile.fullName || "Contact Velora"}
              </h3>
              {profile.isPremium && <Star size={13} className="shrink-0 text-velora-gold" fill="currentColor" />}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-velora-text-secondary">
              <Briefcase size={12} className="text-velora-gold/70" />
              <span className="truncate">
                {profile.title || "Professional"}{profile.company ? ` · ${profile.company}` : ""}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em]">
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-velora-text-muted">
                <MapPin size={10} className="text-velora-gold" />
                {distanceLabel}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-velora-text-muted">
                <Sparkles size={10} className="text-velora-gold" />
                {relativeMeeting(connection.lastInteractionAt || connection.metAt)}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-velora-text-muted">
                <Users size={10} className="text-velora-gold" />
                {connection.mutualConnections != null ? `${connection.mutualConnections} mutuels` : "—"}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onToggleFavorite(connection)}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition ${
            connection.favorite || connection.isFavorite
              ? "border-velora-gold/35 bg-velora-gold/15 text-velora-gold"
              : "border-white/10 bg-white/[0.04] text-velora-text-muted"
          }`}
          aria-label="Favori"
        >
          <Star size={14} fill={connection.favorite || connection.isFavorite ? "currentColor" : "none"} />
        </button>
      </div>

      {(cardBadges.length > 0 || (connection.tags && connection.tags.length > 0)) && (
        <div className="relative mt-3 flex flex-wrap gap-1.5">
          {[...cardBadges, ...(connection.tags || [])].slice(0, 5).map((badge) => (
            <span key={badge} className="rounded-full border border-velora-gold/15 bg-velora-gold/10 px-2.5 py-1 text-[10px] font-semibold text-velora-gold">
              {badge}
            </span>
          ))}
        </div>
      )}

      {(connection.notes || connection.personalNote) && (
        <div className="relative mt-3 flex gap-2 rounded-2xl border border-white/8 bg-black/20 p-3 text-xs leading-5 text-velora-text-muted">
          <StickyNote size={13} className="mt-0.5 shrink-0 text-velora-gold" />
          <p>{connection.notes || connection.personalNote}</p>
        </div>
      )}

      <div className="relative mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-velora-text-muted">
          Force {connection.connectionStrength != null ? `${connection.connectionStrength}%` : "—"}
        </span>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => onChat(connection)} className="network-profile-btn flex items-center gap-1">
            <MessageSquare size={11} className="text-velora-gold" />
            Chat
          </button>
          <button type="button" onClick={() => onEdit(connection)} className="network-profile-btn">
            Notes
          </button>
          <NetworkActions profile={profile} />
        </div>
      </div>
    </motion.article>
  );
});
