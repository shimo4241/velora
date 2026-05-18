"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, ArrowRight, Loader2, Shield, ChevronLeft } from "lucide-react";
import { GlassCard, GoldButton } from "@/components/ui";
import { FadeUp, ScaleIn } from "@/components/motion/animations";
import { setupRecaptcha, sendOTP, verifyOTP, formatMoroccanPhone } from "@/lib/auth";

/* ═══════════════════════════════════════════════════
   VELORA — Login Screen
   Phone OTP · Moroccan luxury · Cinematic flow
   ═══════════════════════════════════════════════════ */

type LoginStep = "phone" | "otp";

export function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [step, setStep] = useState<LoginStep>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const recaptchaRef = useRef<HTMLDivElement>(null);

  /* ── Send OTP ── */
  const handleSendOTP = async () => {
    if (phone.length < 9) return;
    setLoading(true);
    setError("");
    try {
      setupRecaptcha("recaptcha-container");
      await sendOTP(phone);
      setStep("otp");
    } catch (err) {
      setError("Impossible d'envoyer le code. Vérifiez votre numéro.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ── Verify OTP ── */
  const handleVerifyOTP = async () => {
    if (otp.length !== 6) return;
    setLoading(true);
    setError("");
    try {
      await verifyOTP(otp);
      onSuccess();
    } catch (err) {
      setError("Code incorrect. Réessayez.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-velora-black px-6"
    >
      {/* Logo */}
      <FadeUp>
        <div className="text-center mb-10">
          <div className="text-display text-3xl text-velora-text tracking-wider mb-2">
            VELORA
          </div>
          <div className="text-caption text-velora-gold text-xs tracking-[0.3em]">
            YOUR IDENTITY, ELEVATED
          </div>
        </div>
      </FadeUp>

      <AnimatePresence mode="wait">
        {step === "phone" ? (
          <motion.div
            key="phone"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-sm"
          >
            <ScaleIn delay={0.1}>
              <GlassCard className="p-6" hover={false}>
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-velora-gold-dim flex items-center justify-center">
                    <Phone size={16} className="text-velora-gold" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-velora-text font-[family-name:var(--font-display)]">
                      Connexion
                    </div>
                    <div className="text-[10px] text-velora-text-muted">
                      Entrez votre numéro de téléphone
                    </div>
                  </div>
                </div>

                {/* Phone input */}
                <div className="flex items-center gap-2 p-3 rounded-[var(--radius-sm)] bg-velora-surface border border-velora-border/50 mb-4">
                  <span className="text-sm text-velora-gold font-mono font-medium flex-shrink-0">
                    +212
                  </span>
                  <div className="w-px h-5 bg-velora-border/50" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="6XX XXX XXX"
                    className="flex-1 bg-transparent text-sm text-velora-text placeholder:text-velora-text-muted/40 outline-none font-mono"
                    maxLength={9}
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="text-[11px] text-velora-rose mb-3 px-1">
                    {error}
                  </div>
                )}

                <GoldButton
                  onClick={handleSendOTP}
                  disabled={phone.length < 9 || loading}
                  className="w-full"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      Recevoir le code
                      <ArrowRight size={14} />
                    </>
                  )}
                </GoldButton>

                {/* TEST MODE ONLY - Beta Development Bypass */}
                {process.env.NODE_ENV !== "production" && (
                  <button
                    onClick={() => {
                      setPhone("612345678"); // Needs to match Firebase Console Test Numbers: +212612345678
                    }}
                    className="w-full mt-3 py-2 text-[10px] text-velora-gold/60 uppercase tracking-widest font-semibold border border-velora-gold/20 rounded-md hover:bg-velora-gold/5 transition-colors"
                  >
                    Use Test Number
                  </button>
                )}

                <div className="flex items-center gap-1.5 justify-center mt-4">
                  <Shield size={10} className="text-velora-text-muted/40" />
                  <span className="text-[9px] text-velora-text-muted/40">
                    Connexion sécurisée par Firebase
                  </span>
                </div>
              </GlassCard>
            </ScaleIn>

            {/* Preview info */}
            <FadeUp delay={0.3}>
              <div className="text-center mt-6">
                <div className="text-[10px] text-velora-text-muted/30">
                  {formatMoroccanPhone(phone || "6XXXXXXXX")}
                </div>
              </div>
            </FadeUp>
          </motion.div>
        ) : (
          <motion.div
            key="otp"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-sm"
          >
            <ScaleIn delay={0.1}>
              <GlassCard className="p-6" hover={false}>
                <button
                  onClick={() => { setStep("phone"); setOtp(""); setError(""); }}
                  className="flex items-center gap-1 text-[11px] text-velora-text-muted mb-4"
                >
                  <ChevronLeft size={12} />
                  Modifier le numéro
                </button>

                <div className="text-sm font-semibold text-velora-text font-[family-name:var(--font-display)] mb-1">
                  Vérification
                </div>
                <div className="text-[11px] text-velora-text-muted mb-5">
                  Code envoyé au {formatMoroccanPhone(phone)}
                </div>

                {/* OTP input */}
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="• • • • • •"
                  className="w-full text-center text-2xl tracking-[0.5em] font-mono p-4 rounded-[var(--radius-sm)] bg-velora-surface border border-velora-border/50 text-velora-gold placeholder:text-velora-text-muted/20 outline-none mb-4"
                  autoFocus
                />

                {error && (
                  <div className="text-[11px] text-velora-rose mb-3 px-1">
                    {error}
                  </div>
                )}

                <GoldButton
                  onClick={handleVerifyOTP}
                  disabled={otp.length !== 6 || loading}
                  className="w-full"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      Vérifier
                      <ArrowRight size={14} />
                    </>
                  )}
                </GoldButton>

                {/* TEST MODE ONLY - Beta Development Bypass */}
                {process.env.NODE_ENV !== "production" && (
                  <button
                    onClick={() => setOtp("123456")}
                    className="w-full mt-3 py-2 text-[10px] text-velora-gold/60 uppercase tracking-widest font-semibold border border-velora-gold/20 rounded-md hover:bg-velora-gold/5 transition-colors"
                  >
                    Fill Test OTP (123456)
                  </button>
                )}
              </GlassCard>
            </ScaleIn>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invisible reCAPTCHA container */}
      <div id="recaptcha-container" ref={recaptchaRef} />
    </motion.div>
  );
}
