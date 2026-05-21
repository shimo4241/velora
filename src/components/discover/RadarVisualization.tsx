"use client";

import { motion } from "framer-motion";
import { MOTION } from "@/lib/constants";
import { PREMIUM_EASE } from "@/components/motion/animations";

/* ═══════════════════════════════════════════════════
   VELORA — Interactive Radar Visualization
   
   Enhanced radar with:
   - Glowing center ring labeled "You (Visible)"
   - Profile avatars positioned along radar sweeps
   - Color-coded distance indicators
   - Animated radar sweep with glow trail
   ═══════════════════════════════════════════════════ */

interface DiscoveredPerson {
  id: string;
  name: string;
  initials: string;
  avatar?: string;
  distance: "close" | "medium" | "far";
  angle: number;     // degrees from top (0-360)
  radius: number;    // 0.2 to 0.9 from center
}

const DEMO_PEOPLE: DiscoveredPerson[] = [
  { id: "1", name: "Sarah J.", initials: "SJ", distance: "close", angle: 35, radius: 0.32 },
  { id: "2", name: "David C.", initials: "DC", distance: "medium", angle: 120, radius: 0.52 },
  { id: "3", name: "Amina K.", initials: "AK", distance: "close", angle: 200, radius: 0.38 },
  { id: "4", name: "Youssef B.", initials: "YB", distance: "far", angle: 280, radius: 0.72 },
  { id: "5", name: "Léa M.", initials: "LM", distance: "medium", angle: 340, radius: 0.55 },
  { id: "6", name: "Marc D.", initials: "MD", distance: "far", angle: 75, radius: 0.8 },
];

const DISTANCE_COLORS = {
  close: { ring: "rgba(107, 191, 138, 0.8)", bg: "rgba(107, 191, 138, 0.15)", label: "< 50m" },
  medium: { ring: "rgba(196, 162, 101, 0.8)", bg: "rgba(196, 162, 101, 0.15)", label: "50-200m" },
  far: { ring: "rgba(123, 168, 212, 0.6)", bg: "rgba(123, 168, 212, 0.12)", label: "> 200m" },
};

function polarToCartesian(angleDeg: number, radiusFraction: number, containerSize: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  const center = containerSize / 2;
  const r = (containerSize / 2) * radiusFraction;
  return {
    x: center + r * Math.cos(angleRad),
    y: center + r * Math.sin(angleRad),
  };
}

interface RadarProps {
  discoveredCount?: number;
  isVisible?: boolean;
}

