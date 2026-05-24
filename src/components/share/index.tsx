"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
import type { VeloraProfile } from "@/types";

type NDEFWriter = {
  write: (message: { records: Array<{ recordType: "url"; data: string }> }) => Promise<void>;
};

type WebNFCWindow = Window &
  typeof globalThis & {
    NDEFReader?: new () => NDEFWriter;
  };

function escapeVCard(value?: string) {
  return (value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function downloadVCard(profile: VeloraProfile) {
  const name = profile.fullName || "VELORA Contact";
  const vcard = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${escapeVCard(name)}`,
    `ORG:${escapeVCard(profile.company || "VELORA")}`,
    `TITLE:${escapeVCard(profile.title)}`,
    profile.email ? `EMAIL:${escapeVCard(profile.email)}` : "",
    profile.phone || profile.whatsapp ? `TEL:${escapeVCard(profile.phone || profile.whatsapp)}` : "",
    profile.website ? `URL:${escapeVCard(profile.website)}` : "",
    `NOTE:${escapeVCard(`VELORA profile: ${getProfileUrl(profile.username)}`)}`,
    "END:VCARD",
  ].filter(Boolean).join("\n");
  const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = `${name.replace(/[^\w-]+/g, "-").toLowerCase()}.vcf`;
  link.click();
  URL.revokeObjectURL(href);
}

/* ═══════════════════════════════════════════════════
   VELORA — Share Components
   WhatsApp-first · QR · NFC · Link sharing
   ═══════════════════════════════════════════════════ */

/* ── QR Code Generator with Premium Gold Frame ── */
export function QRGenerator({
  url,
  name = "VELORA User",
}: {
  url?: string;
  name?: string;
}) {
  const { profile, isProfileReady } = useProfile();
  const { t } = useTranslation(profile?.locale || "fr");

  if (!isProfileReady || !profile) return null;

  const profileUrl = url || getProfileUrl(profile.username);

  return (
    <FadeUp delay={0.2}>
      <GlassCard className="relative overflow-hidden p-5" gold hover>
        <div className="glow-layer pointer-events-none absolute -right-10 -top-14 h-36 w-36 rounded-full bg-velora-gold/8 blur-lg" />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-[linear-gradient(115deg,transparent,rgba(255,255,255,0.08),transparent)] animate-gold-scan" />

        <div className="relative mb-5 flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-velora-gold/80">
              VELORA business card
            </div>
            <div className="mt-1 text-heading text-lg text-velora-text">{name}</div>
            <div className="mt-0.5 text-xs text-velora-text-muted">
              {profile.title || "Premium network profile"}
            </div>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-velora-gold/25 bg-velora-gold-dim text-sm font-semibold text-velora-gold">
            {profile.avatarUrl ? (
              <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${profile.avatarUrl})` }} />
            ) : (
              name.split(" ").map((part) => part[0]).join("").slice(0, 2) || "V"
            )}
          </div>
        </div>
        {/* Gold corner frame */}
        <div className="relative flex justify-center">
          <div className="absolute -inset-3">
            <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-velora-gold/50 rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-velora-gold/50 rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-velora-gold/50 rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-velora-gold/50 rounded-br-lg" />
          </div>

          <ScaleIn delay={0.35}>
            <motion.div
              className="relative overflow-hidden rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.22)]"
              id="velora-qr-container"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-transparent via-velora-gold/20 to-transparent animate-gold-scan" />
              <QRCodeSVG
                value={profileUrl}
                size={180}
                bgColor="#FFFFFF"
                fgColor="#0A0A0A"
                level="H"
                includeMargin={false}
              />
            </motion.div>
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
            {profileUrl.replace("https://", "")}
          </div>
        </motion.div>

        {/* Download QR + vCard export */}
        <FadeUp delay={0.7}>
          <div className="mt-4 grid w-full grid-cols-2 gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const container = document.getElementById("velora-qr-container");
                if (!container) return;
                const svg = container.querySelector("svg");
                if (!svg) return;
                const svgData = new XMLSerializer().serializeToString(svg);
                const canvas = document.createElement("canvas");
                canvas.width = 360;
                canvas.height = 360;
                const ctx = canvas.getContext("2d");
                if (!ctx) return;
                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect(0, 0, 360, 360);
                const img = new Image();
                img.onload = () => {
                  ctx.drawImage(img, 0, 0, 360, 360);
                  const link = document.createElement("a");
                  link.download = `velora-qr-${name.replace(/\s+/g, "-").toLowerCase()}.png`;
                  link.href = canvas.toDataURL("image/png");
                  link.click();
                };
                img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
              }}
              className="haptic-press flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-velora-text-secondary"
            >
              <Download size={12} />
              {t("download_qr")}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => downloadVCard(profile)}
              className="haptic-press flex items-center justify-center gap-2 rounded-full border border-velora-gold/25 bg-velora-gold/10 px-3 py-2 text-xs font-semibold text-velora-gold"
            >
              <Smartphone size={12} />
              Save Contact
            </motion.button>
          </div>
        </FadeUp>
      </GlassCard>
    </FadeUp>
  );
}

