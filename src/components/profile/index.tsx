"use client";

import { useRef, useState } from "react";
import { useScrollLock } from "@/lib/scrollLock";
import { AnimatePresence, motion, useScroll, useTransform, type PanInfo } from "framer-motion";
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
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  Link2,
  Bookmark,
  Play,
  X,
} from "lucide-react";
import { GoldBadge } from "../ui";
import { OptimizedImage } from "../ui/OptimizedImage";
import { FadeUp, ScaleIn, SlideIn, StaggerChildren, StaggerItem } from "../motion/animations";
import { useTranslation } from "@/lib/i18n";
import { useProfile } from "@/hooks/useProfile";
import { useSharing } from "@/hooks/useSharing";
import { getProfileThemeGradient } from "@/components/profile/ProfileEditor";
import type { ExperienceEntry, PortfolioItem, ProfileTheme } from "@/types";

/* ═══════════════════════════════════════════════════
   VELORA — Profile Components
   The Velora Moment™ — cinematic professional identity
   ═══════════════════════════════════════════════════ */

/* ── Profile Hero ── */
export function isVideoAsset(url?: string) {
  return Boolean(url && /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(url));
}

interface ProfileHeroProps {
  name: string;
  title: string;
  company?: string;
  location: string;
  bio: string;
  avatarUrl: string;
  coverUrl?: string;
  isVerified?: boolean;
  isPremium?: boolean;
  mode?: string;
  connectionsCount?: number;
  portfolioCount?: number;
  profileViews?: number;
  profileTheme?: ProfileTheme;
  showBio?: boolean;
}

