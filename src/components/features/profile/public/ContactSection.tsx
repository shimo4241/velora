"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { VeloraProfile } from "@/types";
import {
  IdentityTheme,
  LUXURY_EASE,
  Reveal,
  getContactActions,
} from "./publicShared";

interface ContactSectionProps {
  profile: VeloraProfile;
  theme: IdentityTheme;
  t: (key: string) => string;
}

export default function ContactSection({ profile, theme, t }: ContactSectionProps) {
  const contactActions = useMemo(() => getContactActions(profile), [profile]);
  if (!contactActions.length) return null;

  const getTranslationKey = (key: string) => {
    if (key === "call_clinic") return "btn_call_clinic";
    if (key === "whatsapp") return "btn_whatsapp";
    if (key === "maps") return "btn_open_maps";
    if (key === "booking") return "btn_book_appointment";
    return key;
  };

  return (
    <section className="-mt-6 pb-8">
      <Reveal>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {contactActions.map((action, index) => {
            const Icon = action.icon;
            const isWhatsApp = action.key === "whatsapp";
            const isPrimary = index === 0 || action.key === "phone" || action.key === "call_clinic";

            let cardBgClass = "btn-3d-glass";
            let iconWrapperClass = "bg-white/5 text-velora-text";
            let labelClass = "text-velora-text-secondary/70";
            let valueClass = "text-velora-text";

            if (isWhatsApp) {
              cardBgClass = "btn-3d-whatsapp text-white";
              iconWrapperClass = "bg-black/20 text-white";
              labelClass = "text-white/70";
              valueClass = "text-white";
            } else if (isPrimary) {
              cardBgClass = "btn-3d-identity text-velora-black";
              iconWrapperClass = "bg-black/10 text-velora-black";
              labelClass = "text-velora-black/60";
              valueClass = "text-velora-black font-extrabold";
            }

            return (
              <motion.a
                key={action.key}
                href={action.href}
                target={action.href.startsWith("http") ? "_blank" : undefined}
                rel={action.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className={`identity-reflective group flex min-h-[96px] items-center justify-between rounded-[22px] px-4 py-4 text-left ${cardBgClass}`}
                whileHover={{ y: -4, scale: 1.01 }}
                whileTap={{ scale: 0.985 }}
                transition={{ duration: 0.28, ease: LUXURY_EASE }}
              >
                <span>
                  <span className={`block text-[10px] font-semibold uppercase tracking-[0.16em] ${labelClass}`}>
                    {index === 0 ? t("Primary") || "Primary" : t("Access") || "Access"}
                  </span>
                  <span className={`mt-2 block font-[family-name:var(--font-display)] text-base font-semibold ${valueClass}`}>
                    {t(getTranslationKey(action.key)) || action.label}
                  </span>
                </span>
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-full border transition-transform duration-300 group-hover:scale-105 ${iconWrapperClass}`}
                  style={{ borderColor: isPrimary ? "rgba(0, 0, 0, 0.15)" : `rgba(${theme.accentRgb}, 0.24)` }}
                >
                  <Icon size={18} />
                </span>
              </motion.a>
            );
          })}
        </div>
      </Reveal>
    </section>
  );
}
