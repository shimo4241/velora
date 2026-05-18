"use client";

import { motion } from "framer-motion";
import {
  Home,
  User,
  Share2,
  Radio,
  TrendingUp,
} from "lucide-react";
import type { AppTab } from "@/types";

/* ═══════════════════════════════════════════════════
   VELORA — Bottom Navigation
   
   Glassmorphic tab bar with animated active indicator.
   Uses layoutId for fluid tab switching.
   ═══════════════════════════════════════════════════ */

interface BottomNavProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

const tabs: { id: AppTab; icon: typeof Home; label: string }[] = [
  { id: "home", icon: Home, label: "Accueil" },
  { id: "identity", icon: User, label: "Identité" },
  { id: "share", icon: Share2, label: "Partager" },
  { id: "discover", icon: Radio, label: "Découvrir" },
  { id: "insights", icon: TrendingUp, label: "Insights" },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
      <div className="bottom-nav-inner">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl min-w-[56px]"
              whileTap={{ scale: 0.92 }}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
            >
              {/* Active background */}
              {isActive && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 bg-velora-gold-dim rounded-xl border border-velora-gold/20"
                  transition={{
                    type: "tween",
                    duration: 0.3,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                />
              )}

              <Icon
                size={20}
                className={`relative z-10 transition-colors duration-300 ${
                  isActive
                    ? "text-velora-gold"
                    : "text-velora-text-muted"
                }`}
              />
              <span
                className={`relative z-10 text-[9px] font-medium transition-colors duration-300 ${
                  isActive
                    ? "text-velora-gold"
                    : "text-velora-text-muted"
                }`}
              >
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
