"use client";

import {
  GlassCard,
  GoldButton,
  Divider,
} from "@/components/ui";
import { FadeUp } from "@/components/motion/animations";
import {
  ProfileHero,
  PortfolioGallery,
  CVTimeline,
  SocialLinks,
  ContactActions,
} from "@/components/profile";
import { MOCK_USER } from "@/lib/constants";
import { Sparkles } from "lucide-react";

/* ═══════════════════════════════════════════════════
   VELORA — Profile Screen (Identity)
   The Velora Moment™ — cinematic professional identity
   ═══════════════════════════════════════════════════ */

export function ProfileScreen() {
  return (
    <div className="min-h-screen bg-velora-black safe-bottom">
      <ProfileHero
        name={MOCK_USER.fullName}
        title={MOCK_USER.title}
        company={MOCK_USER.company}
        location={MOCK_USER.location}
        bio={MOCK_USER.bio}
        avatarUrl={MOCK_USER.avatarUrl}
        isVerified={MOCK_USER.isVerified}
        isPremium={MOCK_USER.isPremium}
        mode="Entrepreneur"
      />

      <Divider className="mx-5" />
      <ContactActions />

      <Divider className="mx-5" />
      <PortfolioGallery />

      <Divider className="mx-5" />
      <CVTimeline />

      <Divider className="mx-5" />
      <SocialLinks />

      {/* AI Enhancement CTA */}
      <div className="section py-5">
        <FadeUp delay={1.7}>
          <GlassCard className="p-5 text-center" gold>
            <Sparkles size={18} className="text-velora-gold mx-auto mb-2.5" />
            <h3 className="text-heading text-sm text-velora-text mb-1">
              Amélioration IA
            </h3>
            <p className="text-[11px] text-velora-text-muted mb-3.5 max-w-[220px] mx-auto leading-relaxed">
              Optimisez votre bio, descriptions de portfolio et branding professionnel
            </p>
            <GoldButton size="sm">
              <Sparkles size={11} />
              Améliorer avec l&apos;IA
            </GoldButton>
          </GlassCard>
        </FadeUp>
      </div>
    </div>
  );
}
