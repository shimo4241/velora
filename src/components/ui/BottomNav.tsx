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
import { useTranslation } from "@/lib/i18n";

/* ─── VELORA — Bottom Navigation ─── */

interface BottomNavProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  unreadCount?: number;
}

const tabs: { id: AppTab; icon: typeof Home; labelKey: string }[] = [
  { id: "home", icon: Home, labelKey: "nav_home" },
  { id: "identity", icon: User, labelKey: "nav_identity" },
  { id: "share", icon: Share2, labelKey: "nav_share" },
  { id: "discover", icon: Radio, labelKey: "nav_discover" },
  { id: "agenda", icon: Calendar, labelKey: "nav_agenda" },
];

export function BottomNav({ activeTab, onTabChange, unreadCount = 0 }: BottomNavProps) {
  const { t } = useTranslation();

  return (
    <nav className="bottom-nav" role="navigation" aria-label={t("nav_home")}>
      <div className="bottom-nav-inner" role="tablist" aria-label="Tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const label = t(tab.labelKey);

          return (
            <motion.button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              id={`tab-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className="relative flex min-w-[56px] flex-col items-center gap-0.5 rounded-xl px-3 py-2 transition-colors duration-200 ease-out"
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              aria-label={label}
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
                {label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
