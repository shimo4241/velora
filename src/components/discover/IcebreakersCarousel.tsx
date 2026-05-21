"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { MOTION } from "@/lib/constants";
import { PREMIUM_EASE } from "@/components/motion/animations";
import { ChevronLeft, ChevronRight, Sparkles, Users, MessageSquare } from "lucide-react";

/* ═══════════════════════════════════════════════════
   VELORA — AI-Powered Icebreakers Carousel
   
   Each card shows:
   - Profile snippet with avatar/initials
   - "Potential Connect" label
   - Gold-outlined "Common Ground" box
   - AI-generated icebreaker suggestion
   ═══════════════════════════════════════════════════ */

interface IcebreakerCard {
  id: string;
  name: string;
  title: string;
  company: string;
  initials: string;
  commonGround: string;
  mutualContacts?: number;
  icebreaker: string;
  gradient: string;
}

const ICEBREAKER_CARDS: IcebreakerCard[] = [
  {
    id: "1",
    name: "Sarah Jenkins",
    title: "VP of Innovation",
    company: "FinBridge Capital",
    initials: "SJ",
    commonGround: "FinTech Innovation",
    mutualContacts: 3,
    icebreaker: "\"I noticed you spoke at FinTech Summit 2024 — I'd love to discuss payment rails.\"",
    gradient: "from-emerald-900/30 to-emerald-950/10",
  },
  {
    id: "2",
    name: "David Chen",
    title: "CTO",
    company: "NexTap Solutions",
    initials: "DC",
    commonGround: "'NFC Tech' group",
    icebreaker: "\"Your work on contactless identity is fascinating — are you exploring UWB?\"",
    gradient: "from-blue-900/30 to-blue-950/10",
  },
  {
    id: "3",
    name: "Amina Khalil",
    title: "Head of Partnerships",
    company: "MedConnect MENA",
    initials: "AK",
    commonGround: "Healthcare Digital ID",
    mutualContacts: 5,
    icebreaker: "\"Your digital health initiative in Morocco aligns perfectly with our platform.\"",
    gradient: "from-violet-900/30 to-violet-950/10",
  },
  {
    id: "4",
    name: "Marc Dupont",
    title: "Founder",
    company: "LuxCard Studio",
    initials: "MD",
    commonGround: "Premium Card Design",
    mutualContacts: 2,
    icebreaker: "\"I love how you merge tactile luxury with digital — can we collab?\"",
    gradient: "from-amber-900/30 to-amber-950/10",
  },
];

export function IcebreakersCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 280;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <motion.section
      className="relative pt-6"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: MOTION.duration.entrance, ease: PREMIUM_EASE }}
    >
      {/* Section header */}
      <div className="px-5 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center w-7 h-7 rounded-lg"
            style={{
              background: "rgba(196, 162, 101, 0.12)",
              border: "1px solid rgba(196, 162, 101, 0.18)",
            }}
          >
            <Sparkles size={13} style={{ color: "var(--color-velora-gold)" }} />
          </div>
          <h2
            className="text-sm font-semibold tracking-wide font-[family-name:var(--font-display)]"
            style={{ color: "var(--color-velora-text)" }}
          >
            AI-Powered Icebreakers
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => scroll("left")}
            className="network-icon-btn"
            aria-label="Scroll left"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            className="network-icon-btn"
            aria-label="Scroll right"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide snap-x snap-mandatory"
      >
        {ICEBREAKER_CARDS.map((card, i) => (
          <motion.div
            key={card.id}
            className={`
              snap-start shrink-0 w-[270px] rounded-[20px] p-4
              border border-white/[0.08] bg-gradient-to-br ${card.gradient}
              backdrop-blur-xl relative overflow-hidden
            `}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.5,
              delay: i * 0.1,
              ease: PREMIUM_EASE,
            }}
            whileHover={{ y: -3, scale: 1.01 }}
          >
            {/* Subtle shimmer overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(135deg, rgba(196, 162, 101, 0.04) 0%, transparent 50%, rgba(196, 162, 101, 0.02) 100%)",
              }}
            />

            {/* Profile snippet */}
            <div className="relative flex items-start gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                style={{
                  background: "linear-gradient(135deg, rgba(196, 162, 101, 0.2), rgba(20, 19, 16, 0.8))",
                  border: "1px solid rgba(196, 162, 101, 0.25)",
                  color: "var(--color-velora-gold-light)",
                }}
              >
                {card.initials}
              </div>
              <div className="min-w-0">
                <div
                  className="text-[10px] font-semibold uppercase tracking-[0.14em] mb-0.5"
                  style={{ color: "var(--color-velora-gold)" }}
                >
                  Potential Connect
                </div>
                <h3
                  className="text-sm font-semibold truncate font-[family-name:var(--font-display)]"
                  style={{ color: "var(--color-velora-text)" }}
                >
                  {card.name}
                </h3>
                <p
                  className="text-[11px] truncate"
                  style={{ color: "var(--color-velora-text-secondary)" }}
                >
                  {card.title} · {card.company}
                </p>
              </div>
            </div>

            {/* Common Ground — gold-outlined box */}
            <div
              className="rounded-xl p-3 mb-3"
              style={{
                border: "1px solid rgba(196, 162, 101, 0.3)",
                background: "rgba(196, 162, 101, 0.06)",
              }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Users size={11} style={{ color: "var(--color-velora-gold)" }} />
                <span
                  className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                  style={{ color: "var(--color-velora-gold)" }}
                >
                  Common Ground
                </span>
              </div>
              <p
                className="text-xs font-medium"
                style={{ color: "var(--color-velora-text-secondary)" }}
              >
                {card.commonGround}
                {card.mutualContacts && (
                  <span style={{ color: "var(--color-velora-text-muted)" }}>
                    {" "}({card.mutualContacts} Mutual Contact{card.mutualContacts > 1 ? "s" : ""})
                  </span>
                )}
              </p>
            </div>

            {/* AI icebreaker */}
            <div className="flex items-start gap-2">
              <MessageSquare size={12} className="shrink-0 mt-0.5" style={{ color: "var(--color-velora-text-muted)" }} />
              <p
                className="text-[11px] italic leading-relaxed"
                style={{ color: "var(--color-velora-text-muted)" }}
              >
                {card.icebreaker}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
