"use client";
import { logger } from "@/lib/logger";


import { motion } from "framer-motion";
import { AlertTriangle, Loader2, ArrowRight, LogIn } from "lucide-react";
import { FadeUp, ScaleIn } from "@/components/features/motion/animations";
import { useAuth } from "@/providers/AuthProvider";
import { isPopupBlockedErrorCode } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";

interface WelcomeScreenProps {
  onSuccess: () => void;
}

export function WelcomeScreen({ onSuccess }: WelcomeScreenProps) {
  const { t } = useTranslation();
  const {
    signInWithGoogle,
    isSigningIn,
    error: authError,
    errorCode,
    clearError,
  } = useAuth();

  const handleCreateIdentity = async () => {
    clearError();

    try {
      await signInWithGoogle();
      onSuccess();
    } catch (err: unknown) {
      logger.error("Auth error:", err);
    }
  };

  const error = authError;
  const isPopupBlocked = isPopupBlockedErrorCode(errorCode);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 flex flex-col justify-between bg-velora-black overflow-y-auto"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-velora-gold/10 via-velora-black to-velora-black" />
        <div className="welcome-gold-field" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-8">
        <ScaleIn delay={0.2}>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-velora-gold/20 to-transparent border border-velora-gold/30 flex items-center justify-center mb-8 mx-auto shadow-[0_0_12px_color-mix(in srgb, var(--color-velora-gold) 15%, transparent)]">
            <span className="text-display text-3xl font-bold text-velora-gold tracking-tighter">V</span>
          </div>
        </ScaleIn>

        <FadeUp delay={0.4}>
          <div className="text-center mb-2">
            <h1 className="text-display text-4xl text-velora-text tracking-tight mb-4">
              {t("welcome_heading")} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-velora-gold via-velora-gold-light to-velora-gold">
                {t("welcome_heading_highlight")}
              </span>
            </h1>
            <p className="text-velora-text-muted/80 text-sm max-w-[260px] mx-auto leading-relaxed">
              {t("welcome_subheading")}
            </p>
          </div>
        </FadeUp>
      </div>

      <div className="relative z-10 w-full p-6 pb-safe">
        <FadeUp delay={0.6}>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-2xl">
            {error && (
              <div
                role="alert"
                className="mb-4 rounded-xl border border-velora-rose/25 bg-velora-rose/10 p-3 text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-velora-rose/15">
                    <AlertTriangle size={14} className="text-velora-rose" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-velora-text">
                      {isPopupBlocked ? t("welcome_error_blocked") : t("welcome_error_failed")}
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-velora-text-muted">
                      {error}
                    </p>
                    {isPopupBlocked && (
                      <button
                        type="button"
                        onClick={handleCreateIdentity}
                        disabled={isSigningIn}
                        className="mt-3 h-8 rounded-lg border border-velora-gold/30 px-3 text-[11px] font-medium text-velora-gold disabled:opacity-60"
                      >
                        {t("welcome_retry")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleCreateIdentity}
              disabled={isSigningIn}
              className="relative w-full h-12 flex items-center justify-center gap-2 bg-velora-gold text-velora-black rounded-xl font-medium tracking-wide shadow-[0_0_10px_color-mix(in srgb, var(--color-velora-gold) 24%, transparent)] transition-colors duration-300 disabled:opacity-70 disabled:cursor-not-allowed group overflow-hidden"
            >
              <div className="absolute inset-y-0 left-0 w-1/3 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:animate-gold-scan" />
              {isSigningIn ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <LogIn size={16} className="text-velora-black" />
                  <span>{t("welcome_cta")}</span>
                  <ArrowRight size={16} className="text-velora-black/80" />
                </>
              )}
            </button>

            <div className="mt-4 text-center">
              <p className="text-[10px] text-velora-text-muted/50 leading-relaxed px-4">
                {t("welcome_terms")}
              </p>
            </div>
          </div>
        </FadeUp>
      </div>
    </motion.div>
  );
}
