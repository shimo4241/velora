"use client";
import { logger } from "@/lib/logger";


import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  Ghost,
  Search,
  Sparkles,
  X,
  Globe,
} from "lucide-react";
import { FadeUp } from "@/components/motion/animations";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useProfile } from "@/hooks/useProfile";
import { RadarVisualization } from "@/components/discover/RadarVisualization";
import { IcebreakersCarousel } from "@/components/discover/IcebreakersCarousel";
import { onDiscoverUsersChange } from "@/lib/firestore";
import type { VeloraProfile } from "@/types";
import MesReseaux from "@/components/MesReseaux";
import { useTranslation } from "@/lib/i18n";
import { calculateHaversineDistance } from "@/lib/geolocation";
import { ProfessionalCard } from "@/components/network";

/* ═══════════════════════════════════════════════════
   VELORA — Enhanced Découvrir Screen
   
   The premium discover experience featuring:
   - Interactive radar with profile avatars (from live database)
   - AI-powered icebreaker carousel (from live database)
   - Seamless gold + dark luxury aesthetic
   ═══════════════════════════════════════════════════ */

export function DiscoverScreen() {
  const { profile, isProfileReady } = useProfile();
  const geo = useGeolocation();
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [discoveredUsers, setDiscoveredUsers] = useState<VeloraProfile[]>([]);
  const [loadingDiscover, setLoadingDiscover] = useState(true);

  useEffect(() => {
    if (!isProfileReady || !profile?.id) return;
    const unsub = onDiscoverUsersChange(
      profile.id,
      100, // Fetch more candidates so we have enough for both local and global networks
      (users) => {
        setDiscoveredUsers(users);
        setLoadingDiscover(false);
      },
      (err) => {
        logger.error("[DiscoverScreen:onDiscoverUsersChange] failed:", err);
        setLoadingDiscover(false);
      }
    );
    return () => unsub();
  }, [profile?.id, isProfileReady]);

  // Split discovered users into Nearby and Global suggestions
  const { nearbyUsers, globalUsers } = useMemo(() => {
    if (!profile) return { nearbyUsers: [], globalUsers: [] };
    
    const myCoarse = profile.location_geo_coarse;
    const isSharing = profile.locationSharing && !profile.ghostMode;

    const nearby: VeloraProfile[] = [];
    const global: VeloraProfile[] = [];

    discoveredUsers.forEach((u) => {
      // Security: Exclude self, ghosts, and invisible users
      if (u.id === profile.id || u.ghostMode === true || u.isVisible === false) {
        return;
      }

      if (!isSharing || !myCoarse || !u.location_geo_coarse) {
        global.push(u);
        return;
      }

      const dist = calculateHaversineDistance(
        myCoarse.lat,
        myCoarse.lng,
        u.location_geo_coarse.lat,
        u.location_geo_coarse.lng
      );

      // Truly local discovery threshold (2 km)
      if (dist < 2000) {
        let proximity: "close" | "medium" | "far" = "medium";
        if (dist < 100) proximity = "close";
        else if (dist > 500) proximity = "far";

        nearby.push({
          ...u,
          proximityZone: proximity,
        });
      } else {
        global.push(u);
      }
    });

    // Sort by compatibility priorities (Professional Mode alignment, then shared skills/interests)
    const sortByPriority = (a: VeloraProfile, b: VeloraProfile) => {
      const aMode = a.professionalMode === profile.professionalMode ? 1 : 0;
      const bMode = b.professionalMode === profile.professionalMode ? 1 : 0;
      if (aMode !== bMode) return bMode - aMode;

      const aOverlap = a.skills?.filter(s => profile.skills?.includes(s)).length || 0;
      const bOverlap = b.skills?.filter(s => profile.skills?.includes(s)).length || 0;
      if (aOverlap !== bOverlap) return bOverlap - aOverlap;

      return 0;
    };

    nearby.sort(sortByPriority);
    global.sort(sortByPriority);

    return { nearbyUsers: nearby, globalUsers: global };
  }, [discoveredUsers, profile]);

  if (!isProfileReady || !profile) return null;

  // Filter lists based on search query
  const filteredNearby = nearbyUsers.filter((u) => {
    const search = query.toLowerCase().trim();
    if (!search) return true;
    const name = u.fullName || "";
    const title = u.title || "";
    return name.toLowerCase().includes(search) || title.toLowerCase().includes(search);
  });

  const filteredGlobal = globalUsers.filter((u) => {
    const search = query.toLowerCase().trim();
    if (!search) return true;
    const name = u.fullName || "";
    const title = u.title || "";
    return name.toLowerCase().includes(search) || title.toLowerCase().includes(search);
  });

  return (
    <div className="discover-screen min-h-screen pb-28 text-velora-text">
      {/* Ambient gold glow at top */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 h-[420px] z-0"
        style={{
          background: `
            radial-gradient(circle at 50% -8%, color-mix(in srgb, var(--color-velora-gold) 14%, transparent), transparent 52%),
            radial-gradient(circle at 20% 10%, color-mix(in srgb, var(--color-velora-gold) 6%, transparent), transparent 36%),
            radial-gradient(circle at 80% 10%, color-mix(in srgb, var(--color-velora-gold) 6%, transparent), transparent 36%)
          `,
        }}
      />

      {/* ── Header ── */}
      <header className="relative px-5 pt-14 z-10">
        <FadeUp>
          <div className="flex items-end justify-between gap-4">
            <div>
              <div
                className="mb-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]"
                style={{
                  border: "1px solid color-mix(in srgb, var(--color-velora-gold) 20%, transparent)",
                  background: "color-mix(in srgb, var(--color-velora-gold) 10%, transparent)",
                  color: "var(--color-velora-gold)",
                }}
              >
                <Sparkles size={12} />
                {t("discover_my_network")}
              </div>
              <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold leading-none">
                {t("discover_title")}
              </h1>
            </div>

            {/* Visibility toggle */}
            <motion.button
              type="button"
              onClick={() => geo.toggleLocationSharing(!geo.isSharing)}
              className="flex items-center gap-2 rounded-2xl px-3 py-2"
              style={{
                border: geo.isSharing
                  ? "1px solid rgba(107, 191, 138, 0.3)"
                  : "1px solid rgba(255, 255, 255, 0.1)",
                background: geo.isSharing
                  ? "rgba(107, 191, 138, 0.1)"
                  : "rgba(255, 255, 255, 0.045)",
              }}
              whileTap={{ scale: 0.95 }}
            >
              {geo.isSharing ? (
                <Eye size={14} style={{ color: "var(--color-velora-emerald)" }} />
              ) : (
                <EyeOff size={14} style={{ color: "var(--color-velora-text-muted)" }} />
              )}
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                style={{
                  color: geo.isSharing
                    ? "var(--color-velora-emerald)"
                    : "var(--color-velora-text-muted)",
                }}
              >
                {geo.isSharing ? t("discover_visible") : t("discover_hidden")}
              </span>
            </motion.button>
          </div>
        </FadeUp>
      </header>

      {/* ── Search ── */}
      <section className="relative px-5 pt-4 z-10">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-velora-text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("discover_search_placeholder")}
            className="h-12 w-full rounded-2xl border border-white/10 bg-velora-dark pl-11 pr-10 text-sm text-velora-text outline-none placeholder:text-velora-text-muted/60 focus:border-velora-gold/30"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/8 text-velora-text-muted"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </section>

      {/* ── Proximity controls ── */}
      <section className="relative px-5 pt-4 z-10">
        <div className="flex gap-2">
          <motion.button
            type="button"
            onClick={() => geo.toggleLocationSharing(!geo.isSharing)}
            className="flex-1 flex items-center gap-2.5 rounded-2xl px-4 py-3"
            style={{
              border: geo.isSharing
                ? "1px solid color-mix(in srgb, var(--color-velora-gold) 25%, transparent)"
                : "1px solid rgba(255, 255, 255, 0.08)",
              background: geo.isSharing
                ? "color-mix(in srgb, var(--color-velora-gold) 10%, transparent)"
                : "rgba(255, 255, 255, 0.03)",
            }}
            whileTap={{ scale: 0.97 }}
          >
            <Eye size={14} style={{ color: geo.isSharing ? "var(--color-velora-gold)" : "var(--color-velora-text-muted)" }} />
            <span
              className="text-xs font-semibold"
              style={{ color: geo.isSharing ? "var(--color-velora-gold)" : "var(--color-velora-text-secondary)" }}
            >
              {geo.isSharing ? t("discover_nearby_active") : t("discover_nearby_enable")}
            </span>
          </motion.button>

          <motion.button
            type="button"
            onClick={() => geo.toggleGhostMode(!geo.ghostMode)}
            className="flex items-center gap-2 rounded-2xl px-4 py-3"
            style={{
              border: geo.ghostMode
                ? "1px solid rgba(167, 143, 202, 0.25)"
                : "1px solid rgba(255, 255, 255, 0.08)",
              background: geo.ghostMode
                ? "rgba(167, 143, 202, 0.08)"
                : "rgba(255, 255, 255, 0.03)",
            }}
            whileTap={{ scale: 0.97 }}
          >
            <Ghost size={14} style={{ color: geo.ghostMode ? "var(--color-velora-violet)" : "var(--color-velora-text-muted)" }} />
            <span
              className="text-xs font-semibold"
              style={{ color: geo.ghostMode ? "var(--color-velora-violet)" : "var(--color-velora-text-secondary)" }}
            >
              {t("discover_ghost")}
            </span>
          </motion.button>
        </div>
      </section>

      {/* ── Interactive Radar ── */}
      <section className="relative pt-6 pb-2 z-10">
        <RadarVisualization
          discoveredUsers={filteredNearby}
          isVisible={geo.isSharing}
        />
      </section>

      {/* ── AI-Powered Icebreakers ── */}
      <IcebreakersCarousel users={filteredNearby} loading={loadingDiscover} />

      {/* ── Global Connections / Signals ── */}
      {filteredGlobal.length > 0 && (
        <motion.section
          className="relative pt-6 px-5 z-10"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div
              className="flex items-center justify-center w-7 h-7 rounded-lg"
              style={{
                background: "color-mix(in srgb, var(--color-velora-gold) 12%, transparent)",
                border: "1px solid color-mix(in srgb, var(--color-velora-gold) 18%, transparent)",
              }}
            >
              <Globe size={13} style={{ color: "var(--color-velora-gold)" }} />
            </div>
            <h2
              className="text-sm font-semibold tracking-wide font-[family-name:var(--font-display)]"
              style={{ color: "var(--color-velora-text)" }}
            >
              Signals Internationaux
            </h2>
          </div>

          <div className="space-y-3">
            {filteredGlobal.slice(0, 5).map((u) => (
              <ProfessionalCard
                key={u.id}
                name={u.fullName}
                title={u.title}
                company={u.company || ""}
                distance={u.location || "Global Connection"}
                mutualConnections={0}
                isVerified={u.isVerified}
                isPremium={u.isPremium}
                username={u.username}
              />
            ))}
          </div>
        </motion.section>
      )}

      {/* ── Mon Réseau List ── */}
      <section className="relative z-10 mt-4 border-t border-white/5 pt-4">
        <MesReseaux />
      </section>
    </div>
  );
}
