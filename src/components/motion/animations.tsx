"use client";

import { motion, type Variants, type Easing } from "framer-motion";
import { MOTION } from "@/lib/constants";
import type { ReactNode } from "react";

const EASE: Easing = [0.16, 1, 0.3, 1];

/* ═══════════════════════════════════════════════════
   VELORA — Motion Primitives
   
   Rules (enforced):
   - Max 700ms for entrances
   - GPU-safe only: transform, opacity, filter
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
   Primary entrance animation. 
   Subtle upward drift with blur dissolve. */
export function FadeUp({ children, delay = 0, className }: MotionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{
        duration: MOTION.duration.entrance,
        delay,
        ease: EASE,
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
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: MOTION.duration.slow,
        delay,
        ease: EASE,
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
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: MOTION.duration.slow,
        delay,
        ease: EASE,
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
  hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: MOTION.duration.slow,
      ease: EASE,
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
      animate="visible"
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
