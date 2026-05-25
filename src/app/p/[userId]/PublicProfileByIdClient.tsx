"use client";
import { logger } from "@/lib/logger";


import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/providers/ToastProvider";
import { useTranslation } from "@/lib/i18n";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { onNetworkConnectionStatusChange } from "@/services";
import { useFirestoreListener } from "@/hooks/useFirestoreListener";
import { useCanGoBack } from "@/hooks/useCanGoBack";
import { VeloraProfile, PortfolioItem, ExperienceEntry } from "@/types";

import { Shield, Sparkles, UserCheck, MapPin, Briefcase, Star, ChevronLeft } from "lucide-react";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { applyVisualTheme } from "@/themes";
import { getActiveTheme } from "@/components/features/profile/public/publicShared";

interface PublicProfileByIdClientProps {
  profile: VeloraProfile;
  portfolio: PortfolioItem[];
  experience: ExperienceEntry[];
}

export default function PublicProfileByIdClient({
  profile,
  portfolio,
  experience,
}: PublicProfileByIdClientProps) {
  const router = useRouter();
  const { user, isAuthReady } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const showBackButton = useCanGoBack();

  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const uid = user?.uid ?? null;
  const shouldCheckConnection = Boolean(uid && profile.id && uid !== profile.id);
  const connectionSnapshot = useFirestoreListener<boolean>(
    shouldCheckConnection ? `network-status:${uid}:${profile.id}` : null,
    shouldCheckConnection && uid
      ? (onNext, onError) => onNetworkConnectionStatusChange(uid, profile.id, onNext, onError)
      : null,
    false
  );

  useEffect(() => {
    if (profile.syncThemeToPublic && profile.visualTheme) {
      const originalTheme = localStorage.getItem("velora_visual_theme") || "gold";
      applyVisualTheme(profile.visualTheme, false);
      return () => {
        applyVisualTheme(originalTheme, false);
      };
    }
  }, [profile.syncThemeToPublic, profile.visualTheme]);

  const handleConnect = async () => {
    if (!user) {
      showToast({
        tone: "error",
        title: t("toast_auth_required_title"),
        message: t("toast_auth_required_msg")
      });
      router.push("/login");
      return;
    }

    if (user.uid === profile.id) {
      showToast({
        tone: "error",
        title: t("toast_self_connect_error_title"),
        message: t("toast_self_connect_error_msg")
      });
      return;
    }

    setActionLoading(true);
    try {
      await setDoc(doc(db, "users", user.uid, "network", profile.id), {
        uid: profile.id,
        name: profile.fullName || "",
        avatar: profile.avatarUrl || "",
        headline: profile.title || "",
        connectedAt: serverTimestamp(),
      });

      showToast({
        tone: "success",
        title: t("toast_network_updated_title"),
        message: `${profile.fullName} ${t("toast_network_updated_msg")}`
      });
    } catch (err) {
      logger.error("[Network:add] Failed to add to network:", err);
      showToast({
        tone: "error",
        title: t("toast_network_error_title"),
        message: t("toast_network_error_msg")
      });
    } finally {
      setActionLoading(false);
    }
  };

  const showLoading = !isAuthReady || Boolean(user && connectionSnapshot.loading);
  const isConnected = Boolean(uid && connectionSnapshot.data);
  const isSelf = user?.uid === profile.id;

  const theme = getActiveTheme(profile);
  const themeVars = {
    "--identity-accent": theme.accent,
    "--identity-accent-rgb": theme.accentRgb,
    "--identity-secondary": theme.secondary,
    "--identity-secondary-rgb": theme.secondaryRgb,
    "--identity-muted": theme.muted,
  } as React.CSSProperties;

  return (
    <div
      className="min-h-screen text-velora-text pb-24 relative overflow-x-hidden safe-bottom"
      style={{
        background: profile.syncThemeToPublic ? "var(--theme-bg)" : "var(--color-velora-black)",
        ...themeVars,
      }}
    >
      {/* Background System */}
      <div
        className="absolute inset-0 origin-center scale-110 pointer-events-none"
        style={{
          background: profile.syncThemeToPublic ? "var(--theme-hero-gradient)" : theme.heroGradient,
        }}
      />
      <div
        className="glow-layer absolute left-1/2 top-[240px] h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-85 blur-xl md:h-[400px] md:w-[400px] pointer-events-none"
        style={{
          background: profile.syncThemeToPublic ? "var(--theme-atmosphere)" : theme.atmosphere,
        }}
      />
      <div className="cinematic-overlay" />
      <div className="premium-vignette" />

      {showBackButton && (
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-velora-text border border-white/10 backdrop-blur-md transition-all"
          aria-label="Back"
        >
          <ChevronLeft size={20} />
        </button>
      )}

      {/* Header Bar */}
      <header className="relative z-10 px-4 py-4 flex items-center justify-center border-b border-white/5 bg-black/20 backdrop-blur-md">
        <span className="text-xs font-bold tracking-widest text-[var(--identity-accent)] uppercase">
          VELORA NETWORK
        </span>
      </header>

      {/* Profile Details Container */}
      <main className="max-w-3xl mx-auto px-4 mt-8 relative z-10">
        
        {/* Bento Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          
          {/* Hero Profile Card (col-span-12 md:col-span-8) */}
          <div className="col-span-12 md:col-span-8 relative overflow-hidden rounded-[28px] glass-strong p-6 text-center">
            {/* Accent glow line */}
            <div className="absolute inset-x-8 -top-16 h-32 rounded-full bg-[var(--identity-accent)]/10 blur-xl pointer-events-none" />

            {/* Avatar Area */}
            <div className="relative mx-auto mb-6 flex items-center justify-center h-[110px] w-[110px]">
              {/* Animated gold ambient halo */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[var(--identity-accent)]/20 via-[var(--identity-accent)]/10 to-transparent blur-xl opacity-75 animate-pulse" />
              
              {/* Conic gold metallic border */}
              <div className="avatar-gold-border h-[90px] w-[90px] relative z-10">
                <div className="h-full w-full rounded-full bg-black p-[3px]">
                  <div className="relative h-full w-full overflow-hidden rounded-full border border-white/10 bg-velora-surface shadow-inner">
                    {profile.avatarUrl ? (
                      <OptimizedImage
                        src={profile.avatarUrl}
                        type="avatar"
                        className="h-full w-full"
                        alt={profile.fullName}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_50%_20%,rgba(var(--identity-accent-rgb),0.22),transparent_48%),#111] font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--identity-accent)] uppercase">
                        {profile.fullName?.charAt(0) || "V"}
                      </div>
                    )}
                    <span className="pointer-events-none absolute inset-0 rounded-full bg-[linear-gradient(135deg,rgba(255,255,255,0.18),transparent_42%)]" />
                  </div>
                </div>
              </div>
              {profile.isVerified && (
                <div className="absolute bottom-0 right-0 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-[var(--identity-accent)]/45 bg-black/85 text-[var(--identity-accent)] shadow-md backdrop-blur-md">
                  <Shield size={12} fill="currentColor" />
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="space-y-1 mb-4">
              <h1 className="text-xl font-bold tracking-tight flex items-center justify-center gap-1.5">
                <span className="text-gold-gradient" style={{ backgroundImage: "linear-gradient(135deg, var(--identity-accent) 0%, var(--identity-secondary) 100%)" }}>{profile.fullName}</span>
                {profile.isPremium && (
                  <Star size={14} className="text-[var(--identity-accent)] fill-[var(--identity-accent)] filter drop-shadow-[0_0_8px_rgba(var(--identity-accent-rgb),0.5)]" />
                )}
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-[var(--identity-accent)] font-semibold">
                @{profile.username}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-velora-text-secondary mb-5">
              {profile.title && (
                <span className="flex items-center gap-1.5">
                  <Briefcase size={12} className="text-[var(--identity-accent)]" />
                  {profile.title}
                </span>
              )}
              {profile.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={12} className="text-[var(--identity-accent)]" />
                  {profile.location}
                </span>
              )}
            </div>

            {/* Connection CTA Button */}
            <div className="mt-5 flex justify-center">
              {showLoading ? (
                <div className="w-full max-w-[240px] h-[40px] rounded-full bg-white/5 animate-pulse border border-white/5" />
              ) : isSelf ? (
                <div className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full border border-white/10 bg-white/5 text-[11px] font-semibold text-velora-text-muted">
                  {t("public_profile_badge")}
                </div>
              ) : isConnected ? (
                <div className="btn-3d-glass w-full max-w-[240px] rounded-full py-2.5 text-xs font-semibold text-[var(--identity-accent)] flex items-center justify-center gap-1.5">
                  <UserCheck size={13} />
                  {t("relationship_status_connected")}
                </div>
              ) : (
                <button
                  onClick={handleConnect}
                  disabled={actionLoading}
                  className="btn-3d-primary w-full max-w-[240px] rounded-full py-2.5 text-xs font-semibold text-velora-black flex items-center justify-center gap-1.5"
                >
                  {actionLoading ? (
                    <span className="animate-spin text-velora-black">●</span>
                  ) : (
                    <Sparkles size={13} />
                  )}
                  {t("add_to_network")}
                </button>
              )}
            </div>
          </div>

          {/* Quick Metrics / Bio Summary Box (col-span-12 md:col-span-4) */}
          <div className="col-span-12 md:col-span-4 flex flex-col gap-4">
            {profile.bio ? (
              <div className="flex-1 overflow-hidden rounded-[20px] glass-strong p-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-wider mb-2 text-[var(--identity-accent)]">
                    {t("biography_header")}
                  </h3>
                  <p className="text-xs leading-relaxed text-velora-text-secondary whitespace-pre-line">
                    {profile.bio}
                  </p>
                </div>
                <div className="border-t border-white/5 pt-3 mt-3 flex items-center justify-between text-[10px] text-velora-text-muted">
                  <span>Verified Identity</span>
                  <Shield size={11} className="text-[var(--identity-accent)]" />
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-hidden rounded-[20px] glass-strong p-5 flex items-center justify-center text-center">
                <p className="text-xs text-velora-text-muted">
                  Velora Premium Identity Member
                </p>
              </div>
            )}
          </div>

          {/* Skills Section (col-span-12 md:col-span-6) */}
          {profile.skills && profile.skills.length > 0 && (
            <div className="col-span-12 md:col-span-6 overflow-hidden rounded-[20px] glass-strong p-5">
              <h3 className="text-[10px] font-bold uppercase tracking-wider mb-3 text-[var(--identity-accent)]">
                {t("skills_header")}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-velora-text-secondary"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Experience Section (col-span-12 md:col-span-6) */}
          {experience && experience.length > 0 && (
            <div className="col-span-12 md:col-span-6 overflow-hidden rounded-[20px] glass-strong p-5">
              <h3 className="text-[10px] font-bold uppercase tracking-wider mb-3.5 text-[var(--identity-accent)]">
                {t("experience_header")}
              </h3>
              <div className="space-y-3.5">
                {experience.map((exp) => (
                  <div key={exp.id} className="border-l border-[var(--identity-accent)]/20 pl-3 py-0.5">
                    <h4 className="text-xs font-semibold text-velora-text">{exp.role}</h4>
                    <p className="text-[11px] text-[var(--identity-accent)] font-medium">{exp.company}</p>
                    <p className="text-[10px] text-velora-text-muted mt-0.5">
                      {exp.startYear} — {exp.isCurrent ? t("present") : exp.endYear || ""}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Portfolio Section (col-span-12) */}
          {portfolio && portfolio.length > 0 && (
            <div className="col-span-12 overflow-hidden rounded-[20px] glass-strong p-5 mt-2">
              <h3 className="text-[10px] font-bold uppercase tracking-wider mb-4 text-[var(--identity-accent)]">
                {t("portfolio_header")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {portfolio.map((item) => (
                  <div key={item.id} className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:border-[var(--identity-accent)]/30 transition-all shadow-md">
                    {item.imageUrl && (
                      <div className="aspect-video w-full rounded-lg overflow-hidden mb-3 bg-black/40 relative">
                        <OptimizedImage
                          src={item.imageUrl}
                          type="portfolio"
                          alt={item.title}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    )}
                    <h4 className="text-xs font-semibold text-velora-text">{item.title}</h4>
                    {item.description && (
                      <p className="text-[11px] text-velora-text-secondary mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
