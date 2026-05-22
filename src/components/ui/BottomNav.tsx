"use client";

import { motion } from "framer-motion";
import {
  Home,
  User,
  Share2,
  Radio,
  Calendar,
} from "lucide-react";
import type { AppTab } from "@/types";

/* ─── VELORA — Bottom Navigation ─── */

interface BottomNavProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

const tabs: { id: AppTab; icon: typeof Home; label: string }[] = [
  { id: "home", icon: Home, label: "Accueil" },
  { id: "identity", icon: User, label: "Identité" },
  { id: "share", icon: Share2, label: "Partager" },
  { id: "discover", icon: Radio, label: "Découvrir" },
  { id: "agenda", icon: Calendar, label: "Agenda" },
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
              className="relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl min-w-[56px]"
              whileTap={{ scale: 0.94 }}
              whileHover={{ scale: isActive ? 1 : 1.05 }}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
            >
              {/* Active background */}
              {isActive && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 bg-gradient-to-b from-[rgba(196,162,101,0.15)] to-[rgba(196,162,101,0.02)] rounded-xl border border-velora-gold/30 shadow-[0_0_15px_rgba(196,162,101,0.15)]"
                  transition={{
                    type: "spring",
                    stiffness: 380,
                    damping: 30,
                  }}
                />
              )}

              <Icon
                size={20}
                className={`relative z-10 transition-all duration-300 ${
                  isActive
                    ? "text-velora-gold scale-110 drop-shadow-[0_0_10px_rgba(196,162,101,0.6)]"
                    : "text-velora-text-muted hover:text-velora-text"
                }`}
              />
              <span
                className={`relative z-10 text-[9px] font-bold tracking-wide transition-all duration-300 ${
                  isActive
                    ? "text-velora-gold font-bold scale-105"
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
