"use client";

import { motion, type Variants, type Easing } from "framer-motion";
import { MOTION } from "@/lib/constants";
import type { ReactNode } from "react";

export const PREMIUM_EASE: Easing = [0.16, 1, 0.3, 1];

/* ═══════════════════════════════════════════════════
   VELORA — Motion Primitives
   
   Rules (enforced):
   - Max 700ms for entrances
   - GPU-safe only: transform and one-shot opacity
   - No spring/bounce easing
   - No infinite loops (except ambient)
   - Stagger: 60ms between siblings
   ═══════════════════════════════════════════════════ */

interface MotionProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

/* ── Fade Up ── 
   Primary entrance animation with composited movement only. */
export function FadeUp({ children, delay = 0, className }: MotionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.22 }}
      transition={{
        duration: MOTION.duration.entrance,
        delay,
        ease: PREMIUM_EASE,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Scale In ──
   Used for avatars, icons, badges.
   Grows from 92% — barely noticeable but adds life. */
export function ScaleIn({ children, delay = 0, className }: MotionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{
        duration: MOTION.duration.slow,
        delay,
        ease: PREMIUM_EASE,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Slide In ──
   Horizontal entrance. Used for timeline items. */
export function SlideIn({ children, delay = 0, className }: MotionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{
        duration: MOTION.duration.slow,
        delay,
        ease: PREMIUM_EASE,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Stagger Container ──
   Wraps a list of children with staggered entrance. */
interface StaggerProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  staggerDelay?: number;
}

const staggerContainer: Variants = {
  hidden: {},
  visible: (custom: { delay: number; stagger: number }) => ({
    transition: {
      delayChildren: custom.delay,
      staggerChildren: custom.stagger,
    },
  }),
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION.duration.slow,
      ease: PREMIUM_EASE,
    },
  },
};

export function StaggerChildren({
  children,
  className,
  delay = 0,
  staggerDelay = MOTION.stagger,
}: StaggerProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.18 }}
      custom={{ delay, stagger: staggerDelay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  );
}
