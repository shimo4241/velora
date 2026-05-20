"use client";

import { motion } from "framer-motion";
import {
  Briefcase,
  ExternalLink,
  Globe,
  MapPin,
  Shield,
  Star,
} from "lucide-react";
import { Divider, GoldBadge } from "@/components/ui";
import { FadeUp, ScaleIn } from "@/components/motion/animations";
import {
  AvailabilityBadge,
  ContactActionGrid,
  getProfileThemeGradient,
  ServicesList,
  SkillChips,
  SocialLinkRow,
} from "@/components/profile/ProfileEditor";
import { useTranslation } from "@/lib/i18n";
import type { ExperienceEntry, PortfolioItem, VeloraProfile } from "@/types";

interface PublicProfileClientProps {
  profile: VeloraProfile;
  portfolio: PortfolioItem[];
  experience: ExperienceEntry[];
}

export default function PublicProfileClient({
  profile,
  portfolio,
  experience,
}: PublicProfileClientProps) {
  const { t } = useTranslation(profile.locale || "fr");
  const isVerified = Boolean(profile.isVerified);
  const isPremium = Boolean(profile.isPremium);

  return (
    <div className="min-h-screen bg-velora-black safe-bottom">
      <div className="relative">
        <div className="relative h-[320px] overflow-hidden">
          <motion.div
            className="absolute inset-0"
            style={{ background: getProfileThemeGradient(profile.profileTheme) }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7 }}
          />

          <motion.div
            className="absolute left-1/2 top-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(196,162,101,0.08) 0%, transparent 65%)" }}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          />

          <div className="absolute bottom-0 left-1/2 z-10 -translate-x-1/2 translate-y-1/2">
            <ScaleIn delay={0.2}>
              <div className="relative">
                <div className="absolute -inset-1.5 rounded-full bg-gradient-to-br from-velora-gold/20 to-transparent blur-sm" />
                <div className="absolute -inset-0.5 rounded-full border border-velora-gold/20" />
                <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-velora-gold/30 bg-velora-surface">
                  {profile.avatarUrl ? (
                    <div
                      className="h-full w-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${profile.avatarUrl})` }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-[family-name:var(--font-display)] text-2xl font-bold text-velora-gold">
                      {profile.fullName?.split(" ").map((name) => name[0]).join("") || "V"}
                    </div>
                  )}
                </div>
                {isVerified && (
                  <motion.div
                    className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full border border-velora-gold/30 bg-velora-black"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Shield size={12} className="text-velora-gold" fill="currentColor" />
                  </motion.div>
                )}
              </div>
            </ScaleIn>
          </div>
        </div>

        <div className="px-6 pb-5 pt-16 text-center">
          <FadeUp delay={0.4}>
            <h1 className="text-display text-[26px] text-velora-text">{profile.fullName}</h1>
          </FadeUp>

          <FadeUp delay={0.5}>
            <div className="mt-2 flex items-center justify-center gap-2">
              <Briefcase size={13} className="text-velora-gold/70" />
              <span className="text-sm text-velora-text-secondary">{profile.title}</span>
            </div>
          </FadeUp>

          <FadeUp delay={0.55}>
            <div className="mt-1 flex items-center justify-center gap-1.5">
              <Globe size={11} className="text-velora-text-muted" />
              <span className="text-xs text-velora-text-muted">{profile.company || "Independent"}</span>
              <span className="mx-0.5 text-velora-text-muted/30">-</span>
              <MapPin size={11} className="text-velora-text-muted" />
              <span className="text-xs text-velora-text-muted">{profile.location || "Global"}</span>
            </div>
          </FadeUp>

          <FadeUp delay={0.6}>
            <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
              {isPremium && (
                <GoldBadge variant="premium">
                  <Star size={9} fill="currentColor" />
                  {t("premium")}
                </GoldBadge>
              )}
              {isVerified && (
                <GoldBadge variant="verified">
                  <Shield size={9} />
                  {t("verified")}
                </GoldBadge>
              )}
              <GoldBadge>
                {profile.professionalMode === "entrepreneur" ? "Entrepreneur" : profile.professionalMode || "Professional"}
              </GoldBadge>
            </div>
          </FadeUp>

          {profile.bio && (
            <FadeUp delay={0.65}>
              <p className="mx-auto mt-4 max-w-[300px] text-sm leading-relaxed text-velora-text-secondary">
                {profile.bio}
              </p>
            </FadeUp>
          )}

          <FadeUp delay={0.7}>
            <div className="mt-4 flex justify-center">
              <AvailabilityBadge status={profile.availabilityStatus || "available"} />
            </div>
          </FadeUp>
        </div>
      </div>

      <Divider className="mx-5" />
      <section className="px-5 py-5">
        <ContactActionGrid profile={profile} />
      </section>

      {(profile.skills || []).length > 0 && (
        <>
          <Divider className="mx-5" />
          <section className="px-5 py-5">
            <h2 className="text-heading mb-4 text-base text-velora-text">Skills</h2>
            <SkillChips skills={profile.skills || []} />
          </section>
        </>
      )}

      {(profile.services || []).length > 0 && (
        <>
          <Divider className="mx-5" />
          <section className="px-5 py-5">
            <h2 className="text-heading mb-4 text-base text-velora-text">Services</h2>
            <ServicesList services={profile.services || []} />
          </section>
        </>
      )}

      {portfolio.length > 0 && (
        <>
          <Divider className="mx-5" />
          <section className="px-5 py-5">
            <h2 className="text-heading mb-4 text-base text-velora-text">{t("portfolio")}</h2>
            <div className="grid grid-cols-1 gap-3">
              {portfolio.map((project) => (
                <article key={project.id} className="overflow-hidden rounded-[var(--radius-card)] border border-white/8 bg-white/[0.04]">
                  {project.imageUrl && (
                    <div className="aspect-[16/9] bg-cover bg-center" style={{ backgroundImage: `url(${project.imageUrl})` }} />
                  )}
                  <div className="p-4">
                    <div className="text-[10px] uppercase tracking-[0.16em] text-velora-gold/70">{project.category || "Project"}</div>
                    <h3 className="mt-1 text-sm font-semibold text-velora-text">{project.title}</h3>
                    {project.description && <p className="mt-1 text-xs leading-relaxed text-velora-text-muted">{project.description}</p>}
                    {project.link && (
                      <a href={project.link} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-[11px] text-velora-gold">
                        View project
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}

      {experience.length > 0 && (
        <>
          <Divider className="mx-5" />
          <section className="px-5 py-5">
            <h2 className="text-heading mb-4 text-base text-velora-text">{t("experience")}</h2>
            <div className="space-y-4">
              {experience.map((item) => (
                <div key={item.id} className="border-l border-velora-gold/25 pl-4">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-velora-gold/70">
                    {item.isCurrent ? `${item.startYear} - ${t("present")}` : `${item.startYear} - ${item.endYear || ""}`}
                  </div>
                  <h3 className="mt-1 text-sm font-semibold text-velora-text">{item.role}</h3>
                  <p className="text-xs text-velora-text-secondary">{item.company}</p>
                  {item.description && <p className="mt-1 text-xs leading-relaxed text-velora-text-muted">{item.description}</p>}
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {(profile.socialLinks || []).length > 0 && (
        <>
          <Divider className="mx-5" />
          <section className="px-5 py-5 pb-24">
            <h2 className="text-heading mb-4 text-base text-velora-text">{t("connect")}</h2>
            <SocialLinkRow links={profile.socialLinks || []} />
          </section>
        </>
      )}
    </div>
  );
}
