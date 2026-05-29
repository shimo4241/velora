"use client";
import { logger } from "@/lib/logger";


import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { ModalPortal } from "@/components/ui/ModalPortal";
import { Camera, Loader2, ArrowRight } from "lucide-react";
import { GlassCard, GoldButton } from "@/components/ui";
import { FadeUp, StaggerChildren, StaggerItem } from "@/components/features/motion/animations";
import {
  createProfile,
  generateUniqueUsername,
  getUploadErrorMessage,
  uploadAvatarImage,
  validateUploadImageFile,
} from "@/services";
import { useAuth } from "@/providers/AuthProvider";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/providers/ToastProvider";
import { useTranslation } from "@/lib/i18n";
import type { VeloraProfile, VeloraRole } from "@/types";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";

/* ═══════════════════════════════════════════════════
   VELORA — First-Time Profile Setup
   ═══════════════════════════════════════════════════ */

export function ProfileSetupScreen({ onComplete }: { onComplete: () => void }) {
  const { user } = useAuth();
  const { profile, refreshProfile, updateProfile } = useProfile();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlsRef = useRef<string[]>([]);

  const [form, setForm] = useState({
    fullName: profile?.fullName || user?.displayName || "",
    title: profile?.title || "",
    bio: profile?.bio || "",
    location: profile?.location || "Casablanca, Morocco",
    whatsapp: profile?.whatsapp || "",
    instagram: profile?.instagram || "",
    professionalMode: profile?.professionalMode || ("entrepreneur" as VeloraProfile["professionalMode"]),
  });

  const [setupError, setSetupError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatarUrl || user?.photoURL || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current = [];
    };
  }, []);

  const handleChange = (field: string, value: string) => {
    setSetupError("");
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.currentTarget.value = "";
    if (!file) {
      logger.warn("[Upload:avatar] image-picker:no file selected");
      return;
    }

    try {
      validateUploadImageFile(file, "avatar");
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current = [];
      const previewUrl = URL.createObjectURL(file);
      previewUrlsRef.current.push(previewUrl);
      setAvatarFile(file);
      setAvatarPreview(previewUrl);
    } catch (error) {
      logger.error("[Upload:avatar] setup image-picker failed", error);
      setAvatarFile(null);
      showToast({ tone: "error", title: t("setup_error_upload"), message: getUploadErrorMessage(error, "avatar") });
    }
  };

  const handleSubmit = async () => {

    if (!user) {
      logger.error("[ProfileSetup Error] Submission aborted: No authenticated user found.");
      setSetupError(t("setup_error_auth"));
      showToast({ tone: "error", title: t("setup_error_auth"), message: t("setup_error_auth") });
      return;
    }
    if (!form.fullName || !form.title || !form.whatsapp) {
      logger.warn("[ProfileSetup Warning] Submission aborted: Missing required fields.", {
        fullName: !!form.fullName,
        title: !!form.title,
        whatsapp: !!form.whatsapp
      });
      setSetupError(t("setup_error_required"));
      return;
    }


    setSaving(true);
    setSetupError("");
    try {
      let finalAvatarUrl = "";
      if (avatarFile) {
        setUploading(true);
        setUploadProgress(0);
        finalAvatarUrl = await uploadAvatarImage(user.uid, avatarFile, {
          onProgress: ({ percent }) => setUploadProgress(percent),
        });
      }

      const now = new Date().toISOString();
      const completedProfileData = {
        fullName: form.fullName,
        title: form.title,
        bio: form.bio,
        location: form.location,
        avatarUrl: finalAvatarUrl || profile?.avatarUrl || user.photoURL || "",
        professionalMode: form.professionalMode,
        role: (profile?.role || "free") as VeloraRole,
        isVerified: Boolean(profile?.isVerified),
        isPremium: Boolean(profile?.isPremium),
        isNoir: Boolean(profile?.isNoir),
        locale: profile?.locale || "fr",
        whatsapp: form.whatsapp,
        instagram: form.instagram,
        onboarding: {
          profileSetupComplete: true,
          productTourComplete: Boolean(profile?.onboarding?.productTourComplete),
          initializedAt: profile?.onboarding?.initializedAt || now,
          updatedAt: now,
        },
        updatedAt: now,
      };

      if (profile?.id) {
        await updateProfile(completedProfileData);
      } else {
        const finalUsername = await generateUniqueUsername(form.fullName || user.displayName || "member");
        await createProfile(user.uid, {
          ...completedProfileData,
          username: finalUsername,
          createdAt: now,
        });
      }

      await refreshProfile();

      onComplete();
    } catch (err) {
      logger.error("[ProfileSetup Error] Critical failure during setup:", err);
      const message = avatarFile ? getUploadErrorMessage(err, "avatar") : err instanceof Error ? err.message : t("setup_error_general");
      setSetupError(message);
      showToast({ tone: "error", title: t("setup_error_general"), message });
    } finally {
      setSaving(false);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const initials = form.fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("") || "V";

  return (
    <ModalPortal id="profile-setup">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed inset-0 z-[var(--z-modal)] bg-velora-black overflow-y-auto"
        style={{ willChange: "transform, opacity" }}
      >
      <div className="px-5 pt-14 pb-8 max-w-lg mx-auto">
        <FadeUp>
          <div className="text-center mb-8">
            <h1 className="text-display text-2xl text-velora-text mb-2">
              {t("setup_title")}
            </h1>
            <p className="text-xs text-velora-text-muted">
              {t("setup_subtitle")}
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
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarSelect}
                className="hidden"
              />
            </div>
            {uploading && (
              <div className="mt-3 flex items-center gap-2 text-xs text-velora-gold">
                <Loader2 size={13} className="animate-spin" />
                {uploadProgress}%
              </div>
            )}
          </div>
        </FadeUp>

        {/* Form Fields */}
        <StaggerChildren delay={0.2} staggerDelay={0.05} className="space-y-4 mb-8">
          {setupError && (
            <StaggerItem>
              <div className="p-3 rounded-lg bg-velora-rose/10 border border-velora-rose/20 text-velora-rose text-[11px] text-center">
                {setupError}
              </div>
            </StaggerItem>
          )}

          <StaggerItem>
            <GlassCard className="p-4" hover={false}>
              <label className="text-[10px] text-velora-text-muted uppercase tracking-wider mb-2 block">
                {t("setup_label_whatsapp")}
              </label>
              <PhoneInput
                international
                defaultCountry="MA"
                value={form.whatsapp}
                onChange={(value) => handleChange("whatsapp", value || "")}
                className="velora-phone-input"
              />
            </GlassCard>
          </StaggerItem>

          <StaggerItem>
            <GlassCard className="p-4" hover={false}>
              <label className="text-[10px] text-velora-text-muted uppercase tracking-wider mb-2 block">
                {t("setup_label_fullname")}
              </label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                placeholder={t("setup_placeholder_name")}
                className="w-full bg-transparent text-sm text-velora-text placeholder:text-velora-text-muted/30 outline-none"
              />
            </GlassCard>
          </StaggerItem>

          {profile?.username && (
            <StaggerItem>
              <GlassCard className="p-4 border-velora-gold/20" hover={false}>
                <label className="text-[10px] text-velora-text-muted uppercase tracking-wider mb-2 block">
                  {t("setup_label_username")}
                </label>
                <div className="flex items-center text-sm text-velora-text">
                  <span className="text-velora-text-muted mr-1">@</span>
                  <span>{profile.username}</span>
                </div>
              </GlassCard>
            </StaggerItem>
          )}


          <StaggerItem>
            <GlassCard className="p-4" hover={false}>
              <label className="text-[10px] text-velora-text-muted uppercase tracking-wider mb-2 block">
                {t("setup_label_title")}
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder={t("setup_placeholder_title")}
                className="w-full bg-transparent text-sm text-velora-text placeholder:text-velora-text-muted/30 outline-none"
              />
            </GlassCard>
          </StaggerItem>

          <StaggerItem>
            <GlassCard className="p-4" hover={false}>
              <label className="text-[10px] text-velora-text-muted uppercase tracking-wider mb-2 block">
                {t("setup_label_bio")}
              </label>
              <textarea
                value={form.bio}
                onChange={(e) => handleChange("bio", e.target.value)}
                placeholder={t("setup_placeholder_bio")}
                rows={3}
                className="w-full bg-transparent text-sm text-velora-text placeholder:text-velora-text-muted/30 outline-none resize-none"
              />
            </GlassCard>
          </StaggerItem>

          <StaggerItem>
            <GlassCard className="p-4" hover={false}>
              <label className="text-[10px] text-velora-text-muted uppercase tracking-wider mb-2 block">
                {t("setup_label_instagram")}
              </label>
              <input
                type="text"
                value={form.instagram}
                onChange={(e) => handleChange("instagram", e.target.value)}
                placeholder="@username"
                className="w-full bg-transparent text-sm text-velora-text placeholder:text-velora-text-muted/30 outline-none"
              />
            </GlassCard>
          </StaggerItem>

          <StaggerItem>
            <GlassCard className="p-4" hover={false}>
              <label className="text-[10px] text-velora-text-muted uppercase tracking-wider mb-2 block">
                {t("setup_label_location")}
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => handleChange("location", e.target.value)}
                placeholder={t("setup_placeholder_location")}
                className="w-full bg-transparent text-sm text-velora-text placeholder:text-velora-text-muted/30 outline-none"
              />
            </GlassCard>
          </StaggerItem>
          
          <StaggerItem>
            <GlassCard className="p-4" hover={false}>
              <label className="text-[10px] text-velora-text-muted uppercase tracking-wider mb-2 block">
                {t("setup_label_mode")}
              </label>
              <select
                value={form.professionalMode}
                onChange={(e) => handleChange("professionalMode", e.target.value)}
                className="w-full bg-transparent text-sm text-velora-text outline-none appearance-none font-medium"
              >
                <option value="entrepreneur" className="bg-velora-black text-velora-text">{t("setup_mode_entrepreneur")}</option>
                <option value="corporate" className="bg-velora-black text-velora-text">{t("setup_mode_corporate")}</option>
                <option value="creative" className="bg-velora-black text-velora-text">{t("setup_mode_creative")}</option>
                <option value="luxury" className="bg-velora-black text-velora-text">{t("setup_mode_luxury")}</option>
                <option value="nightlife" className="bg-velora-black text-velora-text">{t("setup_mode_nightlife")}</option>
              </select>
            </GlassCard>
          </StaggerItem>
        </StaggerChildren>

        <FadeUp delay={0.6}>
          <GoldButton
            fullWidth
            onClick={handleSubmit}
            disabled={!form.fullName || !form.title || !form.whatsapp || !isValidPhoneNumber(form.whatsapp || "") || saving || uploading}
          >
            {saving || uploading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {uploading ? `${uploadProgress}%` : null}
              </>
            ) : (
              <>
                {t("setup_submit")}
                <ArrowRight size={16} />
              </>
            )}
          </GoldButton>
        </FadeUp>
      </div>
      </motion.div>
    </ModalPortal>
  );
}
