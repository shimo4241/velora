"use client";

import { motion } from "framer-motion";
import {
  Shield,
  Star,
  MapPin,
  Briefcase,
  Globe,
  Award,
  Camera,
  MessageCircle,
  Mail,
  Phone,
  CalendarDays,
  ExternalLink,
  Bookmark,
} from "lucide-react";
import { GlassCard, GoldBadge, GoldButton, Divider } from "@/components/ui";
import { FadeUp, ScaleIn, SlideIn, StaggerChildren, StaggerItem } from "@/components/motion/animations";
import { useTranslation } from "@/lib/i18n";
import type { VeloraProfile, PortfolioItem, ExperienceEntry } from "@/types";

const PORTFOLIO_ICONS: Record<string, typeof Award> = {
  Branding: Award,
  "UI/UX": Camera,
  Consulting: Briefcase,
  Events: Star,
};

const PORTFOLIO_GRADIENTS: Record<string, string> = {
  Branding: "from-amber-900/30 to-yellow-900/15",
  "UI/UX": "from-blue-900/30 to-cyan-900/15",
  Consulting: "from-emerald-900/30 to-teal-900/15",
  Events: "from-rose-900/30 to-pink-900/15",
};

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

  const actions = [
    {
      label: t("whatsapp"),
      icon: MessageCircle,
      color: "text-velora-whatsapp",
      bg: "bg-velora-whatsapp/10",
      border: "border-velora-whatsapp/20",
      primary: true,
      href: profile.whatsapp ? `https://wa.me/${profile.whatsapp.replace(/\D/g, '')}` : null,
    },
    {
      label: t("email"),
      icon: Mail,
      color: "text-velora-blue",
      bg: "bg-velora-blue/10",
      border: "border-velora-blue/15",
      primary: false,
      href: profile.email ? `mailto:${profile.email}` : null,
    },
  ].filter(a => a.href);

  return (
    <div className="min-h-screen bg-velora-black safe-bottom">
      <div className="relative">
        <div className="relative h-[320px] overflow-hidden">
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(160deg, var(--color-velora-black) 0%, #1a1510 30%, #12100b 60%, var(--color-velora-black) 100%)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7 }}
          />

          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(196,162,101,0.08) 0%, transparent 65%)",
            }}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          />

          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10">
            <ScaleIn delay={0.2}>
              <div className="relative">
                <div className="absolute -inset-1.5 rounded-full bg-gradient-to-br from-velora-gold/20 to-transparent blur-sm" />
                <div className="absolute -inset-0.5 rounded-full border border-velora-gold/20" />
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-velora-gold/30 bg-velora-surface">
                  {profile.avatarUrl ? (
                    <div
                      className="w-full h-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${profile.avatarUrl})` }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-velora-gold font-[family-name:var(--font-display)]">
                      {profile.fullName?.split(" ")?.map((n) => n[0])?.join("") || "V"}
                    </div>
                  )}
                </div>
                {isVerified && (
                  <motion.div
                    className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-velora-black flex items-center justify-center border border-velora-gold/30"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      duration: 0.4,
                      delay: 0.6,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    <Shield size={12} className="text-velora-gold" fill="currentColor" />
                  </motion.div>
                )}
              </div>
            </ScaleIn>
          </div>
        </div>

        <div className="pt-16 px-6 pb-5 text-center">
          <FadeUp delay={0.4}>
            <h1 className="text-display text-[26px] text-velora-text">{profile.fullName}</h1>
          </FadeUp>

          <FadeUp delay={0.5}>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Briefcase size={13} className="text-velora-gold/70" />
              <span className="text-velora-text-secondary text-sm">
                {profile.title}
              </span>
            </div>
          </FadeUp>

          <FadeUp delay={0.55}>
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <Globe size={11} className="text-velora-text-muted" />
              <span className="text-velora-text-muted text-xs">{profile.company || "Independent"}</span>
              <span className="text-velora-text-muted/30 mx-0.5">·</span>
              <MapPin size={11} className="text-velora-text-muted" />
              <span className="text-velora-text-muted text-xs">{profile.location || "Global"}</span>
            </div>
          </FadeUp>

          <FadeUp delay={0.6}>
            <div className="flex items-center justify-center gap-2 mt-3.5">
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

          <FadeUp delay={0.65}>
            <p className="text-velora-text-secondary text-sm leading-relaxed mt-4 max-w-[280px] mx-auto">
              {profile.bio}
            </p>
          </FadeUp>
        </div>
      </div>

      <Divider className="mx-5" />

      {/* Actions */}
      <div className="px-5 py-5">
        <FadeUp delay={1.5}>
          <div className="grid grid-cols-2 gap-2.5">
            {actions.map((action, i) => {
              const Icon = action.icon;
              return (
                <a
                  key={i}
                  href={action.href!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-[var(--radius-card)] ${action.bg} border ${action.border}`}
                >
                  <Icon size={18} className={action.color} />
                  <span className={`text-[10px] font-medium ${action.color}`}>
                    {action.label}
                  </span>
                </a>
              );
            })}
          </div>
        </FadeUp>
      </div>

      {/* Portfolio */}
      {portfolio && portfolio.length > 0 && (
        <>
          <Divider className="mx-5" />
          <div className="px-5 py-5">
            <FadeUp delay={0.8}>
              <h2 className="text-heading text-base text-velora-text mb-4 px-1">
                {t("portfolio")}
              </h2>
            </FadeUp>
            <StaggerChildren staggerDelay={0.08} delay={0.85} className="grid grid-cols-2 gap-3">
              {portfolio.map((project) => {
                const Icon = PORTFOLIO_ICONS[project.category] || Award;
                const gradient = PORTFOLIO_GRADIENTS[project.category] || "from-amber-900/30 to-yellow-900/15";

                return (
                  <StaggerItem key={project.id}>
                    <motion.div
                      whileTap={{ scale: 0.97 }}
                      className="glass rounded-[var(--radius-card)] p-4 aspect-[4/3] flex flex-col justify-between group relative overflow-hidden"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50`} />
                      <div className="relative z-10">
                        <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-white/5 flex items-center justify-center border border-white/8 group-hover:border-velora-gold/20 transition-colors duration-300">
                          <Icon size={14} className="text-velora-text-muted group-hover:text-velora-gold transition-colors duration-300" />
                        </div>
                      </div>
                      <div className="relative z-10">
                        <div className="text-caption mb-0.5">{project.category}</div>
                        <div className="text-xs font-medium text-velora-text leading-tight">
                          {project.title}
                        </div>
                      </div>
                    </motion.div>
                  </StaggerItem>
                );
              })}
            </StaggerChildren>
          </div>
        </>
      )}

      {/* Experience */}
      {experience && experience.length > 0 && (
        <>
          <Divider className="mx-5" />
          <div className="px-5 py-5">
            <FadeUp delay={1.0}>
              <h2 className="text-heading text-base text-velora-text mb-4 px-1">
                {t("experience")}
              </h2>
            </FadeUp>
            <div className="relative">
              <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-velora-gold/30 via-velora-gold/15 to-transparent" />
              <div className="space-y-4">
                {experience.map((item, i) => (
                  <SlideIn key={item.id} delay={1.05 + i * 0.1}>
                    <div className="flex gap-3.5 group">
                      <div className="relative flex-shrink-0 mt-1.5">
                        <div className={`w-[8px] h-[8px] rounded-full border-2 transition-all duration-300 ${item.isCurrent ? "border-velora-gold bg-velora-gold/30" : "border-velora-gold/40 bg-velora-black"}`} />
                      </div>
                      <div className="flex-1 pb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-velora-gold/60 font-mono tracking-wider">
                            {item.isCurrent ? `${item.startYear} – ${t("present")}` : `${item.startYear} – ${item.endYear}`}
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-velora-text mt-0.5">{item.role}</div>
                        <div className="text-xs text-velora-text-secondary mt-0.5">{item.company}</div>
                        {item.description && (
                          <div className="text-[11px] text-velora-text-muted mt-1 leading-relaxed">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </SlideIn>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Social Links */}
      {profile.socialLinks && profile.socialLinks.length > 0 && (
        <>
          <Divider className="mx-5" />
          <div className="px-5 py-4 pb-24">
            <FadeUp delay={1.3}>
              <h2 className="text-heading text-base text-velora-text mb-3 px-1">
                {t("connect")}
              </h2>
            </FadeUp>
            <FadeUp delay={1.35}>
              <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
                {profile.socialLinks.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 glass rounded-[var(--radius-card)] px-4 py-2.5 flex items-center gap-2 group"
                  >
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold"
                      style={{ backgroundColor: `${link.color}15`, color: link.color }}
                    >
                      {link.icon}
                    </div>
                    <span className="text-xs text-velora-text-secondary font-medium">
                      {link.platform}
                    </span>
                    <ExternalLink size={10} className="text-velora-text-muted/50" />
                  </a>
                ))}
              </div>
            </FadeUp>
          </div>
        </>
      )}
    </div>
  );
}
