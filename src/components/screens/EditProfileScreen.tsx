"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Camera,
  Save,
  Loader2,
  Check,
  User,
  Briefcase,
  MapPin,
  Phone,
  Mail,
  Globe,
  FileText,
} from "lucide-react";
import { GlassCard, GoldButton } from "@/components/ui";
import { FadeUp, StaggerChildren, StaggerItem } from "@/components/motion/animations";
import { useProfile } from "@/hooks/useProfile";

/* ═══════════════════════════════════════════════════
   VELORA — Edit Profile Screen
   Luxury form with avatar upload · Firebase persistence
   ═══════════════════════════════════════════════════ */

interface EditProfileScreenProps {
  onClose: () => void;
}

export function EditProfileScreen({ onClose }: EditProfileScreenProps) {
  const { profile, updateProfile, uploadAvatar, isProfileReady } = useProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local form state
  const [form, setForm] = useState({
    fullName: profile?.fullName || "",
    title: profile?.title || "",
    company: profile?.company || "",
    location: profile?.location || "",
    bio: profile?.bio || "",
    phone: profile?.whatsapp || profile?.phone || "",
    email: profile?.email || "",
    website: profile?.website || "",
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatarUrl || "");

  if (!isProfileReady || !profile) return null;

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    // Upload to Firebase Storage
    setUploading(true);
    try {
      const url = await uploadAvatar(file);
      setAvatarPreview(url);
    } catch (err) {
      console.error("Avatar upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile(form);
      setSaved(true);
      setTimeout(() => { setSaved(false); onClose(); }, 1200);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { key: "fullName", label: "Nom complet", icon: User, placeholder: "Youssef El Amrani" },
    { key: "title", label: "Titre professionnel", icon: Briefcase, placeholder: "Founder & Creative Director" },
    { key: "company", label: "Entreprise", icon: Briefcase, placeholder: "VELORA Studios" },
    { key: "location", label: "Localisation", icon: MapPin, placeholder: "Casablanca, Morocco" },
    { key: "bio", label: "Bio", icon: FileText, placeholder: "Décrivez votre parcours...", multiline: true },
    { key: "phone", label: "Téléphone", icon: Phone, placeholder: "+212 6XX XXX XXX", type: "tel" },
    { key: "email", label: "Email", icon: Mail, placeholder: "you@velora.app", type: "email" },
    { key: "website", label: "Site web", icon: Globe, placeholder: "velora.app", type: "url" },
  ];

  const initials = form.fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("") || "V";

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 bg-velora-black overflow-y-auto"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-velora-black/80 border-b border-velora-border/20">
        <div className="flex items-center justify-between px-5 pt-14 pb-3">
          <button onClick={onClose} className="flex items-center gap-1 text-sm text-velora-text-muted">
            <ArrowLeft size={16} />
            Retour
          </button>
          <h2 className="text-heading text-base text-velora-text">
            Modifier le profil
          </h2>
          <GoldButton size="sm" onClick={handleSave} disabled={saving || saved}>
            {saved ? (
              <><Check size={12} /> Enregistré</>
            ) : saving ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <><Save size={12} /> Sauvegarder</>
            )}
          </GoldButton>
        </div>
      </div>

      {/* Avatar section */}
      <div className="px-5 pt-6 pb-4">
        <FadeUp>
          <div className="flex flex-col items-center">
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

              {/* Upload button overlay */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-velora-gold flex items-center justify-center shadow-lg"
              >
                {uploading ? (
                  <Loader2 size={14} className="text-velora-black animate-spin" />
                ) : (
                  <Camera size={14} className="text-velora-black" />
                )}
              </motion.button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            <div className="text-xs text-velora-text-muted mt-3">
              Appuyez pour changer la photo
            </div>
          </div>
        </FadeUp>
      </div>

      {/* Form fields */}
      <div className="px-5 pb-32">
        <StaggerChildren staggerDelay={0.04} delay={0.15} className="space-y-3">
          {fields.map((field) => {
            const Icon = field.icon;
            const value = form[field.key as keyof typeof form] || "";
            const isMultiline = "multiline" in field && field.multiline;

            return (
              <StaggerItem key={field.key}>
                <GlassCard className="p-3" hover={false}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={12} className="text-velora-gold/60" />
                    <label className="text-[10px] text-velora-text-muted uppercase tracking-wider">
                      {field.label}
                    </label>
                  </div>
                  {isMultiline ? (
                    <textarea
                      value={value}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      rows={3}
                      className="w-full bg-transparent text-sm text-velora-text placeholder:text-velora-text-muted/30 outline-none resize-none leading-relaxed"
                    />
                  ) : (
                    <input
                      type={"type" in field ? (field.type as string) : "text"}
                      value={value}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full bg-transparent text-sm text-velora-text placeholder:text-velora-text-muted/30 outline-none"
                    />
                  )}
                </GlassCard>
              </StaggerItem>
            );
          })}
        </StaggerChildren>
      </div>
    </motion.div>
  );
}
