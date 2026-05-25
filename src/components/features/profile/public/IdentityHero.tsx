"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { MapPin, Pencil } from "lucide-react";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import type { VeloraProfile } from "@/types";
import { getActiveTheme, getInitials } from "./publicShared";

interface IdentityHeroProps {
  profile: VeloraProfile;
  portfolioCount: number;
  experienceCount: number;
  connectionsCount?: number;
  onEdit?: () => void;
  onEditAvatar?: () => void;
  localTab?: "overview" | "activity";
  setLocalTab?: (tab: "overview" | "activity") => void;
}

export default function IdentityHero({
  profile,
  portfolioCount,
  experienceCount,
  connectionsCount = 0,
  onEdit,
  onEditAvatar,
  localTab = "overview",
  setLocalTab,
}: IdentityHeroProps) {
  const heroRef = useRef<HTMLElement>(null);
  const theme = getActiveTheme(profile);

  return (
    <section
      ref={heroRef}
      className="relative overflow-hidden bg-[#0D0D0A] pt-4 pb-2 border-b border-white/5"
    >
      {/* Hidden global metallic gradient definitions */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <linearGradient id="zellige-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--theme-accent)" />
            <stop offset="50%" stopColor="var(--theme-accent-2)" />
            <stop offset="100%" stopColor="var(--theme-accent)" />
          </linearGradient>
        </defs>
      </svg>
      {/* 1. Header Row */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-base tracking-tight text-[var(--theme-accent)]">Velora</span>
          <span className="bg-[var(--theme-accent)]/15 text-[var(--theme-accent)] border border-[var(--theme-accent)]/20 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
            {theme.label}
          </span>
        </div>
        <span className="text-xs font-semibold text-velora-text uppercase tracking-wider">Profile</span>
        <div className="flex items-center gap-3">
          {/* Bell Icon */}
          <button className="text-velora-text-muted hover:text-velora-text transition-colors">
            <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          </button>
          {/* Gear Settings Icon */}
          <button onClick={onEdit} className="text-velora-text-muted hover:text-velora-text transition-colors">
            <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.99a7.7 7.7 0 011.005.831 1.125 1.125 0 01.26 1.43l-1.297 2.247a1.125 1.125 0 01-1.37.491l-1.216-.456c-.356-.133-.751-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.83c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.831a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.645-.869l.213-1.28z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* 2. Hero Profile Info Row */}
      <div className="px-4 py-4 flex items-center gap-4">
        {/* Left: Avatar with Double Gold Ring & Badge */}
        <div className="relative shrink-0">
          <div className="h-20 w-20 rounded-full p-[2px] bg-gradient-to-tr from-[var(--theme-accent)] to-[var(--theme-accent-2)] border border-[var(--theme-accent)]/30">
            <div className="h-full w-full rounded-full bg-black p-[2.5px]">
              <div className="h-full w-full rounded-full overflow-hidden bg-velora-surface relative">
                {profile.avatarUrl ? (
                  <OptimizedImage
                    src={profile.avatarUrl}
                    type="avatar"
                    className="h-full w-full object-cover"
                    alt={profile.fullName}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#111] font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--theme-accent)]">
                    {getInitials(profile.fullName)}
                  </div>
                )}
              </div>
            </div>
          </div>
          {onEditAvatar && (
            <motion.button
              type="button"
              aria-label="Edit photo"
              title="Edit photo"
              onClick={onEditAvatar}
              whileHover={{ y: -1, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="absolute bottom-0 right-0 z-20 flex h-6.5 w-6.5 items-center justify-center rounded-full border border-velora-gold/35 bg-[linear-gradient(135deg,var(--color-velora-gold-dim),rgba(255,255,255,0.06))] text-velora-gold shadow-[0_4px_12px_rgba(0,0,0,0.18),0_0_8px_var(--color-velora-gold-glow)] backdrop-blur-md transition-colors duration-300 hover:border-velora-gold/60 hover:bg-velora-gold/16 focus:border-velora-gold/70"
            >
              <Pencil size={11} />
            </motion.button>
          )}
          {/* Small Gold badge overlap */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[var(--theme-accent)] to-[var(--theme-accent-2)] text-velora-black text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full border border-black shadow-md tracking-wider">
            {theme.label}
          </div>
        </div>

        {/* Right: Info + Stats */}
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold text-[var(--theme-accent)] tracking-wide truncate">
            {profile.fullName || "Eleanor Thorne"}
          </h1>
          <p className="text-[11px] text-velora-text-secondary truncate mt-0.5 font-medium leading-none">
            {profile.title || "Executive Director"} | {profile.company || "Global Strategies"}
          </p>
          
          {/* Location */}
          <div className="text-[9.5px] text-velora-text-muted mt-1.5 flex items-center gap-1 leading-none">
            <MapPin size={10} className="text-[var(--theme-accent)]" />
            <span>{profile.location || "New York, USA"}</span>
          </div>

          {/* Stats row */}
          <div className="flex gap-4 mt-3">
            <div>
              <span className="block text-sm font-semibold text-[var(--theme-accent)] leading-none">
                {connectionsCount}
              </span>
              <span className="text-[8px] text-velora-text-muted mt-0.5 block leading-none">Connections</span>
            </div>
            <div>
              <span className="block text-sm font-semibold text-[var(--theme-accent)] leading-none">
                {portfolioCount}
              </span>
              <span className="text-[8px] text-velora-text-muted mt-0.5 block leading-none">Projects</span>
            </div>
            <div>
              <span className="block text-sm font-semibold text-[var(--theme-accent)] leading-none">
                {experienceCount}
              </span>
              <span className="text-[8px] text-velora-text-muted mt-0.5 block leading-none">Experience</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Tab Selector */}
      <div className="px-4 py-2 flex justify-center">
        <div className="flex bg-[#161512] p-0.5 rounded-full w-full max-w-[320px] border border-white/5">
          <button
            onClick={() => setLocalTab?.("overview")}
            className={`flex-1 text-center py-1.5 rounded-full text-xs font-semibold transition-all ${
              localTab === "overview"
                ? "bg-[var(--theme-accent)]/15 text-[var(--theme-accent)] border border-[var(--theme-accent)]/20 shadow-md"
                : "text-velora-text-muted hover:text-velora-text-secondary"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setLocalTab?.("activity")}
            className={`flex-1 text-center py-1.5 rounded-full text-xs font-semibold transition-all ${
              localTab === "activity"
                ? "bg-[var(--theme-accent)]/15 text-[var(--theme-accent)] border border-[var(--theme-accent)]/20 shadow-md"
                : "text-velora-text-muted hover:text-velora-text-secondary"
            }`}
          >
            Activity
          </button>
        </div>
      </div>
    </section>
  );
}
