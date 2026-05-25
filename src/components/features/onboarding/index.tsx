"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GoldButton } from "@/components/ui";
import { APP_CONFIG } from "@/constants";
import { useTranslation } from "@/lib/i18n";
import {
  Sparkles,
  ChevronRight,
  Nfc,
  QrCode,
  Crown,
} from "lucide-react";

const splashParticles = Array.from({ length: 20 }, (_, index) => {
  const seed = index + 1;
  return {
    id: seed,
    size: 1 + (seed % 4) * 0.65,
    alpha: 0.16 + (seed % 5) * 0.07,
    left: `${(seed * 37) % 100}%`,
    top: `${(seed * 61) % 100}%`,
    y: -(34 + (seed * 17) % 76),
    x: ((seed * 29) % 41) - 20,
    duration: 3.2 + (seed % 5) * 0.55,
    delay: (seed % 6) * 0.42,
  };
});

/* ═══════════════════════════════════════════════════
   VELORA — Onboarding Flow
   Cinematic Splash → 3-slide onboarding → App entry
   ═══════════════════════════════════════════════════ */

/* ── Cinematic Splash Screen ── */
export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const { t } = useTranslation();

  useEffect(() => {
    const timer = setTimeout(onComplete, APP_CONFIG.splashDuration);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 bg-velora-black flex flex-col items-center justify-center z-50 overflow-hidden"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7 }}
    >
      {/* Ambient gold glow — large breathing orb */}
      <motion.div
        className="absolute w-[420px] h-[420px] rounded-full opacity-50 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--color-velora-gold) 12%, transparent) 0%, color-mix(in srgb, var(--color-velora-gold) 4%, transparent) 40%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Secondary warm glow */}
      <motion.div
        className="absolute w-[280px] h-[280px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--color-velora-gold-light) 8%, transparent) 0%, transparent 65%)",
        }}
        animate={{
          scale: [1.1, 1, 1.1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />

      {/* Floating gold dust particles */}
      {splashParticles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: particle.size,
            height: particle.size,
            background: `color-mix(in srgb, var(--color-velora-gold) ${Math.round(particle.alpha * 100)}%, transparent)`,
            left: particle.left,
            top: particle.top,
          }}
          animate={{
            y: [0, particle.y],
            x: [0, particle.x],
            opacity: [0, 0.7, 0],
            scale: [0.5, 1.2, 0.3],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut",
          }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 pointer-events-none"
      >
        <div className="relative">
          <h1 className="text-display text-5xl gold-reflection tracking-[0.15em]">
            VELORA
          </h1>
        </div>
      </motion.div>

      {/* Tagline — localized */}
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="text-caption text-velora-text-muted mt-4 tracking-[0.2em] relative z-10 uppercase"
      >
        {t("tagline")}
      </motion.p>

      {/* Loading bar */}
      <motion.div
        className="absolute bottom-20 flex flex-col items-center gap-3 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <div className="w-16 h-0.5 rounded-full bg-velora-surface overflow-hidden">
          <motion.div
            className="h-full rounded-full gold-gradient"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5, delay: 1.2, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Onboarding Slides ── */
const slideIcons = [Nfc, QrCode, Crown];

const slideGradients = [
  "from-amber-900/20 via-transparent to-transparent",
  "from-blue-900/20 via-transparent to-transparent",
  "from-velora-gold/10 via-transparent to-transparent",
];

export function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const { t } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      icon: slideIcons[0],
      title: t("onboarding_slide1_title"),
      subtitle: t("onboarding_slide1_subtitle"),
      description: t("onboarding_slide1_desc"),
      gradient: slideGradients[0],
    },
    {
      icon: slideIcons[1],
      title: t("onboarding_slide2_title"),
      subtitle: t("onboarding_slide2_subtitle"),
      description: t("onboarding_slide2_desc"),
      gradient: slideGradients[1],
    },
    {
      icon: slideIcons[2],
      title: t("onboarding_slide3_title"),
      subtitle: t("onboarding_slide3_subtitle"),
      description: t("onboarding_slide3_desc"),
      gradient: slideGradients[2],
    },
  ];

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-velora-black z-40 flex flex-col"
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.45 }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 flex flex-col items-center justify-center px-8"
        >
          {/* Background gradient */}
          <div
            className={`absolute inset-0 bg-gradient-to-b ${slides[currentSlide].gradient}`}
          />

          {/* Icon */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 0.7,
              delay: 0.15,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="relative z-10 w-20 h-20 rounded-3xl glass-gold flex items-center justify-center mb-8"
          >
            {(() => {
              const Icon = slides[currentSlide].icon;
              return <Icon size={36} className="text-velora-gold" />;
            })()}
          </motion.div>

          {/* Text */}
          <div className="relative z-10 text-center max-w-sm">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="text-caption text-velora-gold mb-3"
            >
              {slides[currentSlide].subtitle}
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="text-display text-3xl text-velora-text mb-4"
            >
              {slides[currentSlide].title}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              className="text-sm text-velora-text-secondary leading-relaxed"
            >
              {slides[currentSlide].description}
            </motion.p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Bottom controls */}
      <div className="relative z-10 px-8 pb-12 pt-4">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === currentSlide
                  ? "w-8 bg-velora-gold"
                  : "w-2 bg-velora-text-muted/30"
              }`}
            />
          ))}
        </div>

        <GoldButton fullWidth size="lg" onClick={nextSlide}>
          {currentSlide === slides.length - 1 ? (
            <>
              <Sparkles size={16} />
              {t("onboarding_enter")}
            </>
          ) : (
            <>
              {t("onboarding_continue")}
              <ChevronRight size={16} />
            </>
          )}
        </GoldButton>

        {currentSlide < slides.length - 1 && (
          <button
            onClick={onComplete}
            className="w-full text-center text-xs text-velora-text-muted mt-4 py-2"
          >
            {t("onboarding_skip")}
          </button>
        )}
      </div>
    </motion.div>
  );
}
