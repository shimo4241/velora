"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PREMIUM_EASE } from "@/components/motion/animations";
import { ChevronLeft, ChevronRight, Sparkles, Users, MessageSquare } from "lucide-react";
import type { VeloraProfile } from "@/types";

/* ═══════════════════════════════════════════════════
   VELORA — Dynamic AI-Powered Icebreakers Carousel
   
   Generates personalized connecting prompts dynamically
   for profiles discovered nearby, with navigation.
   ═══════════════════════════════════════════════════ */

interface IcebreakersCarouselProps {
  users?: VeloraProfile[];
  loading?: boolean;
}

export function IcebreakersCarousel({ users = [], loading = false }: IcebreakersCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 280;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  const cards = users.map((user, i) => {
    const initials = user.fullName
      ?.split(" ")
      ?.map((n) => n[0])
      ?.slice(0, 2)
      ?.join("")
      ?.toUpperCase() || "U";

    const gradients = [
      "from-emerald-950/40 to-emerald-900/10 border-emerald-500/10",
      "from-blue-950/40 to-blue-900/10 border-blue-500/10",
      "from-violet-950/40 to-violet-900/10 border-violet-500/10",
      "from-amber-950/40 to-amber-900/10 border-amber-500/10",
    ];
    const gradient = gradients[i % gradients.length];

    let commonGround = "Collaboration & Innovation";
    if (user.industry) {
      commonGround = `${user.industry}`;
    } else if (user.skills && user.skills.length > 0) {
      commonGround = `Intérêt : ${user.skills.slice(0, 2).join(", ")}`;
    }

    let icebreaker = `"Ravi de vous croiser ! Votre parcours est passionnant, j'aimerais beaucoup échanger avec vous."`;
    if (user.industry) {
      icebreaker = `"Bonjour ! J'ai vu que vous évoluez dans le secteur ${user.industry}. Seriez-vous ouvert à échanger sur les tendances actuelles ?"`;
    } else if (user.title) {
      icebreaker = `"Bonjour ! Votre rôle en tant que ${user.title} a l'air passionnant. Est-ce qu'on pourrait en discuter brièvement ?"`;
    }

    return {
      id: user.id,
      name: user.fullName || "Membre Velora",
      username: user.username,
      title: user.title || "Professionnel",
      company: user.company || "Velora Network",
      avatar: user.avatarUrl || user.photoURL || undefined,
      initials,
      commonGround,
      icebreaker,
      gradient,
    };
  });

  return (
    <motion.section
      className="relative pt-6"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: PREMIUM_EASE }}
    >
      {/* Section header */}
      <div className="px-5 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center w-7 h-7 rounded-lg"
            style={{
              background: "color-mix(in srgb, var(--color-velora-gold) 12%, transparent)",
              border: "1px solid color-mix(in srgb, var(--color-velora-gold) 18%, transparent)",
            }}
          >
            <Sparkles size={13} style={{ color: "var(--color-velora-gold)" }} />
          </div>
          <h2
            className="text-sm font-semibold tracking-wide font-[family-name:var(--font-display)]"
            style={{ color: "var(--color-velora-text)" }}
          >
            Icebreakers IA
          </h2>
        </div>

        {users.length > 1 && (
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
        )}
      </div>

      {/* Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide snap-x snap-mandatory"
      >
        {loading ? (
          // Skeleton loader
          [1, 2].map((n) => (
            <div
              key={n}
              className="snap-start shrink-0 w-[270px] rounded-[20px] p-4 border border-white/5 bg-white/[0.02] animate-pulse h-36 flex flex-col justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5" />
                <div className="flex-1 space-y-2">
                  <div className="h-2.5 w-1/2 bg-white/10 rounded" />
                  <div className="h-3 w-3/4 bg-white/10 rounded" />
                </div>
              </div>
              <div className="h-10 w-full bg-white/5 rounded-xl" />
            </div>
          ))
        ) : cards.length === 0 ? (
          // Empty State
          <div
            className="w-full flex flex-col items-center justify-center py-6 text-center text-velora-text-muted border border-white/5 bg-white/[0.02] rounded-2xl mx-5"
          >
            <Users size={20} className="text-white/20 mb-2" />
            <p className="text-xs">Aucun utilisateur à proximité pour générer d&apos;icebreaker.</p>
          </div>
        ) : (
          cards.map((card, i) => (
            <motion.div
              key={card.id}
              className={`
                snap-start shrink-0 w-[270px] rounded-[20px] p-4
                border relative overflow-hidden cursor-pointer bg-velora-dark/95 ${card.gradient}
              `}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: i * 0.08,
                ease: PREMIUM_EASE,
              }}
              whileHover={{ y: -3, scale: 1.01 }}
              onClick={() => {
                if (card.username) {
                  router.push(`/u/${card.username}`);
                } else {
                  router.push(`/p/${card.id}`);
                }
              }}
            >
              {/* Shimmer overlay */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "linear-gradient(135deg, color-mix(in srgb, var(--color-velora-gold) 3%, transparent) 0%, transparent 50%)",
                }}
              />

              {/* Profile snippet */}
              <div className="relative flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-black/60 border border-white/10 flex items-center justify-center">
                  {card.avatar ? (
                    <img src={card.avatar} alt={card.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-velora-gold">{card.initials}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div
                    className="text-[10px] font-semibold uppercase tracking-[0.14em] mb-0.5"
                    style={{ color: "var(--color-velora-gold)" }}
                  >
                    Rencontre Potentielle
                  </div>
                  <h3
                    className="text-sm font-semibold truncate font-[family-name:var(--font-display)] text-velora-text"
                  >
                    {card.name}
                  </h3>
                  <p
                    className="text-[11px] truncate text-velora-text-muted"
                  >
                    {card.title} · {card.company}
                  </p>
                </div>
              </div>

              {/* Common Ground — gold-outlined box */}
              <div
                className="rounded-xl p-3 mb-3"
                style={{
                  border: "1px solid color-mix(in srgb, var(--color-velora-gold) 25%, transparent)",
                  background: "color-mix(in srgb, var(--color-velora-gold) 5%, transparent)",
                }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Users size={11} style={{ color: "var(--color-velora-gold)" }} />
                  <span
                    className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                    style={{ color: "var(--color-velora-gold)" }}
                  >
                    Point Commun
                  </span>
                </div>
                <p
                  className="text-xs font-medium text-velora-text-secondary"
                >
                  {card.commonGround}
                </p>
              </div>

              {/* AI icebreaker */}
              <div className="flex items-start gap-2">
                <MessageSquare size={12} className="shrink-0 mt-0.5 text-velora-text-muted" />
                <p
                  className="text-[11px] italic leading-relaxed text-velora-text-muted"
                >
                  {card.icebreaker}
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.section>
  );
}
