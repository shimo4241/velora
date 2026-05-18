"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Divider } from "@/components/ui";
import { FadeUp, StaggerChildren, StaggerItem } from "@/components/motion/animations";
import { RadarDiscovery, NearbyList } from "@/components/network";
import { ConnectionCard } from "@/components/network/ScanMemory";
import { useTranslation } from "@/lib/i18n";
import { MOCK_USER, MOCK_CONNECTIONS } from "@/lib/constants";
import { Radar, BookOpen } from "lucide-react";

/* ═══════════════════════════════════════════════════
   VELORA — Discover Screen
   Nearby discovery + Scan Memory (connection history)
   ═══════════════════════════════════════════════════ */

type DiscoverTab = "nearby" | "memory";

export function NetworkScreen() {
  const [tab, setTab] = useState<DiscoverTab>("nearby");
  const { t } = useTranslation(MOCK_USER.locale);

  return (
    <div className="min-h-screen bg-velora-black safe-bottom">
      {/* Header */}
      <div className="px-5 pt-14 pb-2">
        <FadeUp>
          <div className="text-center">
            <div className="text-caption text-velora-gold mb-1">
              {t("nav_discover")}
            </div>
            <h1 className="text-display text-2xl text-velora-text">
              Networking
            </h1>
          </div>
        </FadeUp>
      </div>

      {/* Tab toggle */}
      <div className="section">
        <FadeUp delay={0.1}>
          <div className="flex gap-1 p-1 rounded-[var(--radius-sm)] glass">
            {[
              { id: "nearby" as const, label: "Nearby", icon: Radar },
              { id: "memory" as const, label: t("scan_memory"), icon: BookOpen },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                    tab === item.id
                      ? "bg-velora-gold-dim text-velora-gold"
                      : "text-velora-text-muted"
                  }`}
                >
                  <Icon size={14} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </FadeUp>
      </div>

      {/* Content */}
      {tab === "nearby" ? (
        <>
          <RadarDiscovery />
          <Divider className="mx-5" />
          <div className="px-5 pt-5 pb-2">
            <FadeUp delay={0.6}>
              <div className="flex items-center justify-between">
                <h2 className="text-heading text-base text-velora-text">
                  Nearby Professionals
                </h2>
                <span className="text-caption text-velora-gold">5 found</span>
              </div>
            </FadeUp>
          </div>
          <NearbyList />
        </>
      ) : (
        <>
          {/* Scan Memory */}
          <div className="px-5 pt-4 pb-2">
            <FadeUp delay={0.2}>
              <div className="flex items-center justify-between">
                <h2 className="text-heading text-base text-velora-text">
                  {t("your_connections")}
                </h2>
                <span className="text-caption text-velora-gold">
                  {MOCK_CONNECTIONS.length}
                </span>
              </div>
            </FadeUp>
          </div>

          <div className="px-5 py-2">
            <StaggerChildren staggerDelay={0.1} delay={0.3} className="space-y-3">
              {MOCK_CONNECTIONS.map((connection) => (
                <StaggerItem key={connection.id}>
                  <ConnectionCard connection={connection} />
                </StaggerItem>
              ))}
            </StaggerChildren>
          </div>
        </>
      )}
    </div>
  );
}
