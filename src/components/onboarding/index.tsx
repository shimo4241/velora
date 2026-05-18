"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GoldButton } from "@/components/ui";
import { APP_CONFIG } from "@/lib/constants";
import {
  Sparkles,
  ChevronRight,
  Nfc,
  QrCode,
  Crown,
} from "lucide-react";

/* ═══════════════════════════════════════════════════
   VELORA — Onboarding Flow
   Splash → 3-slide onboarding → App entry
   ═══════════════════════════════════════════════════ */

/* ── Splash Screen ── */
export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, APP_CONFIG.splashDuration);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 bg-velora-black flex flex-col items-center justify-center z-50"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7 }}
    >
      {/* Ambient glow */}
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(196,162,101,0.06) 0%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85, filter: "blur(16px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10"
      >
        <h1 className="text-display text-5xl gold-text tracking-[0.15em]">
          VELORA
        </h1>
      </motion.div>

      {/* Tagline */}
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="text-caption text-velora-text-muted mt-4 tracking-[0.2em] relative z-10"
      >
        YOUR IDENTITY, ELEVATED
      </motion.p>

      {/* Loading bar */}
      <motion.div
        className="absolute bottom-20 flex flex-col items-center gap-3"
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
const slides = [
  {
    icon: Nfc,
    title: "Tap & Share",
    subtitle: "Your phone is your business card",
    description:
      "Share your professional identity instantly with a simple NFC tap. No apps needed for the receiver.",
    gradient: "from-amber-900/20 via-transparent to-transparent",
  },
  {
    icon: QrCode,
    title: "Scan & Connect",
    subtitle: "Every interaction matters",
    description:
      "Generate stunning QR codes that open a cinematic profile experience. Make every first impression unforgettable.",
    gradient: "from-blue-900/20 via-transparent to-transparent",
  },
  {
    icon: Crown,
    title: "Elevate Your Identity",
    subtitle: "Premium professional presence",
    description:
      "Build trust and prestige in the luxury business ecosystem. Your identity, elevated.",
    gradient: "from-velora-gold/10 via-transparent to-transparent",
  },
];

export function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [currentSlide, setCurrentSlide] = useState(0);

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
              Enter VELORA
            </>
          ) : (
            <>
              Continue
              <ChevronRight size={16} />
            </>
          )}
        </GoldButton>

        {currentSlide < slides.length - 1 && (
          <button
            onClick={onComplete}
            className="w-full text-center text-xs text-velora-text-muted mt-4 py-2"
          >
            Skip
          </button>
        )}
      </div>
    </motion.div>
  );
}
