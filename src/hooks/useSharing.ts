"use client";

import { useCallback } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { logShare, trackAnalyticsEvent } from "@/lib/firestore";
import type { VeloraProfile, ConnectionMethod } from "@/types";

/* ═══════════════════════════════════════════════════
   VELORA — useSharing Hook
   WhatsApp, QR, NFC, Link sharing
   ═══════════════════════════════════════════════════ */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://velora.app";

export function getProfileUrl(username: string): string {
  return `${SITE_URL}/u/${username}`;
}

export function getProfileShortUrl(username: string): string {
  return `velora.app/u/${username}`;
}

export function useSharing() {
  const { user } = useAuth();

  /** Share via WhatsApp — opens WhatsApp with formatted message */
  const shareViaWhatsApp = useCallback(
    async (profile: VeloraProfile) => {
      const url = getProfileUrl(profile.username);
      const message = encodeURIComponent(
        `Voici mon profil professionnel VELORA ✨\n\n` +
        `${profile.fullName}\n` +
        `${profile.title}${profile.company ? ` · ${profile.company}` : ""}\n\n` +
        `${url}`
      );
      window.open(`https://wa.me/?text=${message}`, "_blank");

      // Track
      if (user) {
        await logShare({ userId: user.uid, method: "whatsapp" });
        await trackAnalyticsEvent({
          userId: user.uid,
          event: "whatsapp_share",
          metadata: { description: "Profile shared via WhatsApp" },
        });
      }
    },
    [user]
  );

  /** Copy profile link to clipboard */
  const copyProfileLink = useCallback(
    async (username: string) => {
      const url = getProfileUrl(username);
      await navigator.clipboard.writeText(url);

      if (user) {
        await logShare({ userId: user.uid, method: "link" });
        await trackAnalyticsEvent({
          userId: user.uid,
          event: "link_click",
          metadata: { description: "Profile link copied" },
        });
      }
    },
    [user]
  );

  /** Track a share event */
  const trackShare = useCallback(
    async (method: ConnectionMethod) => {
      if (!user) return;
      await logShare({ userId: user.uid, method });
    },
    [user]
  );

  /** Track QR scan */
  const trackQRScan = useCallback(
    async () => {
      if (!user) return;
      await trackAnalyticsEvent({
        userId: user.uid,
        event: "qr_scan",
        metadata: { description: "QR code scanned" },
      });
    },
    [user]
  );

  return { shareViaWhatsApp, copyProfileLink, trackShare, trackQRScan };
}
