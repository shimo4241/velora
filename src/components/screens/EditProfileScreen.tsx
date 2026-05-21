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
  Star,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { GlassCard, GoldButton } from "@/components/ui";
import { FadeUp, StaggerChildren, StaggerItem } from "@/components/motion/animations";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/components/providers/ToastProvider";
import { getUploadErrorMessage, validateUploadImageFile } from "@/lib/firestore";
import { DentistFields } from "@/components/profile/DentistFields";

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
    skills: profile?.skills || [],
    
    // Dentist fields
    specialty: profile?.specialty || "",
    clinicName: profile?.clinicName || "",
    orderNumber: profile?.orderNumber || "",
    fixedPhone: profile?.fixedPhone || "",
    googleMapsLink: profile?.googleMapsLink || "",
    googleReviewsLink: profile?.googleReviewsLink || "",
    appointmentLink: profile?.appointmentLink || "",
    clinicAddress: profile?.clinicAddress || "",
    workHours: profile?.workHours || "",
    emergencyContact: profile?.emergencyContact || "",
  });

  // AI Profile Helper state
  const [aiPrompt, setAiPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<{ title: string; bio: string; skills: string[] } | null>(null);

  // New skill addition state
  const [newSkillInput, setNewSkillInput] = useState("");
  const handleAddSkill = () => {
    const val = newSkillInput.trim();
    if (val && !form.skills.includes(val)) {
      setForm((prev) => ({ ...prev, skills: [...prev.skills, val] }));
    }
    setNewSkillInput("");
  };

  const handleGenerateProfile = async () => {
    if (!aiPrompt.trim()) return;
    setGenerating(true);
    try {
      const response = await fetch("/api/ai/generate-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: aiPrompt }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      setAiResult(data);
      showToast({ tone: "success", title: "Profil généré", message: "Le profil IA a été généré avec succès." });
    } catch (err) {
      console.error(err);
      showToast({ tone: "error", title: "Erreur de génération", message: "Impossible de générer le profil IA." });
    } finally {
      setGenerating(false);
    }
  };

  const handleApplyAiProfile = () => {
    if (!aiResult) return;
    setForm((prev) => ({
      ...prev,
      title: aiResult.title,
      bio: aiResult.bio,
      skills: aiResult.skills,
    }));
    setAiResult(null);
    setAiPrompt("");
    showToast({ tone: "success", title: "Profil appliqué", message: "Le titre, la bio et les compétences ont été mis à jour." });
  };

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
    // 1. URL Validations
    const urlFields = [
      { key: "website", label: "Site web" },
      { key: "googleMapsLink", label: "Google Maps" },
      { key: "appointmentLink", label: "Lien de Réservation" },
      { key: "googleReviewsLink", label: "Lien Avis Google" }
    ];
    for (const f of urlFields) {
      const val = form[f.key as keyof typeof form];
      if (typeof val === "string" && val) {
        let isValid = false;
        try {
          const testUrl = val.startsWith("http://") || val.startsWith("https://") ? val : "https://" + val;
          new URL(testUrl);
          isValid = true;
        } catch {
          isValid = false;
        }
        if (!isValid) {
          showToast({
            tone: "error",
            title: "Lien invalide",
            message: `Le format du lien pour "${f.label}" n'est pas correct.`
          });
          return;
        }
      }
    }

    // 2. Phone Validations
    const phoneFields = [
      { key: "phone", label: "Téléphone" },
      { key: "fixedPhone", label: "Téléphone fixe" },
      { key: "whatsapp", label: "WhatsApp" },
      { key: "emergencyContact", label: "Contact d'Urgence" }
    ];
    const phonePattern = /^\+?[0-9\s\-()]{8,20}$/;
    for (const f of phoneFields) {
      const val = form[f.key as keyof typeof form];
      if (typeof val === "string" && val && !phonePattern.test(val)) {
        showToast({
          tone: "error",
          title: "Téléphone invalide",
          message: `Le numéro pour "${f.label}" doit contenir entre 8 et 20 chiffres.`
        });
        return;
      }
    }

    // 3. Order Number Validation for Dentist
    if (form.professionalMode === "dentist") {
      if (!form.orderNumber.trim()) {
        showToast({
          tone: "error",
          title: "Numéro d'Ordre requis",
          message: "Le numéro d'ordre national est obligatoire pour le profil Dentiste."
        });
        return;
      }
      const orderPattern = /^[a-zA-Z0-9\/\-\s]{3,20}$/;
      if (!orderPattern.test(form.orderNumber)) {
        showToast({
          tone: "error",
          title: "Numéro d'Ordre invalide",
          message: "Le numéro d'ordre doit contenir entre 3 et 20 caractères (lettres, chiffres, tirets, espaces ou slashs)."
        });
        return;
      }
    }

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

  const fields = baseFields;
  const profileMode = form.professionalMode;

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
          {/* AI Assistant Section */}
          <StaggerItem>
            <GlassCard className="p-4 border border-velora-gold/20 bg-gradient-to-br from-velora-black via-white/[0.02] to-velora-black" hover={false}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-full bg-velora-gold/10 flex items-center justify-center">
                  <Sparkles size={12} className="text-velora-gold" />
                </div>
                <label className="text-xs font-semibold text-velora-gold tracking-wide">
                  Assistant Profil IA
                </label>
              </div>
              <p className="text-[11px] text-velora-text-muted mb-3 leading-relaxed">
                Décrivez votre activité, vos spécialités et vos objectifs. Notre intelligence artificielle rédigera pour vous un titre percutant, une bio haut de gamme et des compétences adaptées.
              </p>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ex: Je suis un chirurgien-dentiste à Casablanca spécialisé en implantologie digitale avec 10 ans d'expérience. Je veux attirer des patients haut de gamme et collaborer avec d'autres cliniques."
                rows={3}
                className="w-full bg-white/[0.03] border border-white/10 rounded-lg p-2.5 text-xs text-velora-text placeholder:text-velora-text-muted/30 outline-none resize-none leading-relaxed focus:border-velora-gold/30 transition-colors"
              />
              <div className="mt-3 flex justify-end">
                <button
                  onClick={handleGenerateProfile}
                  disabled={generating || !aiPrompt.trim()}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-velora-black bg-velora-gold hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 shadow-md shadow-velora-gold/10"
                >
                  {generating ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <Sparkles size={12} />
                      Générer mon profil
                    </>
                  )}
                </button>
              </div>

              {/* Suggestion / Review area */}
              {aiResult && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                  <div className="text-[11px] font-semibold text-velora-gold">
                    Suggestion générée :
                  </div>
                  <div className="space-y-2 bg-white/[0.01] p-3 rounded-lg border border-white/[0.05]">
                    <div>
                      <div className="text-[10px] text-velora-text-muted uppercase tracking-wider">Titre</div>
                      <div className="text-xs text-velora-text font-medium mt-0.5">{aiResult.title}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-velora-text-muted uppercase tracking-wider">Bio</div>
                      <div className="text-xs text-velora-text-muted leading-relaxed mt-0.5">{aiResult.bio}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-velora-text-muted uppercase tracking-wider">Compétences</div>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {aiResult.skills.map((skill, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md bg-velora-gold/10 border border-velora-gold/20 text-[10px] text-velora-gold">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setAiResult(null)}
                      className="px-3 py-1.5 rounded-full text-[10px] font-medium text-velora-text-muted hover:text-velora-text transition-colors"
                    >
                      Ignorer
                    </button>
                    <button
                      onClick={handleApplyAiProfile}
                      className="px-3 py-1.5 rounded-full text-[10px] font-semibold text-velora-black bg-velora-gold hover:opacity-90 transition-all"
                    >
                      Appliquer au formulaire
                    </button>
                  </div>
                </div>
              )}
            </GlassCard>
          </StaggerItem>

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

          {/* Skills / Tags Section */}
          <StaggerItem>
            <GlassCard className="p-3" hover={false}>
              <div className="flex items-center gap-2 mb-2">
                <Star size={12} className="text-velora-gold/60" />
                <label className="text-[10px] text-velora-text-muted uppercase tracking-wider">
                  Compétences / Tags
                </label>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {form.skills.length === 0 ? (
                  <span className="text-xs text-velora-text-muted/40 italic">Aucune compétence ajoutée.</span>
                ) : (
                  form.skills.map((tag, idx) => (
                    <span
                      key={idx}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-velora-text hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-400 transition-colors cursor-pointer group"
                      onClick={() => {
                        setForm(prev => ({
                          ...prev,
                          skills: prev.skills.filter((_, i) => i !== idx)
                        }));
                      }}
                    >
                      {tag}
                      <span className="text-[10px] text-velora-text-muted group-hover:text-red-400 transition-colors">×</span>
                    </span>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ajouter une compétence..."
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  className="flex-1 bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-xs text-velora-text placeholder:text-velora-text-muted/30 outline-none focus:border-velora-gold/20"
                />
                <button
                  onClick={handleAddSkill}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-velora-black bg-velora-gold hover:opacity-90"
                >
                  Ajouter
                </button>
              </div>
            </GlassCard>
          </StaggerItem>

          {profileMode === "dentist" && (
            <DentistFields form={form} onChange={handleChange} />
          )}
        </StaggerChildren>
      </div>
    </motion.div>
  );
}

