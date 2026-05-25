"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { PREMIUM_EASE } from "@/components/features/motion/animations";
import type { VeloraProfile } from "@/types";

/* ═══════════════════════════════════════════════════
   VELORA — Dynamic Interactive Radar Visualization
   
   Renders discovered users from Firestore in real-time,
   positioning them deterministically on concentric rings,
   and displaying their live avatars with profile navigation.
   ═══════════════════════════════════════════════════ */

interface DiscoveredPerson {
  id: string;
  name: string;
  username?: string;
  initials: string;
  avatar?: string;
  distance: "close" | "medium" | "far";
  angle: number;     // degrees from top (0-360)
  radius: number;    // 0.2 to 0.9 from center
}

const DISTANCE_COLORS = {
  close: { ring: "rgba(107, 191, 138, 0.8)", bg: "rgba(107, 191, 138, 0.15)", label: "Très proche" },
  medium: { ring: "color-mix(in srgb, var(--color-velora-gold) 80%, transparent)", bg: "color-mix(in srgb, var(--color-velora-gold) 15%, transparent)", label: "À proximité" },
  far: { ring: "rgba(123, 168, 212, 0.6)", bg: "rgba(123, 168, 212, 0.12)", label: "Dans votre zone" },
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

function getDeterministicCoords(id: string, proximityZone?: "close" | "medium" | "far") {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const angle = Math.abs(hash % 360);
  
  let radius = 0.5;
  const offset = (Math.abs(hash % 15)) / 100; // 0.00 to 0.14
  
  const zone = proximityZone || "medium";
  if (zone === "close") {
    radius = 0.22 + offset; // Inner ring: 0.22 to 0.36
  } else if (zone === "medium") {
    radius = 0.48 + offset; // Middle ring: 0.48 to 0.62
  } else {
    radius = 0.72 + offset; // Outer ring: 0.72 to 0.86
  }

  return { angle, radius, distance: zone };
}

interface RadarProps {
  discoveredUsers?: VeloraProfile[];
  isVisible?: boolean;
}

export function RadarVisualization({ discoveredUsers = [], isVisible = true }: RadarProps) {
  const router = useRouter();
  const SIZE = 280;

  const people: DiscoveredPerson[] = discoveredUsers.map((user) => {
    const proximityZone = user.proximityZone;
    const coords = getDeterministicCoords(user.id, proximityZone);
    const initials = user.fullName
      ?.split(" ")
      ?.map((n) => n[0])
      ?.slice(0, 2)
      ?.join("")
      ?.toUpperCase() || "U";

    return {
      id: user.id,
      name: user.fullName || "Velora Member",
      username: user.username,
      initials,
      avatar: user.avatarUrl || user.photoURL || undefined,
      angle: coords.angle,
      radius: coords.radius,
      distance: coords.distance,
    };
  });

  return (
    <div className="relative flex flex-col items-center">
      {/* Blurred background panel */}
      <div
        className="absolute inset-0 -top-12 -bottom-12 overflow-hidden rounded-3xl opacity-30 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 50% 30%, var(--color-velora-gold-dim) 0%, transparent 60%),
            radial-gradient(ellipse at 30% 70%, color-mix(in srgb, var(--color-velora-elevated) 60%, transparent) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 50%, color-mix(in srgb, var(--color-velora-elevated) 50%, transparent) 0%, transparent 50%),
            linear-gradient(180deg, color-mix(in srgb, var(--color-velora-black) 90%, transparent), color-mix(in srgb, var(--color-velora-black) 70%, transparent))
          `,
        }}
      />

      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        {/* Radar rings (3 concentric) */}
        {[0.33, 0.6, 0.88].map((scale, i) => (
          <div
            key={`ring-${i}`}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: `${(1 - scale) * 50}%`,
              top: `${(1 - scale) * 50}%`,
              width: `${scale * 100}%`,
              height: `${scale * 100}%`,
              border: `1px solid color-mix(in srgb, var(--color-velora-gold) ${(0.08 + i * 0.03) * 100}%, transparent)`,
            }}
          />
        ))}

        {/* Cross-hair lines */}
        <div
          className="absolute top-1/2 left-[12%] right-[12%] h-px pointer-events-none"
          style={{ background: "var(--color-velora-gold-dim)" }}
        />
        <div
          className="absolute left-1/2 top-[12%] bottom-[12%] w-px pointer-events-none"
          style={{ background: "var(--color-velora-gold-dim)" }}
        />

        {/* Animated pulse rings from center */}
        {isVisible && [0, 1, 2].map((i) => (
          <motion.div
            key={`pulse-${i}`}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: "50%",
              top: "50%",
              width: 0,
              height: 0,
              border: "1px solid var(--color-velora-gold-glow)",
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
        {isVisible && (
          <motion.div
            className="absolute top-1/2 left-1/2 origin-left pointer-events-none z-0"
            style={{
              width: SIZE * 0.44,
              height: "1px",
              background: "linear-gradient(90deg, color-mix(in srgb, var(--color-velora-gold) 70%, transparent) 0%, var(--color-velora-gold-dim) 70%, transparent 100%)",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
          />
        )}

        {/* Sweep glow trail */}
        {isVisible && (
          <motion.div
            className="absolute top-1/2 left-1/2 origin-left -translate-y-1/2 pointer-events-none z-0"
            style={{
              width: SIZE * 0.44,
              height: 24,
              background: "linear-gradient(90deg, var(--color-velora-gold-dim) 0%, transparent 80%)",
              borderRadius: "0 12px 12px 0",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
          />
        )}

        {/* Center: Glowing ring — "You" */}
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
              background: "radial-gradient(circle, var(--color-velora-gold-glow) 0%, transparent 70%)",
            }}
            animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0.3, 0.6] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Gold ring */}
          <div
            className="relative rounded-full flex items-center justify-center pointer-events-none"
            style={{
              width: 36,
              height: 36,
              left: -18,
              top: -18,
              position: "absolute",
              border: "2px solid color-mix(in srgb, var(--color-velora-gold) 60%, transparent)",
              background: "var(--color-velora-gold-dim)",
              boxShadow: "0 0 16px var(--color-velora-gold-glow), inset 0 0 8px var(--color-velora-gold-dim)",
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
          className="absolute z-20 text-center pointer-events-none"
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
            Moi {isVisible ? "(Visible)" : "(Invisible)"}
          </span>
        </motion.div>

        {/* Discovered people — avatar dots on radar */}
        {isVisible && people.map((person, i) => {
          const pos = polarToCartesian(person.angle, person.radius, SIZE);
          const color = DISTANCE_COLORS[person.distance];

          return (
            <motion.div
              key={person.id}
              className="absolute z-30"
              style={{
                left: pos.x,
                top: pos.y,
                transform: "translate(-50%, -50%)",
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.5,
                delay: 0.2 + i * 0.1,
                ease: PREMIUM_EASE,
              }}
            >
              {/* Distance indicator ring */}
              <motion.div
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: 42,
                  height: 42,
                  left: -21,
                  top: -21,
                  border: `1.5px solid ${color.ring}`,
                  background: color.bg,
                }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.4,
                }}
              />
              {/* Avatar circle */}
              <div
                className="relative w-8 h-8 rounded-full flex items-center justify-center overflow-hidden text-[9px] font-bold cursor-pointer border hover:scale-110 active:scale-95 transition-all bg-black"
                style={{
                  borderColor: color.ring,
                  color: "var(--color-velora-text)",
                }}
                onClick={() => {
                  if (person.username) {
                    router.push(`/u/${person.username}`);
                  } else {
                    router.push(`/p/${person.id}`);
                  }
                }}
              >
                {person.avatar ? (
                  <img src={person.avatar} alt={person.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{person.initials}</span>
                )}
              </div>
              {/* Name label */}
              <div
                className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap text-center pointer-events-none"
              >
                <span
                  className="text-[8px] font-medium px-1 py-0.5 rounded bg-black/60 border border-white/5 backdrop-blur-sm"
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
        transition={{ delay: 0.6, duration: 0.5 }}
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
