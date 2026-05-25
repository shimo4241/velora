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
  unreadCount?: number;
}

const tabs: { id: AppTab; icon: typeof Home; label: string }[] = [
  { id: "home", icon: Home, label: "Accueil" },
  { id: "identity", icon: User, label: "Identité" },
  { id: "share", icon: Share2, label: "Partager" },
  { id: "discover", icon: Radio, label: "Découvrir" },
  { id: "agenda", icon: Calendar, label: "Agenda" },
];

export function BottomNav({ activeTab, onTabChange, unreadCount = 0 }: BottomNavProps) {
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
              className="relative flex min-w-[56px] flex-col items-center gap-0.5 rounded-xl px-3 py-2 transition-colors duration-200 ease-out"
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
            >
              {/* Active background */}
              <span
                className={`absolute inset-0 rounded-xl border bg-gradient-to-b transition-opacity duration-200 ease-out ${
                  isActive
                    ? "border-velora-gold/30 from-[color-mix(in srgb, var(--color-velora-gold) 15%, transparent)] to-[color-mix(in srgb, var(--color-velora-gold) 2%, transparent)] opacity-100 shadow-[0_0_8px_color-mix(in srgb, var(--color-velora-gold) 10%, transparent)]"
                    : "border-transparent from-transparent to-transparent opacity-0"
                }`}
              />

              <div className="relative">
                <Icon
                  size={20}
                  className={`relative z-10 transition-[color,filter] duration-200 ease-out ${
                    isActive
                      ? "text-velora-gold drop-shadow-[0_0_4px_color-mix(in srgb, var(--color-velora-gold) 20%, transparent)]"
                      : "text-velora-text-muted hover:text-velora-text"
                  }`}
                />
                {tab.id === "discover" && unreadCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full ring-2 ring-black z-20 animate-pulse bg-red-500"
                    style={{ backgroundColor: "var(--color-velora-rose, #D4737B)" }}
                  />
                )}
              </div>
              <span
                className={`relative z-10 text-[9px] font-bold tracking-wide transition-colors duration-200 ease-out ${
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
