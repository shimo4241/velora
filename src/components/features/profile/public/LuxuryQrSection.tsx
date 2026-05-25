"use client";

import { motion } from "framer-motion";
import { QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { VeloraProfile } from "@/types";
import { IdentityTheme, Reveal } from "./publicShared";

interface LuxuryQrSectionProps {
  profile: VeloraProfile;
  profileUrl: string;
  shortUrl: string;
  theme: IdentityTheme;
}

export default function LuxuryQrSection({
  profile,
  profileUrl,
  shortUrl,
  theme,
}: LuxuryQrSectionProps) {
  return (
    <section className="py-10">
      <Reveal>
        <div className="mx-auto max-w-[440px] text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgba(var(--identity-accent-rgb),0.22)] bg-[rgba(var(--identity-accent-rgb),0.08)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--identity-accent)]">
            <QrCode size={12} />
            VELORA PASS
          </div>
          <h2 className="font-[family-name:var(--font-display)] text-[2rem] font-semibold leading-tight text-velora-text">
            Branded Signal
          </h2>
          <div className="relative mx-auto mt-7 flex h-[292px] w-[292px] items-center justify-center">
            <motion.div
              aria-hidden
              className="absolute inset-0 rounded-[38px] border border-[rgba(var(--identity-accent-rgb),0.28)] opacity-60"
              animate={{ scale: [0.99, 1.025, 0.99] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              aria-hidden
              className="glow-layer absolute -inset-3 rounded-[42px] bg-[rgba(var(--identity-accent-rgb),0.13)] opacity-60 blur-xl"
              animate={{ scale: [1, 1.035, 1] }}
              transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="identity-qr-frame relative rounded-[34px] p-4">
              <div className="relative overflow-hidden rounded-[24px] bg-white p-4 shadow-[0_22px_90px_rgba(0,0,0,0.48)]">
                <span className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-transparent via-[rgba(var(--identity-accent-rgb),0.22)] to-transparent animate-gold-scan" />
                <QRCodeSVG
                  value={profileUrl}
                  size={212}
                  bgColor="#ffffff"
                  fgColor={theme.qrForeground}
                  level="H"
                  includeMargin={false}
                />
              </div>
            </div>
          </div>
          <div className="mt-5 font-[family-name:var(--font-display)] text-base font-semibold text-velora-text">
            {profile.fullName || "VELORA"}
          </div>
          <div className="mt-1 truncate font-mono text-[11px] text-velora-text-muted">
            {shortUrl}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