export function ProfileHero({
  name,
  title,
  company,
  location,
  bio,
  avatarUrl,
  coverUrl,
  isVerified = true,
  isPremium = true,
  mode = "Entrepreneur",
  connectionsCount = 0,
  portfolioCount = 0,
  profileViews = 0,
  profileTheme,
  showBio = true,
}: ProfileHeroProps) {
  const { profile, isProfileReady } = useProfile();
  const { t } = useTranslation(profile?.locale || "fr");
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const bannerY = useTransform(scrollYProgress, [0, 1], [0, 38]);
  const avatarY = useTransform(scrollYProgress, [0, 1], [0, -16]);

  if (!isProfileReady || !profile) return null;
  const hasVideoBanner = isVideoAsset(coverUrl);

  return (
    <div ref={heroRef} className="relative">
      {/* ── Cinematic Background — Warm Espresso ── */}
      <div className="relative h-[330px] overflow-hidden">
        {/* Warm gradient backdrop */}
        <motion.div
          className="absolute inset-x-0 -top-8 bottom-0"
          style={{
            background: getProfileThemeGradient(profileTheme),
            y: bannerY,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7 }}
        />

        {coverUrl && (
          hasVideoBanner ? (
            <motion.video
              src={coverUrl}
              className="absolute inset-x-0 -top-8 h-[380px] w-full object-cover opacity-[0.28]"
              style={{ y: bannerY }}
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <motion.div
              className="absolute inset-x-0 -top-8 h-[380px] opacity-[0.28]"
              style={{ y: bannerY }}
            >
              <OptimizedImage
                src={coverUrl}
                type="cover"
                className="w-full h-full"
                alt={`${name}'s profile banner`}
              />
            </motion.div>
          )
        )}

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(245,243,238,0.09),transparent_32%),linear-gradient(180deg,color-mix(in srgb, var(--color-velora-black) 0%, transparent)_0%,color-mix(in srgb, var(--color-velora-black) 42%, transparent)_68%,var(--theme-bg)_100%)]" />
        <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(115deg,transparent_0%,color-mix(in srgb, var(--color-velora-gold) 12%, transparent)_46%,transparent_54%)]" />

        {/* Gold atmospheric glow — subtle, centered */}
        <motion.div
          className="glow-layer absolute left-1/2 top-[56%] h-[280px] w-[280px] rounded-full opacity-80"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--color-velora-gold) 13%, transparent) 0%, color-mix(in srgb, var(--color-velora-gold) 4%, transparent) 42%, transparent 70%)",
            x: "-50%",
            y: "-50%",
          }}
          animate={{ scale: [0.98, 1.04, 0.98] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Ambient particles — reduced to 4 for subtlety */}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-0.5 h-0.5 rounded-full bg-velora-gold/30 opacity-50"
            style={{
              left: `${20 + i * 18}%`,
              top: `${25 + (i % 2) * 30}%`,
            }}
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 3 + i * 0.8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          />
        ))}

        {/* Avatar — positioned at bottom edge */}
        <motion.div className="absolute bottom-0 left-1/2 z-10 -translate-x-1/2 translate-y-1/2" style={{ y: avatarY }}>
          <ScaleIn delay={0.2}>
            <div className="relative">
              {/* Subtle glow ring */}
              <motion.div
                className="glow-layer absolute -inset-3 rounded-full bg-velora-gold/8 opacity-50 blur-md"
                animate={{ scale: [0.94, 1.06, 0.94] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="absolute -inset-1.5 rounded-full bg-gradient-to-br from-velora-gold/25 to-transparent blur-sm" />
              <div className="absolute -inset-0.5 rounded-full border border-velora-gold/25" />

              {/* Avatar image */}
              <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-velora-gold/35 bg-velora-surface shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
                {avatarUrl ? (
                  <OptimizedImage
                    src={avatarUrl}
                    type="avatar"
                    className="w-full h-full"
                    alt={`${name}'s avatar`}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-velora-gold font-[family-name:var(--font-display)]">
                    {name?.split(" ")?.map((n) => n[0])?.join("") || "V"}
                  </div>
                )}
              </div>

              {/* Verified badge */}
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
        </motion.div>
      </div>

      {/* ── Profile Info ── */}
      <div className="pt-16 px-6 pb-5 text-center">
        <FadeUp delay={0.4}>
          <h1 className="text-display text-[26px] text-velora-text">{name}</h1>
        </FadeUp>

        <FadeUp delay={0.5}>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Briefcase size={13} className="text-velora-gold/70" />
            <span className="text-velora-text-secondary text-sm">
              {title}
            </span>
          </div>
        </FadeUp>

        <FadeUp delay={0.55}>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <Globe size={11} className="text-velora-text-muted" />
            <span className="text-velora-text-muted text-xs">{company}</span>
            <span className="text-velora-text-muted/30 mx-0.5">·</span>
            <MapPin size={11} className="text-velora-text-muted" />
            <span className="text-velora-text-muted text-xs">{location}</span>
          </div>
        </FadeUp>

        {/* Badges */}
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
              {mode}
            </GoldBadge>
          </div>
        </FadeUp>

        {/* Bio */}
        {showBio && (
          <FadeUp delay={0.65}>
            <p className="text-velora-text-secondary text-sm leading-relaxed mt-4 max-w-[280px] mx-auto">
              {bio}
            </p>
          </FadeUp>
        )}

        {/* Stats row — real Firestore data */}
        <FadeUp delay={0.7}>
          <div className="flex items-center justify-center gap-8 mt-5">
            {[
              { value: String(profileViews), label: "views" },
              { value: String(connectionsCount), label: t("connections") },
              { value: String(portfolioCount), label: t("portfolio") },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-data text-lg text-velora-text font-semibold">
                  {stat.value}
                </div>
                <div className="text-caption mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </FadeUp>
      </div>
    </div>
  );
}

/* ── Portfolio Gallery ── */
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

export function PortfolioGallery({ portfolio = [] }: { portfolio?: PortfolioItem[] }) {
  const { profile, isProfileReady } = useProfile();
  const { t } = useTranslation(profile?.locale || "fr");

  if (!isProfileReady || !profile) return null;

  return (
    <div className="px-5 py-5">
      <FadeUp delay={0.8}>
        <h2 className="text-heading text-base text-velora-text mb-4 px-1">
          {t("portfolio")}
        </h2>
      </FadeUp>

      <StaggerChildren staggerDelay={0.08} delay={0.85} className="grid grid-cols-2 gap-3">
        {portfolio?.map((project) => {
          const Icon = PORTFOLIO_ICONS[project.category] || Award;
          const gradient = PORTFOLIO_GRADIENTS[project.category] || "from-amber-900/30 to-yellow-900/15";

          return (
            <StaggerItem key={project.id}>
              <motion.div
                whileTap={{ scale: 0.97 }}
                className="glass rounded-[var(--radius-card)] p-4 aspect-[4/3] flex flex-col justify-between cursor-pointer group relative overflow-hidden"
              >
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50`} />

                <div className="relative z-10">
                  <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-white/5 flex items-center justify-center border border-white/8 group-hover:border-velora-gold/20 transition-colors duration-300">
                    <Icon
                      size={14}
                      className="text-velora-text-muted group-hover:text-velora-gold transition-colors duration-300"
                    />
                  </div>
                </div>

                <div className="relative z-10">
                  <div className="text-caption mb-0.5">{project.category}</div>
                  <div className="text-xs font-medium text-velora-text-secondary leading-tight">
                    {project.title}
                  </div>
                </div>
              </motion.div>
            </StaggerItem>
          );
        })}
      </StaggerChildren>
    </div>
  );
}

/* ── CV Timeline ── */
export function PremiumPortfolioGallery({
  portfolio = [],
  compact = false,
}: {
  portfolio?: PortfolioItem[];
  compact?: boolean;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activeProject = activeIndex === null ? null : portfolio[activeIndex];
  const [scale, setScale] = useState(1);
  const [dragEnabled, setDragEnabled] = useState(false);

  useScrollLock(activeIndex !== null);

  const move = (direction: -1 | 1) => {
    if (activeIndex === null || portfolio.length === 0) return;
    // Reset zoom state on page change
    setScale(1);
    setDragEnabled(false);
    setActiveIndex((activeIndex + direction + portfolio.length) % portfolio.length);
  };

  const toggleZoom = () => {
    if (scale === 1) {
      setScale(2.2);
      setDragEnabled(true);
    } else {
      setScale(1);
      setDragEnabled(false);
    }
  };

  const handleDoubleTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleZoom();
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (scale > 1) return; // Zoom overrides swipe
    const swipeThreshold = 50;
    if (info.offset.x < -swipeThreshold) {
      move(1);
    } else if (info.offset.x > swipeThreshold) {
      move(-1);
    }
  };

  if (!portfolio.length) return null;

  return (
    <>
      <StaggerChildren
        staggerDelay={0.07}
        delay={0.05}
        className="[column-count:1] [column-gap:0.75rem] min-[380px]:[column-count:2]"
      >
        {portfolio.map((project, index) => {
          const hasMedia = Boolean(project.imageUrl);
          const isVideo = isVideoAsset(project.imageUrl);
          const tall = index % 3 === 1;

          return (
            <StaggerItem key={project.id} className="mb-3 break-inside-avoid">
              <motion.article
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => setActiveIndex(index)}
                className="card-interactive group relative cursor-pointer overflow-hidden rounded-[var(--radius-card)] border border-white/8 bg-white/[0.04] text-left shadow-[0_6px_16px_rgba(0,0,0,0.12)]"
              >
                <div className={`relative overflow-hidden ${tall ? "aspect-[4/5]" : "aspect-[4/3]"} ${compact ? "min-h-[150px]" : ""}`}>
                  {hasMedia ? (
                    isVideo ? (
                      <video
                        src={project.imageUrl}
                        className="h-full w-full object-cover"
                        autoPlay
                        muted
                        loop
                        playsInline
                      />
                    ) : (
                      <OptimizedImage
                        src={project.imageUrl}
                        type="portfolio"
                        className="h-full w-full transition-transform duration-700 group-hover:scale-[1.04]"
                        alt={project.title}
                      />
                    )
                  ) : (
                    <div className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,color-mix(in srgb, var(--color-velora-gold) 22%, transparent),transparent_34%),linear-gradient(145deg,color-mix(in srgb, var(--color-velora-gold) 18%, transparent),rgba(255,255,255,0.035))]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/76 via-black/12 to-transparent pointer-events-none" />
                  {isVideo && (
                    <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/45 text-velora-gold backdrop-blur-md">
                      <Play size={13} fill="currentColor" />
                    </div>
                  )}
                </div>
                <div className="absolute inset-x-0 bottom-0 p-3 pointer-events-none">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-velora-gold/80">
                      {project.category || "Project"}
                    </span>
                    {project.link && <Link2 size={11} className="shrink-0 text-velora-gold/70" />}
                  </div>
                  <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-velora-text">
                    {project.title}
                  </h3>
                </div>
              </motion.article>
            </StaggerItem>
          );
        })}
      </StaggerChildren>

      <AnimatePresence>
        {activeProject && (
          <motion.div
            className="fixed inset-0 z-[260] flex items-center justify-center bg-black/92 px-4 py-[max(1rem,env(safe-area-inset-top))]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveIndex(null)}
          >
            <motion.div
              className="relative w-full max-w-[430px] overflow-hidden rounded-[var(--radius-lg)] border border-white/12 bg-velora-black shadow-[0_12px_32px_rgba(0,0,0,0.45)]"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setActiveIndex(null)}
                className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-black/80 text-velora-text"
                aria-label="Close portfolio preview"
              >
                <X size={16} />
              </button>

              <motion.div
                className="relative aspect-[4/5] max-h-[62dvh] overflow-hidden bg-velora-card flex items-center justify-center"
                drag={scale === 1 ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.3}
                onDragEnd={handleDragEnd}
              >
                {isVideoAsset(activeProject.imageUrl) ? (
                  <video
                    src={activeProject.imageUrl}
                    className="h-full w-full object-contain"
                    autoPlay
                    muted
                    loop
                    playsInline
                    controls
                  />
                ) : activeProject.imageUrl ? (
                  <motion.div
                    className="w-full h-full cursor-zoom-in flex items-center justify-center select-none"
                    onClick={handleDoubleTap}
                    drag={dragEnabled}
                    dragConstraints={{ left: -180, right: 180, top: -180, bottom: 180 }}
                    dragElastic={0.1}
                    animate={{ scale }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <OptimizedImage
                      src={activeProject.imageUrl}
                      type="raw"
                      className="w-full h-full object-contain pointer-events-none"
                      alt={activeProject.title}
                    />
                  </motion.div>
                ) : (
                  <div className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,color-mix(in srgb, var(--color-velora-gold) 24%, transparent),transparent_36%),linear-gradient(145deg,color-mix(in srgb, var(--color-velora-gold) 18%, transparent),rgba(255,255,255,0.04))]" />
                )}
                
                {/* Visual Indicators */}
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                
                {portfolio.length > 1 && scale === 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        move(-1);
                      }}
                      className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/12 bg-black/80 text-velora-text transition-all hover:bg-black/60 active:scale-95"
                      aria-label="Previous project"
                    >
                      <ChevronLeft size={17} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        move(1);
                      }}
                      className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/12 bg-black/80 text-velora-text transition-all hover:bg-black/60 active:scale-95"
                      aria-label="Next project"
                    >
                      <ChevronRight size={17} />
                    </button>
                  </>
                )}
              </motion.div>

              <div className="p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-velora-gold">
                    {activeProject.category || "Project"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[10px] text-velora-text-muted">
                    <Eye size={11} />
                    Double-tap to zoom • Swipe to navigate
                  </span>
                </div>
                <h3 className="text-heading text-lg text-velora-text">{activeProject.title}</h3>
                {activeProject.description && (
                  <p className="mt-2 text-sm leading-relaxed text-velora-text-secondary">
                    {activeProject.description}
                  </p>
                )}
                {activeProject.link && (
                  <a
                    href={activeProject.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="haptic-press mt-4 inline-flex items-center gap-2 rounded-full border border-velora-gold/25 bg-velora-gold/10 px-4 py-2 text-xs font-semibold text-velora-gold hover:bg-velora-gold/18 transition-all"
                  >
                    View project
                    <ExternalLink size={13} />
                  </a>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function CVTimeline({ experience = [] }: { experience?: ExperienceEntry[] }) {
  const { profile, isProfileReady } = useProfile();
  const { t } = useTranslation(profile?.locale || "fr");

  if (!isProfileReady || !profile) return null;

  return (
    <div className="px-5 py-5">
      <FadeUp delay={1.0}>
        <h2 className="text-heading text-base text-velora-text mb-4 px-1">
          {t("experience")}
        </h2>
      </FadeUp>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-velora-gold/30 via-velora-gold/15 to-transparent" />

        <div className="space-y-4">
          {experience?.map((item, i) => (
            <SlideIn key={item.id} delay={1.05 + i * 0.1}>
              <div className="flex gap-3.5 group">
                {/* Dot */}
                <div className="relative flex-shrink-0 mt-1.5">
                  <div
                    className={`w-[8px] h-[8px] rounded-full border-2 transition-all duration-300 ${
                      item.isCurrent
                        ? "border-velora-gold bg-velora-gold/30"
                        : "border-velora-gold/40 bg-velora-black group-hover:border-velora-gold/60"
                    }`}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 pb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-velora-gold/60 font-mono tracking-wider">
                      {item.isCurrent
                        ? `${item.startYear} – ${t("present")}`
                        : `${item.startYear} – ${item.endYear}`}
                    </span>
                    {item.isCurrent && (
                      <span className="w-1.5 h-1.5 rounded-full bg-velora-emerald animate-pulse" />
                    )}
                  </div>
                  <div className="text-sm font-semibold text-velora-text font-[family-name:var(--font-display)] mt-0.5">
                    {item.role}
                  </div>
                  <div className="text-xs text-velora-text-secondary mt-0.5">
                    {item.company}
                  </div>
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
  );
}

/* ── Social Links ── */
export function SocialLinks() {
  const { profile, isProfileReady } = useProfile();
  const { t } = useTranslation(profile?.locale || "fr");

  if (!isProfileReady || !profile) return null;

  return (
    <div className="px-5 py-4">
      <FadeUp delay={1.3}>
        <h2 className="text-heading text-base text-velora-text mb-3 px-1">
          {t("connect")}
        </h2>
      </FadeUp>

      <FadeUp delay={1.35}>
        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
          {(profile?.socialLinks || []).map((link, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.92 }}
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
            </motion.button>
          ))}
        </div>
      </FadeUp>
    </div>
  );
}

/* ── Contact Actions — WhatsApp Primary ── */
export function ContactActions() {
  const { profile, isProfileReady } = useProfile();
  const { shareViaWhatsApp } = useSharing();
  const { t } = useTranslation(profile?.locale || "fr");

  if (!isProfileReady || !profile) return null;

  const handleWhatsApp = () => {
    shareViaWhatsApp(profile);
  };

  const handleEmail = () => {
    if (profile.email) {
      window.open(`mailto:${profile.email}`, "_blank");
    }
  };

  const handleCall = () => {
    const phone = profile.whatsapp || profile.phone;
    if (phone) {
      window.open(`tel:${phone}`, "_blank");
    }
  };

  const secondaryActions = [
    {
      label: t("email"),
      icon: Mail,
      color: "text-velora-blue",
      bg: "bg-velora-blue/10",
      border: "border-velora-blue/15",
      onClick: handleEmail,
      disabled: !profile.email,
    },
    {
      label: t("call"),
      icon: Phone,
      color: "text-velora-gold",
      bg: "bg-velora-gold-dim",
      border: "border-velora-gold/15",
      onClick: handleCall,
      disabled: !profile.whatsapp && !profile.phone,
    },
    {
      label: t("book"),
      icon: CalendarDays,
      color: "text-velora-violet",
      bg: "bg-velora-violet/10",
      border: "border-velora-violet/15",
      onClick: undefined as (() => void) | undefined,
      disabled: true,
    },
  ];

  return (
    <div className="px-5 py-5">
      {/* WhatsApp Hero CTA */}
      <FadeUp delay={1.5}>
        <motion.button
          onClick={handleWhatsApp}
          whileTap={{ scale: 0.97 }}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-[var(--radius-card)] bg-velora-whatsapp/12 border border-velora-whatsapp/20 mb-3"
        >
          <MessageCircle size={18} className="text-velora-whatsapp" />
          <span className="text-sm font-semibold text-velora-whatsapp font-[family-name:var(--font-display)]">
            {t("whatsapp_share")}
          </span>
        </motion.button>
      </FadeUp>

      {/* Secondary actions */}
      <FadeUp delay={1.55}>
        <div className="grid grid-cols-3 gap-2.5">
          {secondaryActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={i}
                onClick={action.onClick}
                disabled={action.disabled}
                whileTap={action.disabled ? undefined : { scale: 0.95 }}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-[var(--radius-card)] ${action.bg} border ${action.border} ${action.disabled ? "opacity-40" : ""}`}
              >
                <Icon size={18} className={action.color} />
                <span className={`text-[10px] font-medium ${action.color}`}>
                  {action.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </FadeUp>

      {/* Save Contact */}
      <FadeUp delay={1.6}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          className="w-full flex items-center justify-center gap-2 py-2.5 mt-3 rounded-[var(--radius-sm)] glass text-velora-text-muted text-xs opacity-40"
          disabled
        >
          <Bookmark size={13} />
          {t("save_contact")}
        </motion.button>
      </FadeUp>
    </div>
  );
}
