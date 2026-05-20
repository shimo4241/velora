"use client";

import { useEffect, useState, useRef } from "react";
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
import { useToast } from "@/components/providers/ToastProvider";
import { getUploadErrorMessage, validateUploadImageFile } from "@/lib/firestore";

/* ═══════════════════════════════════════════════════
   VELORA — Edit Profile Screen
   Luxury form with avatar upload · Firebase persistence
   ═══════════════════════════════════════════════════ */

interface EditProfileScreenProps {
  onClose: () => void;
}

export function EditProfileScreen({ onClose }: EditProfileScreenProps) {
  const { profile, updateProfile, uploadAvatar, uploadCover, isProfileReady } = useProfile();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const previewUrlsRef = useRef<string[]>([]);

  // Local form state
  const [form, setForm] = useState({
    fullName: profile?.fullName || "",
    title: profile?.title || "",
    company: profile?.company || "",
    location: profile?.location || "",
    bio: profile?.bio || "",
    phone: profile?.phone || profile?.whatsapp || "",
    whatsapp: profile?.whatsapp || "",
    email: profile?.email || "",
    website: profile?.website || "",
    professionalMode: profile?.professionalMode || "entrepreneur",
    
    // Dentist fields
    specialty: profile?.specialty || "",
    clinicName: profile?.clinicName || "",
    orderNumber: profile?.orderNumber || "",
    fixedPhone: profile?.fixedPhone || "",
    googleMapsLink: profile?.googleMapsLink || "",
    appointmentLink: profile?.appointmentLink || "",
    clinicAddress: profile?.clinicAddress || "",
    workHours: profile?.workHours || "",
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatarUrl || "");

  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadCoverProgress, setUploadCoverProgress] = useState(0);
  const [coverPreview, setCoverPreview] = useState(profile?.coverUrl || "");

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current = [];
    };
  }, []);

  if (!isProfileReady || !profile) return null;

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.currentTarget.value = "";
    if (!file) {
      console.warn("[Upload:avatar] image-picker:no file selected");
      return;
    }

    const previousPreview = avatarPreview;
    setUploading(true);
    setUploadProgress(0);
    try {
      validateUploadImageFile(file, "avatar");
      const previewUrl = URL.createObjectURL(file);
      previewUrlsRef.current.push(previewUrl);
      setAvatarPreview(previewUrl);
      const url = await uploadAvatar(file, {
        onProgress: ({ percent }) => setUploadProgress(percent),
      });
      previewUrlsRef.current.forEach((objectUrl) => URL.revokeObjectURL(objectUrl));
      previewUrlsRef.current = [];
      setAvatarPreview(url);
      showToast({ tone: "success", title: "Avatar updated", message: "Your profile image has been uploaded." });
    } catch (err) {
      console.error("[Upload:avatar] edit screen failed:", err);
      setAvatarPreview(previousPreview);
      showToast({ tone: "error", title: "Avatar upload failed", message: getUploadErrorMessage(err, "avatar") });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.currentTarget.value = "";
    if (!file) {
      console.warn("[Upload:cover] image-picker:no file selected");
      return;
    }

    const previousPreview = coverPreview;
    setUploadingCover(true);
    setUploadCoverProgress(0);
    try {
      validateUploadImageFile(file, "cover");
      const previewUrl = URL.createObjectURL(file);
      previewUrlsRef.current.push(previewUrl);
      setCoverPreview(previewUrl);
      const url = await uploadCover(file, {
        onProgress: ({ percent }) => setUploadCoverProgress(percent),
      });
      previewUrlsRef.current.forEach((objectUrl) => URL.revokeObjectURL(objectUrl));
      previewUrlsRef.current = [];
      setCoverPreview(url);
      showToast({ tone: "success", title: "Cover updated", message: "Your cover image has been uploaded." });
    } catch (err) {
      console.error("[Upload:cover] edit screen failed:", err);
      setCoverPreview(previousPreview);
      showToast({ tone: "error", title: "Cover upload failed", message: getUploadErrorMessage(err, "cover") });
    } finally {
      setUploadingCover(false);
      setUploadCoverProgress(0);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        avatarUrl: avatarPreview,
        coverUrl: coverPreview,
      };
      await updateProfile(payload);
      setSaved(true);
      setTimeout(() => { setSaved(false); onClose(); }, 1200);
    } catch (err) {
      console.error("Save failed:", err);
      showToast({ tone: "error", title: "Save failed", message: err instanceof Error ? err.message : "Profile changes could not be saved." });
    } finally {
      setSaving(false);
    }
  };

  const baseFields = [
    { key: "fullName", label: "Nom complet", icon: User, placeholder: "Youssef El Amrani" },
    { key: "title", label: "Titre professionnel", icon: Briefcase, placeholder: "Founder & Creative Director" },
    { key: "company", label: "Entreprise", icon: Briefcase, placeholder: "VELORA Studios" },
    { key: "location", label: "Localisation", icon: MapPin, placeholder: "Casablanca, Morocco" },
    { key: "bio", label: "Bio", icon: FileText, placeholder: "Décrivez votre parcours...", multiline: true },
    { key: "phone", label: "Téléphone", icon: Phone, placeholder: "+212 6XX XXX XXX", type: "tel" },
    { key: "email", label: "Email", icon: Mail, placeholder: "you@velora.app", type: "email" },
    { key: "website", label: "Site web", icon: Globe, placeholder: "velora.app", type: "url" },
  ];

  const dentistFields = [
    { key: "specialty", label: "Spécialité dentaire", icon: Briefcase, placeholder: "Chirurgien-Dentiste, Orthodontiste..." },
    { key: "clinicName", label: "Nom de la clinique", icon: Briefcase, placeholder: "Cabinet Dentaire Dr. El Amrani" },
    { key: "orderNumber", label: "Numéro d'Ordre", icon: FileText, placeholder: "123456" },
    { key: "fixedPhone", label: "Téléphone fixe de la clinique", icon: Phone, placeholder: "+212 5XX XXX XXX", type: "tel" },
    { key: "whatsapp", label: "Numéro WhatsApp", icon: Phone, placeholder: "+212 6XX XXX XXX", type: "tel" },
    { key: "googleMapsLink", label: "Lien Google Maps", icon: MapPin, placeholder: "https://maps.app.goo.gl/..." },
    { key: "appointmentLink", label: "Lien de Réservation", icon: Globe, placeholder: "https://doctolib.fr/..." },
    { key: "clinicAddress", label: "Adresse de la clinique", icon: MapPin, placeholder: "123 Bd Anfa, Casablanca" },
    { key: "workHours", label: "Horaires de travail", icon: FileText, placeholder: "Lun - Ven: 09h00 - 18h00 / Sam: 09h00 - 13h00" },
  ];

  const fields = form.professionalMode === "dentist"
    ? [...baseFields.filter(f => f.key !== "phone" && f.key !== "company"), ...dentistFields]
    : baseFields;

  const initials = form.fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("") || "V";

  const modeOptions = [
    { value: "entrepreneur", label: "Entrepreneur" },
    { value: "corporate", label: "Corporate" },
    { value: "creative", label: "Creative" },
    { value: "nightlife", label: "Nightlife" },
    { value: "luxury", label: "Luxury" },
    { value: "dentist", label: "Dentiste (Cabinet Médical)" },
    { value: "creator", label: "Creator" },
    { value: "artist", label: "Artiste" },
    { value: "business", label: "Business" },
    { value: "vip", label: "VIP Member" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 bg-velora-black overflow-y-auto"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-md bg-velora-black/80 border-b border-velora-border/20">
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

      {/* Media sections */}
      <div className="px-5 pt-6 pb-4 space-y-6">
        {/* Cover upload */}
        <FadeUp>
          <div className="flex flex-col items-center">
            <div className="relative w-full max-w-[420px] aspect-[2.4/1] rounded-xl overflow-hidden border border-velora-border/40 bg-velora-surface">
              {coverPreview ? (
                <div
                  className="w-full h-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${coverPreview})` }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-velora-text-muted font-semibold">
                  Aucune image de couverture
                </div>
              )}
              {/* Upload button overlay */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => coverInputRef.current?.click()}
                className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-velora-gold flex items-center justify-center shadow-lg"
              >
                {uploadingCover ? (
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-velora-black px-1">
                    <Loader2 size={10} className="animate-spin" />
                    {uploadCoverProgress}%
                  </span>
                ) : (
                  <Camera size={14} className="text-velora-black" />
                )}
              </motion.button>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleCoverUpload}
                className="hidden"
              />
            </div>
            <div className="text-[11px] text-velora-text-muted mt-2">
              Bannière de couverture
            </div>
          </div>
        </FadeUp>

        {/* Avatar upload */}
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
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-velora-black">
                    <Loader2 size={12} className="animate-spin" />
                    {uploadProgress}%
                  </span>
                ) : (
                  <Camera size={14} className="text-velora-black" />
                )}
              </motion.button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            <div className="text-[11px] text-velora-text-muted mt-3">
              Photo de profil
            </div>
          </div>
        </FadeUp>
      </div>

      {/* Form fields */}
      <div className="px-5 pb-32">
        <StaggerChildren staggerDelay={0.04} delay={0.15} className="space-y-3">
          {/* Professional Mode Selector */}
          <StaggerItem>
            <GlassCard className="p-3" hover={false}>
              <div className="flex items-center gap-2 mb-2">
                <Briefcase size={12} className="text-velora-gold/60" />
                <label className="text-[10px] text-velora-text-muted uppercase tracking-wider">
                  Mode professionnel
                </label>
              </div>
              <select
                value={form.professionalMode}
                onChange={(e) => handleChange("professionalMode", e.target.value)}
                className="w-full bg-transparent text-sm text-velora-text outline-none border-none cursor-pointer focus:ring-0 focus:outline-none"
              >
                {modeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-velora-surface text-velora-text">
                    {opt.label}
                  </option>
                ))}
              </select>
            </GlassCard>
          </StaggerItem>

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

