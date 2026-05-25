"use client";
import { logger } from "@/lib/logger";


import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { ModalPortal } from "@/components/ui/ModalPortal";
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
  Shield,
} from "lucide-react";
import { GlassCard, GoldButton } from "@/components/ui";
import { FadeUp, StaggerChildren, StaggerItem } from "@/components/features/motion/animations";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/providers/ToastProvider";
import { getUploadErrorMessage, validateUploadImageFile } from "@/services";
import { DentistFields } from "./DentistFields";
import { LocalAiWritingAssistant } from "./ProfileEditor";
import { useTranslation } from "@/lib/i18n";

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
  const { t } = useTranslation();
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
    certifications: profile?.certifications || [],
    
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

  // New skill addition state
  const [newSkillInput, setNewSkillInput] = useState("");
  const handleAddSkill = () => {
    const val = newSkillInput.trim();
    if (val && !form.skills.includes(val)) {
      setForm((prev) => ({ ...prev, skills: [...prev.skills, val] }));
    }
    setNewSkillInput("");
  };

  const [newCertInput, setNewCertInput] = useState("");
  const handleAddCert = () => {
    const val = newCertInput.trim();
    if (val && !form.certifications.includes(val)) {
      setForm((prev) => ({ ...prev, certifications: [...prev.certifications, val] }));
    }
    setNewCertInput("");
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
      logger.warn("[Upload:avatar] image-picker:no file selected");
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
      showToast({ tone: "success", title: t("toast_avatar_success_title"), message: t("toast_avatar_success_msg") });
    } catch (err) {
      logger.error("[Upload:avatar] edit screen failed:", err);
      setAvatarPreview(previousPreview);
      showToast({ tone: "error", title: t("toast_avatar_error_title"), message: getUploadErrorMessage(err, "avatar") });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.currentTarget.value = "";
    if (!file) {
      logger.warn("[Upload:cover] image-picker:no file selected");
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
      showToast({ tone: "success", title: t("toast_cover_success_title"), message: t("toast_cover_success_msg") });
    } catch (err) {
      logger.error("[Upload:cover] edit screen failed:", err);
      setCoverPreview(previousPreview);
      showToast({ tone: "error", title: t("toast_cover_error_title"), message: getUploadErrorMessage(err, "cover") });
    } finally {
      setUploadingCover(false);
      setUploadCoverProgress(0);
    }
  };

  const handleSave = async () => {
    // 1. URL Validations
    const urlFields = [
      { key: "website", labelKey: "field_website" },
      { key: "googleMapsLink", labelKey: "field_google_maps" },
      { key: "appointmentLink", labelKey: "field_booking_link" },
      { key: "googleReviewsLink", labelKey: "field_google_reviews" }
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
            title: t("toast_validation_link_invalid_title"),
            message: `${t("toast_validation_link_invalid_msg")} "${t(f.labelKey)}".`
          });
          return;
        }
      }
    }

    // 2. Phone Validations
    const phoneFields = [
      { key: "phone", labelKey: "field_phone" },
      { key: "fixedPhone", labelKey: "field_fixed_phone" },
      { key: "whatsapp", labelKey: "field_whatsapp" },
      { key: "emergencyContact", labelKey: "field_emergency_contact" }
    ];
    const phonePattern = /^\+?[0-9\s\-()]{8,20}$/;
    for (const f of phoneFields) {
      const val = form[f.key as keyof typeof form];
      if (typeof val === "string" && val && !phonePattern.test(val)) {
        showToast({
          tone: "error",
          title: t("toast_validation_phone_invalid_title"),
          message: `${t("toast_validation_phone_invalid_msg")} "${t(f.labelKey)}".`
        });
        return;
      }
    }

    // 3. Order Number Validation for Dentist
    if (form.professionalMode === "dentist") {
      if (!form.orderNumber.trim()) {
        showToast({
          tone: "error",
          title: t("toast_validation_order_required_title"),
          message: t("toast_validation_order_required_msg")
        });
        return;
      }
      const orderPattern = /^[a-zA-Z0-9\/\-\s]{3,20}$/;
      if (!orderPattern.test(form.orderNumber)) {
        showToast({
          tone: "error",
          title: t("toast_validation_order_invalid_title"),
          message: t("toast_validation_order_invalid_msg")
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
      logger.error("Save failed:", err);
      showToast({ tone: "error", title: t("setup_error_general"), message: err instanceof Error ? err.message : t("settings_error_msg") });
    } finally {
      setSaving(false);
    }
  };

  const baseFields = [
    { key: "fullName", labelKey: "field_fullname", icon: User, placeholderKey: "setup_placeholder_name" },
    { key: "title", labelKey: "setup_label_title", icon: Briefcase, placeholderKey: "setup_placeholder_title" },
    { key: "company", labelKey: "field_company", icon: Briefcase, placeholderKey: "placeholder_company" },
    { key: "location", labelKey: "setup_label_location", icon: MapPin, placeholderKey: "setup_placeholder_location" },
    { key: "bio", labelKey: "field_bio", icon: FileText, placeholderKey: "setup_placeholder_bio", multiline: true },
    { key: "phone", labelKey: "field_phone", icon: Phone, placeholderKey: "placeholder_phone", type: "tel" },
    { key: "email", labelKey: "field_email", icon: Mail, placeholderKey: "placeholder_email", type: "email" },
    { key: "website", labelKey: "field_website", icon: Globe, placeholderKey: "placeholder_website", type: "url" },
  ];

  const fields = baseFields;
  const profileMode = form.professionalMode;

  const initials = form.fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("") || "V";

  const modeOptions = [
    { value: "entrepreneur", labelKey: "setup_mode_entrepreneur" },
    { value: "corporate", labelKey: "setup_mode_corporate" },
    { value: "creative", labelKey: "setup_mode_creative" },
    { value: "nightlife", labelKey: "setup_mode_nightlife" },
    { value: "luxury", labelKey: "setup_mode_luxury" },
    { value: "dentist", labelKey: "mode_dentist" },
    { value: "creator", labelKey: "mode_creator" },
    { value: "artist", labelKey: "mode_artist" },
    { value: "business", labelKey: "mode_business" },
    { value: "vip", labelKey: "mode_vip" },
  ];

  return (
    <ModalPortal>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-[var(--z-modal)] bg-velora-black overflow-y-auto"
        style={{ willChange: "transform, opacity" }}
      >
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-md bg-velora-black/80 border-b border-velora-border/20">
        <div className="flex items-center justify-between px-5 pt-14 pb-3">
          <button onClick={onClose} className="flex items-center gap-1 text-sm text-velora-text-muted">
            <ArrowLeft size={16} />
            {t("settings_back")}
          </button>
          <h2 className="text-heading text-base text-velora-text">
            {t("edit_profile_title")}
          </h2>
          <GoldButton size="sm" onClick={handleSave} disabled={saving || saved}>
            {saved ? (
              <><Check size={12} /> {t("edit_profile_saved")}</>
            ) : saving ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <><Save size={12} /> {t("save")}</>
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
                  {t("edit_profile_no_cover")}
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
              {t("edit_profile_cover")}
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
              {t("edit_profile_avatar")}
            </div>
          </div>
        </FadeUp>
      </div>

      {/* Form fields */}
      <div className="px-5 pb-32">
        <StaggerChildren staggerDelay={0.04} delay={0.15} className="space-y-3">
          {/* AI Assistant Section */}
          <StaggerItem>
            <LocalAiWritingAssistant
              profile={{
                ...profile,
                title: form.title,
                company: form.company,
                location: form.location,
                bio: form.bio,
                skills: form.skills,
                professionalMode: form.professionalMode,
              }}
            />
          </StaggerItem>

          {/* Professional Mode Selector */}
          <StaggerItem>
            <GlassCard className="p-3" hover={false}>
              <div className="flex items-center gap-2 mb-2">
                <Briefcase size={12} className="text-velora-gold/60" />
                <label className="text-[10px] text-velora-text-muted uppercase tracking-wider">
                  {t("edit_profile_mode")}
                </label>
              </div>
              <select
                value={form.professionalMode}
                onChange={(e) => handleChange("professionalMode", e.target.value)}
                className="w-full bg-transparent text-sm text-velora-text outline-none border-none cursor-pointer focus:ring-0 focus:outline-none"
              >
                {modeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-velora-surface text-velora-text">
                    {t(opt.labelKey)}
                  </option>
                ))}
              </select>
            </GlassCard>
          </StaggerItem>

          {fields.map((field) => {
            const Icon = field.icon;
            const value = form[field.key as keyof typeof form] || "";
            const isMultiline = "multiline" in field && field.multiline;
            const fieldType = "type" in field ? (field.type as string) : "text";

            let inputMode: React.HTMLAttributes<HTMLInputElement>["inputMode"] = undefined;
            let autoCapitalize: string | undefined = undefined;
            let autoComplete: string | undefined = undefined;
            let autoCorrect: string | undefined = undefined;

            if (fieldType === "email") {
              inputMode = "email";
              autoCapitalize = "none";
              autoCorrect = "off";
              autoComplete = "email";
            } else if (fieldType === "tel") {
              inputMode = "tel";
              autoComplete = "tel";
            } else if (fieldType === "url" || field.key === "website") {
              inputMode = "url";
              autoCapitalize = "none";
              autoCorrect = "off";
              autoComplete = "off";
            }

            return (
              <StaggerItem key={field.key}>
                <GlassCard className="p-3" hover={false}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={12} className="text-velora-gold/60" />
                    <label className="text-[10px] text-velora-text-muted uppercase tracking-wider">
                      {t(field.labelKey)}
                    </label>
                  </div>
                  {isMultiline ? (
                    <textarea
                      value={value}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      placeholder={t(field.placeholderKey)}
                      rows={3}
                      className="w-full bg-transparent text-sm text-velora-text placeholder:text-velora-text-muted/30 outline-none resize-none leading-relaxed"
                    />
                  ) : (
                    <input
                      type={fieldType}
                      value={value}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      placeholder={t(field.placeholderKey)}
                      inputMode={inputMode}
                      autoCapitalize={autoCapitalize}
                      autoComplete={autoComplete}
                      autoCorrect={autoCorrect}
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
                  {t("edit_profile_skills_title")}
                </label>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {form.skills.length === 0 ? (
                  <span className="text-xs text-velora-text-muted/40 italic">{t("edit_profile_skills_empty")}</span>
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
                  placeholder={t("edit_profile_skills_placeholder")}
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
                  {t("edit_profile_skills_btn_add")}
                </button>
              </div>
            </GlassCard>
          </StaggerItem>

          {/* Certifications Section */}
          <StaggerItem>
            <GlassCard className="p-3" hover={false}>
              <div className="flex items-center gap-2 mb-2">
                <Shield size={12} className="text-velora-gold/60" />
                <label className="text-[10px] text-velora-text-muted uppercase tracking-wider">
                  {t("certifications") || "Certifications"}
                </label>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {form.certifications.length === 0 ? (
                  <span className="text-xs text-velora-text-muted/40 italic">Aucune certification enregistrée</span>
                ) : (
                  form.certifications.map((tag, idx) => (
                    <span
                      key={idx}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-velora-text hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-400 transition-colors cursor-pointer group"
                      onClick={() => {
                        setForm(prev => ({
                          ...prev,
                          certifications: prev.certifications.filter((_, i) => i !== idx)
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
                  placeholder="Ajouter une certification..."
                  value={newCertInput}
                  onChange={(e) => setNewCertInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCert();
                    }
                  }}
                  className="flex-1 bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-xs text-velora-text placeholder:text-velora-text-muted/30 outline-none focus:border-velora-gold/20"
                />
                <button
                  onClick={handleAddCert}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-velora-black bg-velora-gold hover:opacity-90"
                >
                  {t("edit_profile_skills_btn_add")}
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
    </ModalPortal>
  );
}
