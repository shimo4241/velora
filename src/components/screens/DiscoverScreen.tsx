"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  Ghost,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { FadeUp } from "@/components/motion/animations";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useProfile } from "@/hooks/useProfile";
import { RadarVisualization } from "@/components/discover/RadarVisualization";
import { IcebreakersCarousel } from "@/components/discover/IcebreakersCarousel";
import { LiveEventInsights } from "@/components/discover/LiveEventInsights";

/* ═══════════════════════════════════════════════════
   VELORA — Enhanced Découvrir Screen
   
   The premium discover experience featuring:
   - Interactive radar with profile avatars
   - AI-powered icebreaker carousel
   - Live event insights panel
   - Seamless gold + dark luxury aesthetic
   ═══════════════════════════════════════════════════ */

export function DiscoverScreen() {
  const { profile, isProfileReady } = useProfile();
  const geo = useGeolocation();
  const [query, setQuery] = useState("");

  if (!isProfileReady || !profile) return null;

  return (
    <div className="discover-screen min-h-screen overflow-hidden pb-28 text-velora-text">
      {/* Ambient gold glow at top */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 h-[420px] z-0"
        style={{
          background: `
            radial-gradient(circle at 50% -8%, rgba(196, 162, 101, 0.14), transparent 52%),
            radial-gradient(circle at 20% 10%, rgba(196, 162, 101, 0.06), transparent 36%),
            radial-gradient(circle at 80% 10%, rgba(196, 162, 101, 0.06), transparent 36%)
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
                  border: "1px solid rgba(196, 162, 101, 0.2)",
                  background: "rgba(196, 162, 101, 0.1)",
                  color: "var(--color-velora-gold)",
                }}
              >
                <Sparkles size={12} />
                Mon Réseau
              </div>
              <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold leading-none">
                Découvrir
              </h1>
            </div>

            {/* Visibility toggle */}
            <motion.button
              type="button"
              onClick={() => geo.toggleLocationSharing(!geo.isSharing)}
              className="flex items-center gap-2 rounded-2xl px-3 py-2 backdrop-blur-xl"
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
                {geo.isSharing ? "Visible" : "Hidden"}
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
            placeholder="Rechercher un profil, un événement..."
            className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.045] pl-11 pr-10 text-sm text-velora-text outline-none backdrop-blur-xl placeholder:text-velora-text-muted/60 focus:border-velora-gold/30"
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
            className="flex-1 flex items-center gap-2.5 rounded-2xl px-4 py-3 backdrop-blur-xl"
            style={{
              border: geo.isSharing
                ? "1px solid rgba(196, 162, 101, 0.25)"
                : "1px solid rgba(255, 255, 255, 0.08)",
              background: geo.isSharing
                ? "rgba(196, 162, 101, 0.1)"
                : "rgba(255, 255, 255, 0.03)",
            }}
            whileTap={{ scale: 0.97 }}
          >
            <Eye size={14} style={{ color: geo.isSharing ? "var(--color-velora-gold)" : "var(--color-velora-text-muted)" }} />
            <span
              className="text-xs font-semibold"
              style={{ color: geo.isSharing ? "var(--color-velora-gold)" : "var(--color-velora-text-secondary)" }}
            >
              {geo.isSharing ? "Nearby actif" : "Activer Nearby"}
            </span>
          </motion.button>

          <motion.button
            type="button"
            onClick={() => geo.toggleGhostMode(!geo.ghostMode)}
            className="flex items-center gap-2 rounded-2xl px-4 py-3 backdrop-blur-xl"
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
              Ghost
            </span>
          </motion.button>
        </div>
      </section>

      {/* ── Interactive Radar ── */}
      <section className="relative pt-6 pb-2 z-10">
        <RadarVisualization
          discoveredCount={6}
          isVisible={geo.isSharing}
        />
      </section>

      {/* ── AI-Powered Icebreakers ── */}
      <IcebreakersCarousel />

      {/* ── Live Event Insights ── */}
      <LiveEventInsights />
    </div>
  );
}
