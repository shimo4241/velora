"use client";

import { motion } from "framer-motion";
import {
  MapPin,
  Briefcase,
  Users,
  ArrowUpRight,
  Shield,
  Star,
} from "lucide-react";
import { GlassCard, GoldBadge } from "../ui";
import { FadeUp, StaggerChildren, StaggerItem } from "../motion/animations";
import { useState, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { getDiscoverUsers } from "@/lib/firestore";
import type { VeloraProfile } from "@/types";

/* ── Radar Discovery Animation ── */
export function RadarDiscovery() {
  return (
    <FadeUp delay={0.2}>
      <div className="flex flex-col items-center py-8">
        <div className="relative w-56 h-56">
          {/* Radar rings */}
          {[1, 2, 3].map((ring) => (
            <div
              key={ring}
              className="absolute inset-0 rounded-full border border-velora-gold/10"
              style={{
                inset: `${ring * 20}%`,
              }}
            />
          ))}

          {/* Outer pulse rings */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={`pulse-${i}`}
              className="absolute inset-0 rounded-full border border-velora-gold/15"
              animate={{
                scale: [0.3, 1],
                opacity: [0.5, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeOut",
                delay: i * 1,
              }}
            />
          ))}

          {/* Radar sweep line */}
          <motion.div
            className="absolute top-1/2 left-1/2 w-1/2 h-px origin-left"
            style={{
              background:
                "linear-gradient(90deg, rgba(201,168,76,0.6) 0%, transparent 100%)",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />

          {/* Sweep glow */}
          <motion.div
            className="absolute top-1/2 left-1/2 w-1/2 h-8 origin-left -translate-y-1/2"
            style={{
              background:
                "linear-gradient(90deg, rgba(201,168,76,0.08) 0%, transparent 80%)",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />

          {/* Center dot */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <motion.div
              className="w-4 h-4 rounded-full bg-velora-gold"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                boxShadow: "0 0 20px rgba(201,168,76,0.5)",
              }}
            />
          </div>

          {/* Discovered professionals */}
          {[
            { x: 25, y: 20, delay: 1.5 },
            { x: 75, y: 30, delay: 2.2 },
            { x: 60, y: 70, delay: 3.0 },
            { x: 20, y: 65, delay: 1.8 },
            { x: 80, y: 55, delay: 2.8 },
          ].map((dot, i) => (
            <motion.div
              key={i}
              className="absolute w-2.5 h-2.5 rounded-full bg-velora-gold/60"
              style={{
                left: `${dot.x}%`,
                top: `${dot.y}%`,
                boxShadow: "0 0 8px rgba(201,168,76,0.3)",
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 0.8, 0.4],
                scale: [0, 1.2, 1],
              }}
              transition={{
                duration: 1,
                delay: dot.delay,
                repeat: Infinity,
                repeatDelay: 3,
              }}
            />
          ))}
        </div>

        <motion.div
          className="text-center mt-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <div className="text-heading text-base text-velora-text">
            Scanning nearby...
          </div>
          <div className="text-xs text-velora-text-muted mt-1">
            5 professionals discovered within 50m
          </div>
        </motion.div>
      </div>
    </FadeUp>
  );
}

/* ── Professional Card ── */
interface ProfessionalCardProps {
  name: string;
  title: string;
  company: string;
  distance: string;
  mutualConnections: number;
  isVerified?: boolean;
  isPremium?: boolean;
  avatarGradient?: string;
}

export function ProfessionalCard({
  name,
  title,
  company,
  distance,
  mutualConnections,
  isVerified = false,
  isPremium = false,
  avatarGradient = "from-velora-gold/30 to-amber-700/20",
}: ProfessionalCardProps) {
  return (
    <GlassCard className="p-4">
      <div className="flex items-start gap-3.5">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div
            className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center`}
          >
            <span className="text-lg font-semibold text-velora-text font-[family-name:var(--font-display)]">
              {name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </span>
          </div>
          {isVerified && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-velora-black flex items-center justify-center border border-velora-gold/30">
              <Shield size={10} className="text-velora-gold" fill="currentColor" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-velora-text truncate font-[family-name:var(--font-display)]">
              {name}
            </h3>
            {isPremium && (
              <Star
                size={12}
                className="text-velora-gold flex-shrink-0"
                fill="currentColor"
              />
            )}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <Briefcase size={11} className="text-velora-text-muted" />
            <span className="text-xs text-velora-text-secondary truncate">
              {title} · {company}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              <MapPin size={10} className="text-velora-text-muted" />
              <span className="text-[10px] text-velora-text-muted">
                {distance}
              </span>
            </div>
            {mutualConnections > 0 && (
              <div className="flex items-center gap-1">
                <Users size={10} className="text-velora-gold/60" />
                <span className="text-[10px] text-velora-gold/60">
                  {mutualConnections} mutual
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Connect action */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="flex-shrink-0 w-9 h-9 rounded-xl bg-velora-gold/10 border border-velora-gold/20 flex items-center justify-center"
        >
          <ArrowUpRight size={16} className="text-velora-gold" />
        </motion.button>
      </div>
    </GlassCard>
  );
}

/* ── Nearby Professionals List ── */
export function NearbyList() {
  const { profile, isProfileReady } = useProfile();
  const [professionals, setProfessionals] = useState<VeloraProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isProfileReady || !profile?.id) return;
    
    getDiscoverUsers(profile.id, 10).then(({ users }) => {
      setProfessionals(users);
      setLoading(false);
    }).catch(err => {
      console.error("Error fetching discover users:", err);
      setLoading(false);
    });
  }, [profile?.id, isProfileReady]);

  if (loading) {
    return (
      <div className="px-5 py-8 text-center text-velora-text-muted text-sm">
        Recherche en cours...
      </div>
    );
  }

  if (professionals.length === 0) {
    return (
      <div className="px-5 py-8 text-center text-velora-text-muted text-sm">
        Aucun professionnel à proximité pour le moment.
      </div>
    );
  }

  return (
    <div className="px-5 py-4">
      <StaggerChildren staggerDelay={0.1} delay={0.8} className="space-y-3">
        {professionals.map((pro, i) => (
          <StaggerItem key={pro.id || i}>
            <ProfessionalCard 
              name={pro.fullName}
              title={pro.title}
              company={pro.company || ""}
              distance="-- m"
              mutualConnections={0}
              isVerified={pro.isVerified}
              isPremium={pro.isPremium}
            />
          </StaggerItem>
        ))}
      </StaggerChildren>
    </div>
  );
}
