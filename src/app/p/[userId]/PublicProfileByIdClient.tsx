"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { VeloraProfile, PortfolioItem, ExperienceEntry } from "@/types";
import { motion } from "framer-motion";
import { Shield, Sparkles, UserCheck, MapPin, Briefcase, Globe, ArrowLeft, Star } from "lucide-react";
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

  useEffect(() => {
    if (!isAuthReady) return;
    if (!user) {
      setLoadingConnection(false);
      return;
    }

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

  const isSelf = user?.uid === profile.id;

  return (
    <div className="min-h-screen bg-velora-black text-velora-text pb-24 relative overflow-x-hidden safe-bottom">
      {/* Background Glowing Orbs */}
      <div className="absolute top-[-10%] left-[-20%] w-[80vw] h-[80vw] rounded-full bg-[rgba(var(--identity-accent-rgb),0.03)] blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-20%] w-[70vw] h-[70vw] rounded-full bg-[rgba(var(--identity-secondary-rgb),0.02)] blur-[100px] pointer-events-none" />

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
        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] p-6 text-center shadow-[0_24px_76px_rgba(0,0,0,0.5)] backdrop-blur-md">
          {/* Accent glow line */}
          <div className="absolute inset-x-8 -top-16 h-32 rounded-full bg-[rgba(var(--identity-accent-rgb),0.1)] blur-xl pointer-events-none" />

          {/* Avatar Area */}
          <div className="relative mx-auto w-24 h-24 mb-4">
            <div className="w-full h-full rounded-full overflow-hidden border-2 border-velora-gold/30 p-1 bg-black/40">
              {profile.avatarUrl ? (
                <OptimizedImage
                  src={profile.avatarUrl}
                  type="avatar"
                  alt={profile.fullName}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-white/5 flex items-center justify-center text-velora-gold text-2xl font-bold uppercase">
                  {profile.fullName?.charAt(0) || "V"}
                </div>
              )}
            </div>
            {profile.isVerified && (
              <div className="absolute bottom-0 right-0 w-7 h-7 bg-black rounded-full border border-velora-gold/40 flex items-center justify-center text-velora-gold shadow-md">
                <Shield size={12} fill="currentColor" />
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="space-y-1 mb-4">
            <h1 className="text-2xl font-bold text-velora-text tracking-tight flex items-center justify-center gap-1.5">
              {profile.fullName}
              {profile.isPremium && (
                <Star size={16} className="text-velora-gold fill-velora-gold" />
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
            {isSelf ? (
              <div className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full border border-white/10 bg-white/5 text-xs font-semibold text-velora-text-muted">
                Votre profil public
              </div>
            ) : loadingConnection ? (
              <div className="w-full max-w-[280px] h-[46px] rounded-full bg-white/5 animate-pulse border border-white/5" />
            ) : isConnected ? (
              <div className="w-full max-w-[280px] rounded-full border border-velora-gold/30 bg-velora-gold/10 py-3 text-xs font-semibold text-velora-gold flex items-center justify-center gap-1.5">
                <UserCheck size={14} />
                Connecté
              </div>
            ) : (
              <button
                onClick={handleConnect}
                disabled={actionLoading}
                style={{
                  background: "linear-gradient(135deg, #DFBA6B, #C29B47)"
                }}
                className="w-full max-w-[280px] rounded-full py-3 text-xs font-semibold text-velora-black shadow-lg shadow-[rgba(223,186,107,0.2)] hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-1.5"
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
          <div className="mt-6 overflow-hidden rounded-[20px] border border-white/5 bg-white/[0.02] p-5 backdrop-blur-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-velora-gold mb-2.5">
              Biographie
            </h3>
            <p className="text-sm leading-relaxed text-velora-text-secondary whitespace-pre-line">
              {profile.bio}
            </p>
          </div>
        )}

        {/* Skills Section */}
        {profile.skills && profile.skills.length > 0 && (
          <div className="mt-6 overflow-hidden rounded-[20px] border border-white/5 bg-white/[0.02] p-5 backdrop-blur-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-velora-gold mb-3.5">
              Compétences
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
          <div className="mt-6 overflow-hidden rounded-[20px] border border-white/5 bg-white/[0.02] p-5 backdrop-blur-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-velora-gold mb-4">
              Expérience
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
          <div className="mt-6 overflow-hidden rounded-[20px] border border-white/5 bg-white/[0.02] p-5 backdrop-blur-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-velora-gold mb-4">
              Réalisations
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {portfolio.map((item) => (
                <div key={item.id} className="group relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] p-3 hover:border-velora-gold/30 transition-all">
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
