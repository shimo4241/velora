"use client";
import { logger } from "@/lib/logger";


import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ModalPortal } from "@/components/ui/ModalPortal";
import {
  ArrowLeft,
  Globe,
  Palette,
  Bell,
  Shield,
  LogOut,
  Check,
  Loader2,
} from "lucide-react";
import { GlassCard } from "@/components/ui";
import { StaggerChildren, StaggerItem } from "@/components/features/motion/animations";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/providers/ToastProvider";
import { useTranslation, setAppLocale, type Locale } from "@/lib/i18n";
import { VISUAL_THEMES, applyVisualTheme, getRecommendedTheme } from "@/themes";
import { Sparkles } from "lucide-react";

/* ═══════════════════════════════════════════════════
   VELORA — Application Settings Screen
   Luxury medical & professional visual style
   ═══════════════════════════════════════════════════ */



interface SettingsScreenProps {
  onClose: () => void;
}

export function SettingsScreen({ onClose }: SettingsScreenProps) {
  const { profile, updateProfile, isProfileReady } = useProfile();
  const { signOut } = useAuth();
  const { showToast } = useToast();

  const currentLocale = profile?.locale || "fr";
  const { t, isRtl } = useTranslation(currentLocale);

  const [saving, setSaving] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);



  // Local settings state (synced with profile settings or fallback to defaults)
  const [notifications, setNotifications] = useState({
    push: profile?.settings?.notifications?.push ?? true,
    email: profile?.settings?.notifications?.email ?? true,
    connectionAlerts: profile?.settings?.notifications?.connectionAlerts ?? true,
  });

  const [privacy, setPrivacy] = useState({
    isPrivate: profile?.settings?.privacy?.isPrivate ?? false,
    allowIndexing: profile?.settings?.privacy?.allowIndexing ?? true,
    showEmail: profile?.settings?.privacy?.showEmail ?? true,
  });

  const [activeTheme, setActiveTheme] = useState<string>(profile?.visualTheme || "gold");

  const [syncThemeToPublic, setSyncThemeToPublic] = useState<boolean>(() => {
    return profile?.syncThemeToPublic ?? false;
  });

  const handleVisualThemeChange = async (themeId: string) => {
    setActiveTheme(themeId);
    setSaving("visualTheme");
    try {
      applyVisualTheme(themeId);
      await updateProfile({ visualTheme: themeId });
      showToast({
        tone: "success",
        title: "Thème mis à jour",
        message: "L'ambiance visuelle a été modifiée avec succès.",
      });
    } catch (error) {
      logger.error("Theme update failed:", error);
      showToast({
        tone: "error",
        title: t("settings_error"),
        message: t("settings_error_msg"),
      });
    } finally {
      setSaving(null);
    }
  };

  const handleSyncThemeToggle = async (checked: boolean) => {
    setSyncThemeToPublic(checked);
    setSaving("syncThemeToPublic");
    try {
      await updateProfile({ syncThemeToPublic: checked });
      showToast({
        tone: "success",
        title: "Profil public synchronisé",
        message: checked 
          ? "Votre thème s'appliquera désormais à votre profil public." 
          : "Votre profil public conservera l'apparence par défaut.",
      });
    } catch (error) {
      logger.error("Sync toggle failed:", error);
      setSyncThemeToPublic(!checked);
      showToast({
        tone: "error",
        title: t("settings_error"),
        message: t("settings_error_msg"),
      });
    } finally {
      setSaving(null);
    }
  };

  if (!isProfileReady || !profile) return null;

  // Handles updating the app language
  const handleLanguageChange = async (lang: Locale) => {
    setSaving("locale");
    try {
      setAppLocale(lang);
      await updateProfile({ locale: lang });
      showToast({
        tone: "success",
        title: t("settings_language_changed"),
        message: t("settings_language_changed_msg"),
      });
    } catch (error) {
      logger.error("Language update failed:", error);
      showToast({
        tone: "error",
        title: t("settings_error"),
        message: t("settings_error_msg"),
      });
    } finally {
      setSaving(null);
    }
  };



  // Generic settings updater for Firestore
  const updateSettingsField = async (
    category: "notifications" | "privacy",
    field: string,
    value: boolean
  ) => {
    const targetKey = `${category}_${field}`;
    setSaving(targetKey);

    // Optimistic local state update
    if (category === "notifications") {
      setNotifications((prev) => ({ ...prev, [field]: value }));
    } else {
      setPrivacy((prev) => ({ ...prev, [field]: value }));
    }

    try {
      const nextSettings = {
        notifications: {
          ...notifications,
          ...(category === "notifications" ? { [field]: value } : {}),
        },
        privacy: {
          ...privacy,
          ...(category === "privacy" ? { [field]: value } : {}),
        },
      };

      await updateProfile({ settings: nextSettings });
    } catch (error) {
      logger.error("Failed to update settings field:", error);
      // Revert local state on failure
      if (category === "notifications") {
        setNotifications((prev) => ({ ...prev, [field]: !value }));
      } else {
        setPrivacy((prev) => ({ ...prev, [field]: !value }));
      }
      showToast({
        tone: "error",
        title: t("settings_error"),
        message: t("settings_error_msg"),
      });
    } finally {
      setSaving(null);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      onClose();
    } catch (error) {
      logger.error("Logout failed:", error);
      showToast({
        tone: "error",
        title: t("settings_logout_error"),
        message: t("settings_logout_error_msg"),
      });
    }
  };

  const languages = [
    { code: "en", name: "English" },
    { code: "fr", name: "Français" },
    { code: "ar", name: "العربية" },
    { code: "es", name: "Español" },
  ];

  return (
    <ModalPortal id="settings">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-[var(--z-modal)] bg-velora-black overflow-y-auto"
        style={{ willChange: "transform, opacity" }}
        dir={isRtl ? "rtl" : "ltr"}
      >
      {/* Settings Navigation Bar */}
      <div className="sticky top-0 z-10 backdrop-blur-md bg-velora-black/80 border-b border-velora-border/20">
        <div className="flex items-center justify-between px-5 pt-14 pb-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-sm text-velora-text-muted hover:text-velora-text transition-colors"
          >
            <ArrowLeft size={16} className={isRtl ? "rotate-180" : ""} />
            {t("settings_back")}
          </button>
          <h2 className="text-heading text-base text-velora-text font-semibold">
            {t("settings")}
          </h2>
          <div className="w-12" /> {/* Spacer */}
        </div>
      </div>

      <div className="px-5 py-6 max-w-md mx-auto space-y-6 pb-24">
        <StaggerChildren staggerDelay={0.05} delay={0.1}>
          {/* Section: Language */}
          <StaggerItem>
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <Globe size={14} className="text-velora-gold" />
                <h3 className="text-xs uppercase tracking-wider text-velora-text-muted font-medium">
                  {t("settings_language")}
                </h3>
              </div>
              <GlassCard className="p-3 space-y-1.5" hover={false}>
                <div className="grid grid-cols-2 gap-2">
                  {languages.map((lang) => {
                    const isSelected = currentLocale === lang.code;
                    return (
                      <button
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code as Locale)}
                        disabled={saving === "locale"}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                          isSelected
                            ? "bg-velora-gold/10 border-velora-gold/40 text-velora-gold"
                            : "bg-white/[0.02] border-white/5 text-velora-text-secondary hover:bg-white/[0.04]"
                        }`}
                      >
                        <span>{lang.name}</span>
                        {isSelected && (
                          saving === "locale" ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Check size={12} />
                          )
                        )}
                      </button>
                    );
                  })}
                </div>
              </GlassCard>
            </div>
          </StaggerItem>

          {/* Section: Themes */}
          <StaggerItem>
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Palette size={14} className="text-velora-gold" />
                <h3 className="text-xs uppercase tracking-wider text-velora-text-muted font-medium">
                  Apparence & Thèmes
                </h3>
              </div>

              {/* Theme Grid */}
              <GlassCard className="p-4 space-y-4" hover={false}>
                <div className="grid grid-cols-1 gap-3">
                  {VISUAL_THEMES.map((theme) => {
                    const isSelected = activeTheme === theme.id;
                    const recommendedTheme = getRecommendedTheme(profile.professionalMode);
                    const isRecommended = recommendedTheme === theme.id;

                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => handleVisualThemeChange(theme.id)}
                        disabled={saving === "visualTheme"}
                        className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "bg-velora-gold/10 border-velora-gold/40 text-velora-text"
                            : "bg-white/[0.02] border-white/5 text-velora-text-secondary hover:bg-white/[0.04]"
                        }`}
                      >
                        {/* Circle Color Dot Preview */}
                        <div
                          className="w-10 h-10 rounded-lg shrink-0 border border-white/10 flex items-center justify-center relative shadow-inner"
                          style={{ backgroundColor: theme.bgPreview }}
                        >
                          <div
                            className="w-4 h-4 rounded-full shadow"
                            style={{ backgroundColor: theme.accentColor }}
                          />
                        </div>

                        {/* Title & Desc */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-velora-text truncate">
                              {theme.name}
                            </span>
                            {isRecommended && (
                              <span className="inline-flex items-center gap-0.5 text-[8px] font-bold uppercase tracking-wider text-velora-gold bg-velora-gold/10 px-1.5 py-0.5 rounded border border-velora-gold/20 shrink-0">
                                <Sparkles size={8} />
                                Recommandé
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-velora-text-muted mt-1 leading-relaxed">
                            {theme.description}
                          </p>
                        </div>

                        {/* Checkbox active state */}
                        <div className="shrink-0 pt-0.5">
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                              isSelected
                                ? "border-velora-gold bg-velora-gold text-velora-black"
                                : "border-white/20 bg-transparent"
                            }`}
                          >
                            {isSelected && <Check size={10} strokeWidth={3} />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="divider my-2" />

                {/* Public Profile Sync Toggle */}
                <div className="flex items-center justify-between py-2">
                  <div className="space-y-0.5 max-w-[75%]">
                    <h4 className="text-xs font-semibold text-velora-text">
                      Appliquer au profil public
                    </h4>
                    <p className="text-[10px] text-velora-text-muted leading-relaxed">
                      Synchronise l&apos;ambiance de votre profil public pour les visiteurs.
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={syncThemeToPublic}
                    onChange={handleSyncThemeToggle}
                    loading={saving === "syncThemeToPublic"}
                  />
                </div>
              </GlassCard>
            </div>
          </StaggerItem>

          {/* Section: Notifications */}
          <StaggerItem>
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <Bell size={14} className="text-velora-gold" />
                <h3 className="text-xs uppercase tracking-wider text-velora-text-muted font-medium">
                  {t("settings_notifications")}
                </h3>
              </div>
              <GlassCard className="p-4 divide-y divide-white/5" hover={false}>
                {/* Push Notifications Toggle */}
                <div className="flex items-center justify-between py-2.5">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-medium text-velora-text">
                      {t("settings_notifications")}
                    </h4>
                    <p className="text-[11px] text-velora-text-muted">
                      {t("settings_notifications_desc")}
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={notifications.push}
                    onChange={(checked) => updateSettingsField("notifications", "push", checked)}
                    loading={saving === "notifications_push"}
                  />
                </div>

                {/* Email Digest Toggle */}
                <div className="flex items-center justify-between py-2.5">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-medium text-velora-text">
                      {t("settings_email_digest")}
                    </h4>
                    <p className="text-[11px] text-velora-text-muted">
                      {t("settings_email_digest_desc")}
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={notifications.email}
                    onChange={(checked) => updateSettingsField("notifications", "email", checked)}
                    loading={saving === "notifications_email"}
                  />
                </div>

                {/* Connection Alerts Toggle */}
                <div className="flex items-center justify-between py-2.5">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-medium text-velora-text">
                      {t("settings_alert_sounds")}
                    </h4>
                    <p className="text-[11px] text-velora-text-muted">
                      {t("settings_alert_sounds_desc")}
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={notifications.connectionAlerts}
                    onChange={(checked) => updateSettingsField("notifications", "connectionAlerts", checked)}
                    loading={saving === "notifications_connectionAlerts"}
                  />
                </div>
              </GlassCard>
            </div>
          </StaggerItem>

          {/* Section: Privacy */}
          <StaggerItem>
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <Shield size={14} className="text-velora-gold" />
                <h3 className="text-xs uppercase tracking-wider text-velora-text-muted font-medium">
                  {t("settings_privacy_section")}
                </h3>
              </div>
              <GlassCard className="p-4 divide-y divide-white/5" hover={false}>
                {/* Private Mode Toggle */}
                <div className="flex items-center justify-between py-2.5">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-medium text-velora-text">
                      {t("settings_privacy")}
                    </h4>
                    <p className="text-[11px] text-velora-text-muted">
                      {t("settings_privacy_desc")}
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={privacy.isPrivate}
                    onChange={(checked) => updateSettingsField("privacy", "isPrivate", checked)}
                    loading={saving === "privacy_isPrivate"}
                  />
                </div>

                {/* Google / SEO Indexing Toggle */}
                <div className="flex items-center justify-between py-2.5">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-medium text-velora-text">
                      {t("settings_search_indexing")}
                    </h4>
                    <p className="text-[11px] text-velora-text-muted">
                      {t("settings_search_indexing_desc")}
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={privacy.allowIndexing}
                    onChange={(checked) => updateSettingsField("privacy", "allowIndexing", checked)}
                    loading={saving === "privacy_allowIndexing"}
                  />
                </div>

                {/* Show Email Toggle */}
                <div className="flex items-center justify-between py-2.5">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-medium text-velora-text">
                      {t("settings_email_visibility")}
                    </h4>
                    <p className="text-[11px] text-velora-text-muted">
                      {t("settings_email_visibility_desc")}
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={privacy.showEmail}
                    onChange={(checked) => updateSettingsField("privacy", "showEmail", checked)}
                    loading={saving === "privacy_showEmail"}
                  />
                </div>
              </GlassCard>
            </div>
          </StaggerItem>

          {/* Section: Logout Action */}
          <StaggerItem>
            <div className="pt-4">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-velora-rose/20 bg-velora-rose/5 text-velora-rose text-sm font-medium hover:bg-velora-rose/10 transition-colors"
              >
                <LogOut size={16} />
                {t("settings_logout")}
              </button>
            </div>
          </StaggerItem>
        </StaggerChildren>
      </div>

      {/* Logout Confirmation Dialog overlay */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[210] flex items-center justify-center bg-black/78 px-6 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)]"
            style={{ willChange: "opacity" }}
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-sm w-full p-5 rounded-2xl bg-velora-dark border border-white/10 space-y-4 max-h-full overflow-y-auto"
              style={{ willChange: "transform, opacity" }}
            >
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-velora-text text-center">
                  {t("settings_logout_title")}
                </h3>
                <p className="text-xs text-velora-text-muted text-center leading-relaxed">
                  {t("settings_logout_message")}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3 rounded-lg border border-white/10 text-xs font-medium text-velora-text hover:bg-white/[0.03] transition-colors"
                >
                  {t("cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex-1 py-3 rounded-lg bg-velora-rose text-xs font-medium text-white hover:bg-velora-rose/90 transition-colors"
                >
                  {t("settings_logout_confirm")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </motion.div>
    </ModalPortal>
  );
}

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  loading?: boolean;
}

function ToggleSwitch({ checked, onChange, loading = false }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      onClick={() => !loading && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? "bg-velora-gold" : "bg-white/10"
      } ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
    >
      <span
        className={`pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-velora-black shadow ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        } flex items-center justify-center`}
      >
        {loading && <Loader2 size={10} className="animate-spin text-velora-gold" />}
      </span>
    </button>
  );
}
