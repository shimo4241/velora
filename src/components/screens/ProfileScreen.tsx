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
import { useProfile } from "@/hooks/useProfile";
import { Sparkles, LogOut } from "lucide-react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

/* ═══════════════════════════════════════════════════
   VELORA — Profile Screen (Identity)
   The Velora Moment™ — cinematic professional identity
   ═══════════════════════════════════════════════════ */

export function ProfileScreen() {
  const { profile } = useProfile();

  return (
    <div className="min-h-screen bg-velora-black safe-bottom">
      <ProfileHero
        name={profile.fullName || "VELORA User"}
        title={profile.title}
        company={profile.company}
        location={profile.location}
        bio={profile.bio}
        avatarUrl={profile.avatarUrl}
        isVerified={profile.isVerified}
        isPremium={profile.isPremium}
        mode={profile.professionalMode === "entrepreneur" ? "Entrepreneur" : profile.professionalMode}
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

      <Divider className="mx-5" />

      {/* Settings / Logout */}
      <div className="px-5 py-8 pb-32">
        <FadeUp delay={1.8}>
          <button
            onClick={() => signOut(auth)}
            className="flex items-center gap-2 text-sm text-velora-rose/80 hover:text-velora-rose transition-colors mx-auto"
          >
            <LogOut size={14} />
            Déconnexion
          </button>
        </FadeUp>
      </div>
    </div>
  );
}
