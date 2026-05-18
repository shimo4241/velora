"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Camera, Loader2, ArrowRight } from "lucide-react";
import { GlassCard, GoldButton } from "@/components/ui";
import { FadeUp, StaggerChildren, StaggerItem } from "@/components/motion/animations";
import { updateProfile, uploadAvatar } from "@/lib/firestore";
import { useAuth } from "@/components/providers/AuthProvider";
import { formatMoroccanPhone } from "@/lib/auth";
import type { VeloraProfile } from "@/types";

/* ═══════════════════════════════════════════════════
   VELORA — First-Time Profile Setup
   ═══════════════════════════════════════════════════ */

export function ProfileSetupScreen({ onComplete }: { onComplete: () => void }) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    fullName: "",
    title: "",
    bio: "",
    location: "Casablanca, Morocco",
    whatsapp: user?.phoneNumber ? formatMoroccanPhone(user.phoneNumber) : "",
    instagram: "",
    professionalMode: "entrepreneur" as VeloraProfile["professionalMode"],
  });

  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!form.fullName || !form.title) return; // Basic validation

    setSaving(true);
    try {
      let finalAvatarUrl = "";
      if (avatarFile) {
        setUploading(true);
        finalAvatarUrl = await uploadAvatar(user.uid, avatarFile);
        setUploading(false);
      }

      await updateProfile(user.uid, {
        fullName: form.fullName,
        username: form.fullName.toLowerCase().replace(/\s+/g, ""), // naive generation
        title: form.title,
        bio: form.bio,
        location: form.location,
        avatarUrl: finalAvatarUrl,
        professionalMode: form.professionalMode,
        isVerified: false,
        isPremium: false,
        isNoir: false,
        locale: "fr",
      });

      onComplete();
    } catch (err) {
      console.error("Setup failed:", err);
      setSaving(false);
    }
  };

  const initials = form.fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("") || "V";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-0 z-50 bg-velora-black overflow-y-auto"
    >
      <div className="px-5 pt-14 pb-8 max-w-lg mx-auto">
        <FadeUp>
          <div className="text-center mb-8">
            <h1 className="text-display text-2xl text-velora-text mb-2">
              Créez votre identité
            </h1>
            <p className="text-xs text-velora-text-muted">
              Configurez votre profil professionnel VELORA
            </p>
          </div>
        </FadeUp>

        {/* Avatar Upload */}
        <FadeUp delay={0.1}>
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-velora-gold/30 bg-velora-surface">
                {avatarPreview ? (
                  <div
                    className="w-full h-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${avatarPreview})` }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-velora-gold font-[family-name:var(--font-display)]">
                    {initials}
                  </div>
                )}
              </div>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-velora-gold flex items-center justify-center shadow-lg"
              >
                <Camera size={14} className="text-velora-black" />
              </motion.button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarSelect}
                className="hidden"
              />
            </div>
          </div>
        </FadeUp>

        {/* Form Fields */}
        <StaggerChildren delay={0.2} staggerDelay={0.05} className="space-y-4 mb-8">
          <StaggerItem>
            <GlassCard className="p-4" hover={false}>
              <label className="text-[10px] text-velora-text-muted uppercase tracking-wider mb-2 block">
                Nom Complet
              </label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                placeholder="Ex: Youssef El Amrani"
                className="w-full bg-transparent text-sm text-velora-text placeholder:text-velora-text-muted/30 outline-none"
              />
            </GlassCard>
          </StaggerItem>

          <StaggerItem>
            <GlassCard className="p-4" hover={false}>
              <label className="text-[10px] text-velora-text-muted uppercase tracking-wider mb-2 block">
                Titre Professionnel
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="Ex: Founder & Creative Director"
                className="w-full bg-transparent text-sm text-velora-text placeholder:text-velora-text-muted/30 outline-none"
              />
            </GlassCard>
          </StaggerItem>

          <StaggerItem>
            <GlassCard className="p-4" hover={false}>
              <label className="text-[10px] text-velora-text-muted uppercase tracking-wider mb-2 block">
                Bio
              </label>
              <textarea
                value={form.bio}
                onChange={(e) => handleChange("bio", e.target.value)}
                placeholder="Une courte description de votre parcours..."
                rows={3}
                className="w-full bg-transparent text-sm text-velora-text placeholder:text-velora-text-muted/30 outline-none resize-none"
              />
            </GlassCard>
          </StaggerItem>

          <StaggerItem>
            <GlassCard className="p-4" hover={false}>
              <label className="text-[10px] text-velora-text-muted uppercase tracking-wider mb-2 block">
                Localisation
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => handleChange("location", e.target.value)}
                placeholder="Casablanca, Morocco"
                className="w-full bg-transparent text-sm text-velora-text placeholder:text-velora-text-muted/30 outline-none"
              />
            </GlassCard>
          </StaggerItem>
          
          <StaggerItem>
            <GlassCard className="p-4" hover={false}>
              <label className="text-[10px] text-velora-text-muted uppercase tracking-wider mb-2 block">
                Mode Professionnel
              </label>
              <select
                value={form.professionalMode}
                onChange={(e) => handleChange("professionalMode", e.target.value)}
                className="w-full bg-transparent text-sm text-velora-text outline-none appearance-none"
              >
                <option value="entrepreneur" className="bg-velora-black text-velora-text">Entrepreneur</option>
                <option value="corporate" className="bg-velora-black text-velora-text">Corporate</option>
                <option value="creative" className="bg-velora-black text-velora-text">Créatif</option>
                <option value="freelance" className="bg-velora-black text-velora-text">Freelance</option>
              </select>
            </GlassCard>
          </StaggerItem>
        </StaggerChildren>

        <FadeUp delay={0.6}>
          <GoldButton
            fullWidth
            onClick={handleSubmit}
            disabled={!form.fullName || !form.title || saving || uploading}
          >
            {saving || uploading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                Finaliser le profil
                <ArrowRight size={16} />
              </>
            )}
          </GoldButton>
        </FadeUp>
      </div>
    </motion.div>
  );
}