/* ── NFC Tap Prompt — Calm, not aggressive ── */
export function NFCPrompt() {
  const { profile, isProfileReady } = useProfile();
  const { t } = useTranslation(profile?.locale || "fr");
  const [nfcStatus, setNfcStatus] = useState<"idle" | "writing" | "success" | "error">("idle");
  const [nfcError, setNfcError] = useState("");

  if (!isProfileReady || !profile) return null;

  const handleNFCTap = async () => {
    try {
      const nfcWindow = window as WebNFCWindow;
      if (nfcWindow.NDEFReader) {
        setNfcStatus("writing");
        const ndef = new nfcWindow.NDEFReader();
        await ndef.write({
          records: [{ recordType: "url", data: getProfileUrl(profile.username) }]
        });
        setNfcStatus("success");
        setTimeout(() => setNfcStatus("idle"), 3000);
      } else {
        setNfcStatus("error");
        setNfcError("NFC sharing is unsupported on this device or browser.");
        setTimeout(() => setNfcStatus("idle"), 3000);
      }
    } catch (error: unknown) {
      setNfcStatus("error");
      setNfcError(error instanceof Error ? error.message : "Failed to write to NFC tag.");
      setTimeout(() => setNfcStatus("idle"), 3000);
    }
  };

  return (
    <FadeUp delay={0.4}>
      <GlassCard className="p-5 flex flex-col items-center text-center" hover>
        {/* NFC animation — subtle ripples */}
        <motion.button
          type="button"
          className="relative mb-3.5 flex h-20 w-20 items-center justify-center"
          onClick={handleNFCTap}
          whileTap={{ scale: 0.94 }}
          aria-label="Write profile link to NFC tag"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={`absolute inset-0 rounded-full border ${nfcStatus === "success" ? "border-velora-emerald/25" : "border-velora-gold/15"}`}
              animate={{
                scale: [0.6, 2],
                opacity: nfcStatus === "success" ? [0.65, 0] : [0.4, 0],
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
            className={`relative z-10 flex h-14 w-14 items-center justify-center rounded-xl ${nfcStatus === "success" ? "border border-velora-emerald/25 bg-velora-emerald/12" : "glass-gold"}`}
            animate={{ scale: [1, nfcStatus === "writing" ? 1.1 : 1.03, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            {nfcStatus === "success" ? (
              <Check size={24} className="text-velora-emerald" />
            ) : (
              <Nfc size={24} className="text-velora-gold" />
            )}
          </motion.div>
        </motion.button>

        <h3 className="text-heading text-sm text-velora-text">
          {t("nfc_tap")}
        </h3>
        <p className="text-[11px] text-velora-text-muted mt-1 max-w-[200px] leading-relaxed">
          {t("nfc_description")}
        </p>
        
        {nfcStatus === "error" && (
          <p className="text-[10px] text-red-400 mt-2">{nfcError}</p>
        )}
        {nfcStatus === "success" && (
          <p className="text-[10px] text-velora-emerald mt-2">Écriture NFC réussie !</p>
        )}

        <div className="flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-velora-gold/5 border border-velora-gold/10">
          <Wifi size={10} className="text-velora-gold" />
          <span className="text-[9px] text-velora-gold font-medium tracking-wider uppercase">
            {nfcStatus === "writing" ? "Writing..." : `NFC ${t("ready")}`}
          </span>
        </div>
      </GlassCard>
    </FadeUp>
  );
}

/* ── WhatsApp Hero + Share Actions ── */
export function ShareActions() {
  const [copied, setCopied] = useState(false);
  const [shareSuccess, setShareSuccess] = useState("");
  const { profile, isProfileReady } = useProfile();
  const { shareViaWhatsApp, copyProfileLink, trackShare } = useSharing();
  const { t } = useTranslation(profile?.locale || "fr");

  if (!isProfileReady || !profile) return null;

  const celebrateShare = (label: string) => {
    setShareSuccess(label);
    setTimeout(() => setShareSuccess(""), 1800);
  };

  const handleWhatsApp = () => {
    shareViaWhatsApp(profile);
    celebrateShare("WhatsApp opened");
  };

  const handleCopy = () => {
    copyProfileLink(profile?.username || "");
    setCopied(true);
    celebrateShare("Link copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWebShare = async () => {
    const url = getProfileUrl(profile.username);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile.fullName} — VELORA`,
          text: `${profile.fullName} · ${profile.title}`,
          url,
        });
        await trackShare("link");
        celebrateShare("Profile shared");
      } catch {
        // User cancelled share
      }
    } else {
      // Fallback to copy
      handleCopy();
    }
  };

  const handleSMS = () => {
    const url = getProfileUrl(profile.username);
    const body = encodeURIComponent(`Découvrez mon profil VELORA: ${url}`);
    window.open(`sms:?body=${body}`, "_self");
    celebrateShare("SMS ready");
  };

  return (
    <div className="relative px-5 py-4">
      <AnimatePresence>
        {shareSuccess && (
          <motion.div
            className="pointer-events-none absolute inset-x-5 -top-2 z-20 flex justify-center"
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
          >
            <div className="flex items-center gap-2 rounded-full border border-velora-emerald/20 bg-velora-emerald/12 px-4 py-2 text-xs font-semibold text-velora-emerald shadow-[0_4px_12px_rgba(107,191,138,0.06)] backdrop-blur-md">
              <Check size={13} />
              {shareSuccess}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* WhatsApp Hero CTA — now functional */}
      <FadeUp delay={0.55}>
        <motion.button
          onClick={handleWhatsApp}
          whileTap={{ scale: 0.97 }}
          className="haptic-press w-full flex items-center justify-center gap-3 py-4 rounded-[var(--radius-card)] bg-velora-whatsapp/12 border border-velora-whatsapp/20 mb-3"
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
            label: "Share",
            color: "text-velora-blue",
            bg: "bg-velora-blue/10",
            border: "border-velora-blue/12",
            onClick: handleWebShare,
          },
          {
            icon: Smartphone,
            label: "SMS",
            color: "text-cyan-400",
            bg: "bg-cyan-500/8",
            border: "border-cyan-500/12",
            onClick: handleSMS,
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
