"use client";

import { GlassCard, GoldBadge } from "@/components/ui";
import { FadeUp } from "@/components/motion/animations";
import {
  QRGenerator,
  NFCPrompt,
  ShareActions,
  ShareLinkPreview,
} from "@/components/share";
import { useTranslation } from "@/lib/i18n";
import { useProfile } from "@/hooks/useProfile";
import { getProfileUrl, getProfileShortUrl } from "@/hooks/useSharing";
import { Crown, Wallet } from "lucide-react";

/* ═══════════════════════════════════════════════════
   VELORA — Share Hub
   WhatsApp-first · QR · NFC · Link sharing
   ═══════════════════════════════════════════════════ */

export function ShareScreen() {
  const { profile, isProfileReady } = useProfile();
  const { t } = useTranslation(profile?.locale || "fr");
  const profileUrl = getProfileUrl(profile?.username || "");

  if (!isProfileReady || !profile) return null;

  return (
    <div className="min-h-screen bg-velora-black safe-bottom">
      {/* Header */}
      <div className="px-5 pt-14 pb-3">
        <FadeUp>
          <div className="text-center">
            <div className="text-caption text-velora-gold mb-1">
              {t("share_identity")}
            </div>
            <h1 className="text-display text-2xl text-velora-text">
              {t("share_hub")}
            </h1>
          </div>
        </FadeUp>
      </div>

      {/* QR Code — real profile URL */}
      <div className="section">
        <QRGenerator
          url={profileUrl}
          name={profile?.fullName || "VELORA User"}
        />
      </div>

      {/* WhatsApp + Quick share */}
      <ShareActions />

      {/* NFC */}
      <div className="section">
        <NFCPrompt />
      </div>

      {/* Link preview */}
      <ShareLinkPreview />

      {/* Wallet support */}
      <div className="section py-4">
        <FadeUp delay={0.9}>
          <GlassCard className="p-4 flex items-center gap-3" hover={false}>
            <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-velora-surface flex items-center justify-center">
              <Wallet size={18} className="text-velora-text-muted" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-velora-text font-[family-name:var(--font-display)]">
                {t("add_wallet")}
              </div>
              <div className="text-[10px] text-velora-text-muted mt-0.5">
                Apple Wallet &amp; Google Wallet
              </div>
            </div>
            <GoldBadge variant="premium">
              <Crown size={9} />
              {t("soon")}
            </GoldBadge>
          </GlassCard>
        </FadeUp>
      </div>
    </div>
  );
}
