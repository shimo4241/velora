"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
  Nfc,
  Link2,
  Share2,
  MessageCircle,
  Copy,
  Check,
  Smartphone,
  Wifi,
  Download,
  QrCode,
} from "lucide-react";
import { GlassCard, GoldButton } from "../ui";
import { FadeUp, ScaleIn, StaggerChildren, StaggerItem } from "../motion/animations";
import { useTranslation } from "@/lib/i18n";
import { useProfile } from "@/hooks/useProfile";
import { useSharing, getProfileUrl, getProfileShortUrl } from "@/hooks/useSharing";

/* ═══════════════════════════════════════════════════
   VELORA — Share Components
   WhatsApp-first · QR · NFC · Link sharing
   ═══════════════════════════════════════════════════ */

/* ── QR Code Generator with Premium Gold Frame ── */
export function QRGenerator({
  url = "https://velora.app",
  name = "VELORA User",
}: {
  url?: string;
  name?: string;
}) {
  const { profile, isProfileReady } = useProfile();
  const { t } = useTranslation(profile?.locale || "fr");

  if (!isProfileReady || !profile) return null;

  return (
    <FadeUp delay={0.2}>
      <GlassCard className="p-6 flex flex-col items-center" gold hover={false}>
        {/* Gold corner frame */}
        <div className="relative">
          <div className="absolute -inset-3">
            <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-velora-gold/50 rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-velora-gold/50 rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-velora-gold/50 rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-velora-gold/50 rounded-br-lg" />
          </div>

          <ScaleIn delay={0.35}>
            <div className="bg-white rounded-2xl p-4">
              <QRCodeSVG
                value={url}
                size={180}
                bgColor="#FFFFFF"
                fgColor="#0A0A0A"
                level="H"
                includeMargin={false}
              />
            </div>
          </ScaleIn>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="text-center mt-5"
        >
          <div className="text-sm font-semibold text-velora-text font-[family-name:var(--font-display)]">
            {name}
          </div>
          <div className="text-[11px] text-velora-text-muted mt-1 font-mono">
            {url.replace("https://", "")}
          </div>
        </motion.div>

        {/* Download QR button */}
        <FadeUp delay={0.7}>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 mt-4 px-4 py-2 rounded-full glass text-xs text-velora-text-secondary font-medium"
          >
            <Download size={12} />
            {t("download_qr")}
          </motion.button>
        </FadeUp>
      </GlassCard>
    </FadeUp>
  );
}

/* ── NFC Tap Prompt — Calm, not aggressive ── */
export function NFCPrompt() {
  const { profile, isProfileReady } = useProfile();
  const { t } = useTranslation(profile?.locale || "fr");

  if (!isProfileReady || !profile) return null;

  return (
    <FadeUp delay={0.4}>
      <GlassCard className="p-5 flex flex-col items-center text-center" hover={false}>
        {/* NFC animation — subtle ripples */}
        <div className="relative w-20 h-20 flex items-center justify-center mb-3.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-full border border-velora-gold/15"
              animate={{
                scale: [0.6, 2],
                opacity: [0.4, 0],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeOut",
                delay: i * 0.7,
              }}
            />
          ))}

          {/* Center icon */}
          <motion.div
            className="relative z-10 w-14 h-14 rounded-xl glass-gold flex items-center justify-center"
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Nfc size={24} className="text-velora-gold" />
          </motion.div>
        </div>

        <h3 className="text-heading text-sm text-velora-text">
          {t("nfc_tap")}
        </h3>
        <p className="text-[11px] text-velora-text-muted mt-1 max-w-[200px] leading-relaxed">
          {t("nfc_description")}
        </p>

        <div className="flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-velora-gold/5 border border-velora-gold/10">
          <Wifi size={10} className="text-velora-gold" />
          <span className="text-[9px] text-velora-gold font-medium tracking-wider uppercase">
            NFC {t("ready")}
          </span>
        </div>
      </GlassCard>
    </FadeUp>
  );
}