export function RadarVisualization({ discoveredCount = 0, isVisible = true }: RadarProps) {
  const SIZE = 280;
  const people = discoveredCount > 0 ? DEMO_PEOPLE.slice(0, Math.min(discoveredCount, DEMO_PEOPLE.length)) : DEMO_PEOPLE;

  return (
    <div className="relative flex flex-col items-center">
      {/* Blurred conference background */}
      <div
        className="absolute inset-0 -top-12 -bottom-12 overflow-hidden rounded-3xl opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 50% 30%, rgba(196, 162, 101, 0.08) 0%, transparent 60%),
            radial-gradient(ellipse at 30% 70%, rgba(40, 38, 31, 0.6) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 50%, rgba(40, 38, 31, 0.5) 0%, transparent 50%),
            linear-gradient(180deg, rgba(7, 7, 5, 0.9), rgba(7, 7, 5, 0.7))
          `,
        }}
      />

      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        {/* Radar rings (3 concentric) */}
        {[0.33, 0.6, 0.88].map((scale, i) => (
          <div
            key={`ring-${i}`}
            className="absolute rounded-full"
            style={{
              left: `${(1 - scale) * 50}%`,
              top: `${(1 - scale) * 50}%`,
              width: `${scale * 100}%`,
              height: `${scale * 100}%`,
              border: `1px solid rgba(196, 162, 101, ${0.08 + i * 0.03})`,
            }}
          />
        ))}

        {/* Cross-hair lines */}
        <div
          className="absolute top-1/2 left-[12%] right-[12%] h-px"
          style={{ background: "rgba(196, 162, 101, 0.06)" }}
        />
        <div
          className="absolute left-1/2 top-[12%] bottom-[12%] w-px"
          style={{ background: "rgba(196, 162, 101, 0.06)" }}
        />

        {/* Animated pulse rings from center */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={`pulse-${i}`}
            className="absolute rounded-full"
            style={{
              left: "50%",
              top: "50%",
              width: 0,
              height: 0,
              border: "1px solid rgba(196, 162, 101, 0.2)",
              transform: "translate(-50%, -50%)",
            }}
            animate={{
              width: [0, SIZE * 0.9],
              height: [0, SIZE * 0.9],
              opacity: [0.5, 0],
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: "easeOut",
              delay: i * 1.2,
            }}
          />
        ))}

        {/* Radar sweep — primary line */}
        <motion.div
          className="absolute top-1/2 left-1/2 origin-left"
          style={{
            width: SIZE * 0.44,
            height: "1px",
            background: "linear-gradient(90deg, rgba(196, 162, 101, 0.7) 0%, rgba(196, 162, 101, 0.1) 70%, transparent 100%)",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
        />

        {/* Sweep glow trail */}
        <motion.div
          className="absolute top-1/2 left-1/2 origin-left -translate-y-1/2"
          style={{
            width: SIZE * 0.44,
            height: 24,
            background: "linear-gradient(90deg, rgba(196, 162, 101, 0.06) 0%, transparent 80%)",
            borderRadius: "0 12px 12px 0",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
        />

        {/* Center: Glowing ring — "You (Visible)" */}
        <div
          className="absolute z-20"
          style={{
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          {/* Outer glow */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 52,
              height: 52,
              left: -26,
              top: -26,
              background: "radial-gradient(circle, rgba(196, 162, 101, 0.15) 0%, transparent 70%)",
            }}
            animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0.3, 0.6] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Gold ring */}
          <div
            className="relative rounded-full flex items-center justify-center"
            style={{
              width: 36,
              height: 36,
              left: -18,
              top: -18,
              position: "absolute",
              border: "2px solid rgba(196, 162, 101, 0.6)",
              background: "rgba(196, 162, 101, 0.12)",
              boxShadow: "0 0 16px rgba(196, 162, 101, 0.2), inset 0 0 8px rgba(196, 162, 101, 0.1)",
            }}
          >
            <motion.div
              className="w-3 h-3 rounded-full"
              style={{ background: "var(--color-velora-gold)" }}
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </div>

        {/* Label below center */}
        <motion.div
          className="absolute z-20 text-center"
          style={{
            left: "50%",
            top: "50%",
            transform: "translate(-50%, 22px)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <span
            className="text-[9px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: "var(--color-velora-gold)" }}
          >
            You {isVisible ? "(Visible)" : "(Hidden)"}
          </span>
        </motion.div>

        {/* Discovered people — avatar dots on radar */}
        {people.map((person, i) => {
          const pos = polarToCartesian(person.angle, person.radius, SIZE);
          const color = DISTANCE_COLORS[person.distance];

          return (
            <motion.div
              key={person.id}
              className="absolute z-10"
              style={{
                left: pos.x,
                top: pos.y,
                transform: "translate(-50%, -50%)",
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.5,
                delay: 0.8 + i * 0.25,
                ease: PREMIUM_EASE,
              }}
            >
              {/* Distance indicator ring */}
              <motion.div
                className="absolute rounded-full"
                style={{
                  width: 38,
                  height: 38,
                  left: -19,
                  top: -19,
                  border: `1.5px solid ${color.ring}`,
                  background: color.bg,
                }}
                animate={{ scale: [1, 1.12, 1] }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.4,
                }}
              />
              {/* Avatar circle */}
              <div
                className="relative w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold"
                style={{
                  background: "linear-gradient(135deg, rgba(196, 162, 101, 0.25), rgba(28, 26, 20, 0.9))",
                  border: `1.5px solid ${color.ring}`,
                  color: "var(--color-velora-text)",
                  letterSpacing: "0.02em",
                }}
              >
                {person.initials}
              </div>
              {/* Name label */}
              <div
                className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-center"
              >
                <span
                  className="text-[8px] font-medium"
                  style={{ color: "var(--color-velora-text-secondary)" }}
                >
                  {person.name}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Distance legend */}
      <motion.div
        className="flex items-center gap-4 mt-5"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.5 }}
      >
        {(Object.entries(DISTANCE_COLORS) as [string, typeof DISTANCE_COLORS.close][]).map(([key, val]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: val.ring }}
            />
            <span
              className="text-[9px] font-medium"
              style={{ color: "var(--color-velora-text-muted)" }}
            >
              {val.label}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
