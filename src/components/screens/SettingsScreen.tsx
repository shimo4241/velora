"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Globe,
  Palette,
  Bell,
  Shield,
  LogOut,
  Check,
  Loader2,
  Moon,
  Sun,
} from "lucide-react";
import { GlassCard } from "@/components/ui";
import { StaggerChildren, StaggerItem } from "@/components/motion/animations";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { useTranslation, type Locale } from "@/lib/i18n";

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

  const [themeMode, setThemeMode] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      const storedTheme = localStorage.getItem("velora_theme") as "dark" | "light" | null;
      if (storedTheme) return storedTheme;
      const hasLightClass = document.documentElement.getAttribute("data-theme") === "light" || 
                            document.documentElement.classList.contains("light");
      return hasLightClass ? "light" : "dark";
    }
    return "dark";
  });

  if (!isProfileReady || !profile) return null;

  // Handles updating the app language
  const handleLanguageChange = async (lang: Locale) => {
    setSaving("locale");
    try {
      localStorage.setItem("velora_lang", lang);
      await updateProfile({ locale: lang });
      showToast({
        tone: "success",
        title: lang === "ar" ? "تم تغيير اللغة" : lang === "es" ? "Idioma cambiado" : lang === "en" ? "Language changed" : "Langue modifiée",
        message: lang === "ar" ? "تم تحديث اللغة بنجاح" : lang === "es" ? "Se ha actualizado el idioma" : lang === "en" ? "Language updated successfully" : "La langue a été mise à jour avec succès.",
      });
    } catch (error) {
      console.error("Language update failed:", error);
      showToast({
        tone: "error",
        title: "Error",
        message: "Failed to change language. Please try again.",
      });
    } finally {
      setSaving(null);
    }
  };

  // Handles toggling dark/light theme
  const handleThemeChange = (mode: "dark" | "light") => {
    setThemeMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("velora_theme", mode);
      if (mode === "light") {
        document.documentElement.setAttribute("data-theme", "light");
        document.documentElement.classList.add("light");
      } else {
        document.documentElement.setAttribute("data-theme", "dark");
        document.documentElement.classList.remove("light");
      }
      showToast({
        tone: "success",
        title: "Theme updated",
        message: mode === "light" ? "Sahara Pearl theme enabled." : "Moroccan Midnight theme enabled.",
      });
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
    } catch (_error) {
      // Revert local state on failure
      if (category === "notifications") {
        setNotifications((prev) => ({ ...prev, [field]: !value }));
      } else {
        setPrivacy((prev) => ({ ...prev, [field]: !value }));
      }
      showToast({
        tone: "error",
        title: "Settings error",
        message: "Could not save your preferences. Please try again.",
      });
    } finally {
      setSaving(null);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      onClose();
    } catch (_error) {
      showToast({
        tone: "error",
        title: "Logout failed",
        message: "An error occurred while logging out.",
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
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 bg-velora-black overflow-y-auto"
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
            {isRtl ? "رجوع" : currentLocale === "es" ? "Atrás" : currentLocale === "en" ? "Back" : "Retour"}
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

          {/* Section: Theme */}
          <StaggerItem>
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <Palette size={14} className="text-velora-gold" />
                <h3 className="text-xs uppercase tracking-wider text-velora-text-muted font-medium">
                  {t("settings_theme")}
                </h3>
              </div>
              <GlassCard className="p-3" hover={false}>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleThemeChange("dark")}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border text-xs font-medium transition-all ${
                      themeMode === "dark"
                        ? "bg-velora-gold/10 border-velora-gold/40 text-velora-gold"
                        : "bg-white/[0.02] border-white/5 text-velora-text-secondary hover:bg-white/[0.04]"
                    }`}
                  >
                    <Moon size={14} />
                    {t("settings_dark_mode")}
                  </button>
                  <button
                    onClick={() => handleThemeChange("light")}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border text-xs font-medium transition-all ${
                      themeMode === "light"
                        ? "bg-velora-gold/10 border-velora-gold/40 text-velora-gold"
                        : "bg-white/[0.02] border-white/5 text-velora-text-secondary hover:bg-white/[0.04]"
                    }`}
                  >
                    <Sun size={14} />
                    {t("settings_light_mode")}
                  </button>
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
                      {currentLocale === "fr" ? "Rapport par Email" : currentLocale === "es" ? "Resumen de Email" : currentLocale === "ar" ? "ملخص البريد الإلكتروني" : "Email Digests"}
                    </h4>
                    <p className="text-[11px] text-velora-text-muted">
                      {currentLocale === "fr" ? "Recevoir un résumé des connexions" : currentLocale === "es" ? "Recibir resúmenes de conexiones" : currentLocale === "ar" ? "تلقي ملخصات الاتصالات الأسبوعية" : "Receive weekly performance and connection summaries"}
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
                      {currentLocale === "fr" ? "Sons & Alertes" : currentLocale === "es" ? "Alertas de Sonido" : currentLocale === "ar" ? "تنبيهات الأصوات" : "Alert Sounds"}
                    </h4>
                    <p className="text-[11px] text-velora-text-muted">
                      {currentLocale === "fr" ? "Jouer un son lors d'un scan réussi" : currentLocale === "es" ? "Sonido al escanear correctamente" : currentLocale === "ar" ? "تشغيل صوت عند المسح الناجح" : "Play subtle feedback sounds during NFC/QR taps"}
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
                  {currentLocale === "fr" ? "Sécurité et Confidentialité" : currentLocale === "es" ? "Privacidad" : currentLocale === "ar" ? "الخصوصية والأمان" : "Privacy & Security"}
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
                      {currentLocale === "fr" ? "Indexation Google" : currentLocale === "es" ? "Indexación de Motores" : currentLocale === "ar" ? "فهرسة محركات البحث" : "Search Engine Indexing"}
                    </h4>
                    <p className="text-[11px] text-velora-text-muted">
                      {currentLocale === "fr" ? "Permettre aux moteurs de recherche d'indexer votre profil" : currentLocale === "es" ? "Permitir indexar perfil públicamente" : currentLocale === "ar" ? "السماح لمحركات البحث بفهرسة ملفك الشخصي" : "Allow Google and other engines to list your profile link"}
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
                      {currentLocale === "fr" ? "Visibilité de l'Email" : currentLocale === "es" ? "Visibilidad del Email" : currentLocale === "ar" ? "ظهور البريد الإلكتروني" : "Email Visibility"}
                    </h4>
                    <p className="text-[11px] text-velora-text-muted">
                      {currentLocale === "fr" ? "Afficher publiquement votre adresse email" : currentLocale === "es" ? "Mostrar dirección de correo en perfil" : currentLocale === "ar" ? "عرض عنوان البريد الإلكتروني علنًا" : "Show your email address as a public contact action"}
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="glass-strong border border-velora-rose/30 max-w-sm w-full p-5 rounded-2xl bg-velora-black/90 space-y-4"
            >
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-velora-text text-center">
                  {currentLocale === "fr" ? "Se déconnecter de VELORA ?" : currentLocale === "es" ? "¿Cerrar sesión de VELORA?" : currentLocale === "ar" ? "هل تريد تسجيل الخروج؟" : "Log out from VELORA?"}
                </h3>
                <p className="text-xs text-velora-text-muted text-center leading-relaxed">
                  {currentLocale === "fr" ? "Vous devrez vous reconnecter pour accéder à votre profil et vos insights." : currentLocale === "es" ? "Necesitarás iniciar sesión nuevamente para acceder a tu perfil." : currentLocale === "ar" ? "ستحتاج إلى تسجيل الدخول مرة أخرى للوصول إلى ملفك الشخصي." : "You will need to sign in again to manage your professional identity."}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3 rounded-lg border border-white/10 text-xs font-medium text-velora-text hover:bg-white/[0.03] transition-colors"
                >
                  {currentLocale === "fr" ? "Annuler" : currentLocale === "es" ? "Cancelar" : currentLocale === "ar" ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex-1 py-3 rounded-lg bg-velora-rose text-xs font-medium text-white hover:bg-velora-rose/90 transition-colors"
                >
                  {currentLocale === "fr" ? "Déconnexion" : currentLocale === "es" ? "Cerrar sesión" : currentLocale === "ar" ? "تسجيل الخروج" : "Log Out"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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