/* ── WhatsApp Hero + Share Actions ── */
export function ShareActions() {
  const [copied, setCopied] = useState(false);
  const { profile, isProfileReady } = useProfile();
  const { shareViaWhatsApp, copyProfileLink } = useSharing();
  const { t } = useTranslation(profile?.locale || "fr");

  if (!isProfileReady || !profile) return null;

  const handleWhatsApp = () => {
    shareViaWhatsApp(profile);
  };

  const handleCopy = () => {
    copyProfileLink(profile?.username || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="px-5 py-4">
      {/* WhatsApp Hero CTA — now functional */}
      <FadeUp delay={0.55}>
        <motion.button
          onClick={handleWhatsApp}
          whileTap={{ scale: 0.97 }}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-[var(--radius-card)] bg-velora-whatsapp/12 border border-velora-whatsapp/20 mb-3"
        >
          <MessageCircle size={20} className="text-velora-whatsapp" />
          <span className="text-sm font-semibold text-velora-whatsapp font-[family-name:var(--font-display)]">
            {t("whatsapp_share")}
          </span>
        </motion.button>
      </FadeUp>

      {/* Secondary methods */}
      <FadeUp delay={0.6}>
        <h3 className="text-heading text-sm text-velora-text mb-3 px-1">
          {t("other_methods")}
        </h3>
      </FadeUp>

      <StaggerChildren staggerDelay={0.06} delay={0.65} className="grid grid-cols-3 gap-2.5">
        {[
          {
            icon: Share2,
            label: "AirDrop",
            color: "text-velora-blue",
            bg: "bg-velora-blue/10",
            border: "border-velora-blue/12",
          },
          {
            icon: Smartphone,
            label: "SMS",
            color: "text-cyan-400",
            bg: "bg-cyan-500/8",
            border: "border-cyan-500/12",
          },
          {
            icon: copied ? Check : Copy,
            label: copied ? t("copied") : t("copy_link"),
            color: copied ? "text-velora-emerald" : "text-velora-gold",
            bg: copied ? "bg-velora-emerald/10" : "bg-velora-gold-dim",
            border: copied ? "border-velora-emerald/12" : "border-velora-gold/12",
            onClick: handleCopy,
          },
        ].map((action, i) => {
          const Icon = action.icon;
          return (
            <StaggerItem key={i}>
              <motion.button
                onClick={action.onClick}
                whileTap={{ scale: 0.95 }}
                className={`w-full ${action.bg} ${action.border} border rounded-[var(--radius-card)] px-3 py-3.5 flex flex-col items-center gap-2`}
              >
                <Icon size={18} className={action.color} />
                <span className={`text-[10px] font-medium ${action.color}`}>
                  {action.label}
                </span>
              </motion.button>
            </StaggerItem>
          );
        })}
      </StaggerChildren>
    </div>
  );
}

/* ── Share Link Preview ── */
export function ShareLinkPreview() {
  const { profile, isProfileReady } = useProfile();
  const { t } = useTranslation(profile?.locale || "fr");
  const shortUrl = getProfileShortUrl(profile?.username || "");

  if (!isProfileReady || !profile) return null;

  return (
    <FadeUp delay={0.8}>
      <div className="px-5 py-2">
        <GlassCard className="p-4 flex items-center gap-3" hover={false}>
          <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-velora-gold-dim flex items-center justify-center flex-shrink-0">
            <Link2 size={16} className="text-velora-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-velora-text-muted mb-0.5 uppercase tracking-wider">
              {t("profile_link")}
            </div>
            <div className="text-xs text-velora-text font-mono truncate">
              {shortUrl}
            </div>
          </div>
          <GoldButton variant="outline" size="sm">
            <QrCode size={13} />
          </GoldButton>
        </GlassCard>
      </div>
    </FadeUp>
  );
}
