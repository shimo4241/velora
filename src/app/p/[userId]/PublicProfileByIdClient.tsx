"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { VeloraProfile, PortfolioItem, ExperienceEntry } from "@/types";

import { Shield, Sparkles, UserCheck, MapPin, Briefcase, ArrowLeft, Star } from "lucide-react";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

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

  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [loadingConnection, setLoadingConnection] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const [lastUid, setLastUid] = useState<string | undefined>(user?.uid);
  if (user?.uid !== lastUid) {
    setLastUid(user?.uid);
    setLoadingConnection(true);
    setIsConnected(false);
  }

  useEffect(() => {
    if (!isAuthReady || !user) return;

    const docRef = doc(db, "users", user.uid, "network", profile.id);
    const unsub = onSnapshot(
      docRef,
      (snap) => {
        setIsConnected(snap.exists());
        setLoadingConnection(false);
      },
      (err) => {
        console.error("Error reading connection snapshot:", err);
        setLoadingConnection(false);
      }
    );

    return () => unsub();
  }, [user, isAuthReady, profile.id]);

  const handleConnect = async () => {
    if (!user) {
      showToast({
        tone: "error",
        title: "Connexion requise",
        message: "Veuillez vous connecter pour ajouter un membre à votre réseau."
      });
      router.push("/login");
      return;
    }

    if (user.uid === profile.id) {
      showToast({
        tone: "error",
        title: "Action impossible",
        message: "Vous ne pouvez pas vous ajouter à votre propre réseau."
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
        title: "Réseau mis à jour",
        message: `${profile.fullName} a été ajouté à votre réseau.`
      });
    } catch (err) {
      console.error("[Network:add] Failed to add to network:", err);
      showToast({
        tone: "error",
        title: "Erreur",
        message: "Impossible d'ajouter ce profil à votre réseau."
      });
    } finally {
      setActionLoading(false);
    }
  };

  const showLoading = !isAuthReady || (user ? loadingConnection : false);
  const isSelf = user?.uid === profile.id;

  return (
    <div className="min-h-screen luxury-background text-velora-text pb-24 relative overflow-x-hidden safe-bottom">
      {/* Background System */}
      <div className="gold-ambient animate-breathe" />
      <div className="cinematic-overlay" />
      <div className="premium-vignette" />

      {/* Header Bar */}
      <header className="relative z-10 px-4 py-4 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-md">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-xs font-semibold text-velora-text-secondary hover:text-velora-text transition-colors bg-white/5 px-3 py-1.5 rounded-full border border-white/5"
        >
          <ArrowLeft size={14} />
          Retour
        </button>
        <span className="text-xs font-bold tracking-widest text-velora-gold uppercase">
          VELORA NETWORK
        </span>
        <div className="w-[74px]" /> {/* Spacer */}
      </header>

      {/* Profile Details Container */}
      <main className="max-w-xl mx-auto px-4 mt-8 relative z-10">
        {/* Profile Card */}
        <div className="relative overflow-hidden rounded-[28px] glass-strong p-6 text-center">
          {/* Accent glow line */}
          <div className="absolute inset-x-8 -top-16 h-32 rounded-full bg-velora-gold/10 blur-xl pointer-events-none" />

          {/* Avatar Area */}
          <div className="relative mx-auto mb-6 flex items-center justify-center h-[120px] w-[120px]">
            {/* Animated gold ambient halo */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-velora-gold/20 via-velora-gold-dim/10 to-transparent blur-xl opacity-75 animate-pulse" />
            
            {/* Double pulsing luxury halo rings */}
            <div className="pulsing-ring animate-breathe" />
            <div className="pulsing-ring-2" />
            
            {/* Conic gold metallic border */}
            <div className="avatar-gold-border h-[100px] w-[100px] relative z-10">
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
                    <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_50%_20%,rgba(196,162,101,0.22),transparent_48%),#111] font-[family-name:var(--font-display)] text-2xl font-semibold text-velora-gold uppercase">
                      {profile.fullName?.charAt(0) || "V"}
                    </div>
                  )}
                  <span className="pointer-events-none absolute inset-0 rounded-full bg-[linear-gradient(135deg,rgba(255,255,255,0.18),transparent_42%)]" />
                </div>
              </div>
            </div>
            {profile.isVerified && (
              <div className="absolute bottom-1 right-1 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-velora-gold/45 bg-black/85 text-velora-gold shadow-[0_0_12px_rgba(196,162,101,0.35)] backdrop-blur-md">
                <Shield size={12} fill="currentColor" />
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="space-y-1 mb-4">
            <h1 className="text-2xl font-bold tracking-tight flex items-center justify-center gap-1.5">
              <span className="text-gold-gradient">{profile.fullName}</span>
              {profile.isPremium && (
                <Star size={16} className="text-velora-gold fill-velora-gold filter drop-shadow-[0_0_8px_rgba(196,162,101,0.5)]" />
              )}
            </h1>
            <p className="text-xs uppercase tracking-widest text-velora-gold font-semibold">
              @{profile.username}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-velora-text-secondary mb-6">
            {profile.title && (
              <span className="flex items-center gap-1.5">
                <Briefcase size={12} className="text-velora-gold" />
                {profile.title}
              </span>
            )}
            {profile.location && (
              <span className="flex items-center gap-1.5">
                <MapPin size={12} className="text-velora-gold" />
                {profile.location}
              </span>
            )}
          </div>

          {/* Connection CTA Button */}
          <div className="mt-6 flex justify-center">
            {showLoading ? (
              <div className="w-full max-w-[280px] h-[46px] rounded-full bg-white/5 animate-pulse border border-white/5" />
            ) : isSelf ? (
              <div className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full border border-white/10 bg-white/5 text-xs font-semibold text-velora-text-muted">
                Votre profil public
              </div>
            ) : isConnected ? (
              <div className="btn-3d-glass w-full max-w-[280px] rounded-full py-3 text-xs font-semibold text-velora-gold flex items-center justify-center gap-1.5">
                <UserCheck size={14} />
                Connecté
              </div>
            ) : (
              <button
                onClick={handleConnect}
                disabled={actionLoading}
                className="btn-3d-primary w-full max-w-[280px] rounded-full py-3 text-xs font-semibold text-velora-black flex items-center justify-center gap-1.5"
              >
                {actionLoading ? (
                  <span className="animate-spin text-velora-black">●</span>
                ) : (
                  <Sparkles size={14} />
                )}
                Ajouter à mon réseau
              </button>
            )}
          </div>
        </div>

        {/* Bio Section */}
        {profile.bio && (
          <div className="mt-6 overflow-hidden rounded-[20px] glass-strong p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider mb-2.5">
              <span className="text-gold-gradient">Biographie</span>
            </h3>
            <p className="text-sm leading-relaxed text-velora-text-secondary whitespace-pre-line">
              {profile.bio}
            </p>
          </div>
        )}

        {/* Skills Section */}
        {profile.skills && profile.skills.length > 0 && (
          <div className="mt-6 overflow-hidden rounded-[20px] glass-strong p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider mb-3.5">
              <span className="text-gold-gradient">Compétences</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-velora-text-secondary"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Experience Section */}
        {experience && experience.length > 0 && (
          <div className="mt-6 overflow-hidden rounded-[20px] glass-strong p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider mb-4">
              <span className="text-gold-gradient">Expérience</span>
            </h3>
            <div className="space-y-4">
              {experience.map((exp) => (
                <div key={exp.id} className="border-l border-velora-gold/20 pl-4 py-0.5">
                  <h4 className="text-sm font-semibold text-velora-text">{exp.role}</h4>
                  <p className="text-xs text-velora-gold font-medium">{exp.company}</p>
                  <p className="text-[11px] text-velora-text-muted mt-0.5">
                    {exp.startYear} — {exp.isCurrent ? "Présent" : exp.endYear || ""}
                  </p>
                  {exp.description && (
                    <p className="text-xs text-velora-text-secondary mt-1.5 leading-relaxed">
                      {exp.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Portfolio Section */}
        {portfolio && portfolio.length > 0 && (
          <div className="mt-6 overflow-hidden rounded-[20px] glass-strong p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider mb-4">
              <span className="text-gold-gradient">Réalisations</span>
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {portfolio.map((item) => (
                <div key={item.id} className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:border-velora-gold/30 transition-all shadow-md">
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
                  <h4 className="text-sm font-semibold text-velora-text">{item.title}</h4>
                  {item.description && (
                    <p className="text-xs text-velora-text-secondary mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
