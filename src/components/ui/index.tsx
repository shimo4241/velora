"use client";

import { motion, type Easing } from "framer-motion";
import { MOTION } from "@/lib/constants";
import type { ReactNode } from "react";

/* ═══════════════════════════════════════════════════
   VELORA — UI Atoms
   
   Every component uses design tokens.
   No ad-hoc colors. No arbitrary values.
   ═══════════════════════════════════════════════════ */

/* ── Glass Card ── */
interface GlassCardProps {
  children: ReactNode;
  className?: string;
  gold?: boolean;
  hover?: boolean;
  onClick?: () => void;
}

export function GlassCard({
  children,
  className = "",
  gold = false,
  hover = true,
  onClick,
}: GlassCardProps) {
  const baseClass = gold ? "glass-gold" : "glass";
  const hoverClass = hover ? "card-interactive" : "";
  const Tag = onClick ? motion.button : motion.div;

  return (
    <Tag
      className={`${baseClass} ${hoverClass} rounded-[var(--radius-card)] ${className}`}
      onClick={onClick}
      whileHover={hover ? { y: -3, scale: 1.006 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
    >
      {children}
    </Tag>
  );
}

/* ── Gold Button ── */
interface GoldButtonProps {
  children: ReactNode;
  onClick?: () => void;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "solid" | "outline" | "glass" | "whatsapp" | "identity";
  className?: string;
  disabled?: boolean;
}

export function GoldButton({
  children,
  onClick,
  fullWidth = false,
  size = "md",
  variant = "solid",
  className = "",
  disabled = false,
}: GoldButtonProps) {
  const sizeStyles = {
    sm: "px-4 py-2 text-xs gap-1.5",
    md: "px-6 py-3 text-sm gap-2",
    lg: "px-8 py-4 text-sm gap-2",
  };

  const variantStyles = {
    solid: "btn-3d-primary text-velora-black",
    outline: "btn-3d-outline text-velora-gold",
    glass: "btn-3d-glass text-velora-text",
    whatsapp: "btn-3d-whatsapp text-white",
    identity: "btn-3d-identity text-velora-black",
  }[variant] || "btn-3d-primary text-velora-black";

  return (
    <motion.button
      onClick={disabled ? undefined : onClick}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center
        rounded-[var(--radius-md)] font-[family-name:var(--font-display)]
        transition-all duration-300
        ${sizeStyles[size]}
        ${variantStyles}
        ${fullWidth ? "w-full" : ""}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${className}
      `}
    >
      {children}
    </motion.button>
  );
}

/* ── Gold Badge ── */
interface GoldBadgeProps {
  children: ReactNode;
  variant?: "default" | "premium" | "verified";
  className?: string;
}

export function GoldBadge({
  children,
  variant = "default",
  className = "",
}: GoldBadgeProps) {
  const variants = {
    default: "border-velora-gold/20 text-velora-gold bg-velora-gold-dim",
    premium:
      "border-velora-gold/30 text-velora-gold bg-velora-gold-dim",
    verified:
      "border-velora-emerald/30 text-velora-emerald bg-velora-emerald/10",
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2.5 py-1
        rounded-[var(--radius-sm)] border
        text-[10px] font-semibold uppercase tracking-wider
        font-[family-name:var(--font-body)]
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

/* ── Progress Ring ── */
interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
}

export function ProgressRing({
  progress,
  size = 48,
  strokeWidth = 2.5,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 overflow-visible">
        <defs>
          <linearGradient id="goldGradientRing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-velora-gold)" />
            <stop offset="30%" stopColor="var(--color-velora-gold-light)" />
            <stop offset="70%" stopColor="var(--color-velora-gold-muted)" />
            <stop offset="100%" stopColor="var(--color-velora-gold-light)" />
          </linearGradient>
          <filter id="goldGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#goldGradientRing)"
          filter="url(#goldGlow)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{
            duration: MOTION.duration.entrance,
            delay: 0.3,
            ease: [0.16, 1, 0.3, 1] as Easing,
          }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-gold-gradient text-xs font-bold text-data block">{progress}%</span>
      </div>
    </div>
  );
}

/* ── Divider ── */
export function Divider({ className = "" }: { className?: string }) {
  return <div className={`divider ${className}`} />;
}
