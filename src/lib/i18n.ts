/* ═══════════════════════════════════════════════════
   VELORA — Multilingual System
   French (primary) · Arabic · English
   ═══════════════════════════════════════════════════ */

export type Locale = "fr" | "ar" | "en";

type TranslationMap = Record<string, Record<Locale, string>>;

const translations: TranslationMap = {
  /* ── Greetings ── */
  greeting_morning: {
    fr: "Bonjour",
    ar: "صباح الخير",
    en: "Good morning",
  },
  greeting_afternoon: {
    fr: "Bon après-midi",
    ar: "مساء الخير",
    en: "Good afternoon",
  },
  greeting_evening: {
    fr: "Bonsoir",
    ar: "مساء الخير",
    en: "Good evening",
  },

  /* ── Navigation ── */
  nav_home: { fr: "Accueil", ar: "الرئيسية", en: "Home" },
  nav_identity: { fr: "Identité", ar: "الهوية", en: "Identity" },
  nav_share: { fr: "Partager", ar: "مشاركة", en: "Share" },
  nav_discover: { fr: "Découvrir", ar: "اكتشف", en: "Discover" },
  nav_insights: { fr: "Insights", ar: "إحصائيات", en: "Insights" },

  /* ── Home ── */
  quick_share: { fr: "Partage rapide", ar: "مشاركة سريعة", en: "Quick Share" },
  todays_activity: {
    fr: "Activité du jour",
    ar: "نشاط اليوم",
    en: "Today's Activity",
  },
  recent_activity: {
    fr: "Activité récente",
    ar: "النشاط الأخير",
    en: "Recent Activity",
  },
  profile_completion: {
    fr: "Profil complété à",
    ar: "اكتمال الملف الشخصي",
    en: "Profile complete",
  },
  professional_mode: {
    fr: "Mode professionnel",
    ar: "الوضع المهني",
    en: "Professional Mode",
  },

  /* ── Share ── */
  share_hub: { fr: "Partager", ar: "مشاركة", en: "Share Hub" },
  share_identity: {
    fr: "Partagez votre identité",
    ar: "شارك هويتك",
    en: "Share your identity",
  },
  whatsapp_share: {
    fr: "Envoyer via WhatsApp",
    ar: "إرسال عبر واتساب",
    en: "Send via WhatsApp",
  },
  nfc_tap: { fr: "Toucher NFC", ar: "نقرة NFC", en: "NFC Tap" },
  qr_code: { fr: "Code QR", ar: "رمز QR", en: "QR Code" },
  share_link: { fr: "Lien", ar: "رابط", en: "Share Link" },
  copy_link: { fr: "Copier le lien", ar: "نسخ الرابط", en: "Copy Link" },

  /* ── Profile ── */
  portfolio: { fr: "Portfolio", ar: "أعمال", en: "Portfolio" },
  experience: { fr: "Expérience", ar: "خبرة", en: "Experience" },
  connect: { fr: "Connecter", ar: "تواصل", en: "Connect" },
  present: { fr: "Présent", ar: "حالي", en: "Present" },
  verified: { fr: "Vérifié", ar: "موثّق", en: "Verified" },
  premium: { fr: "Premium", ar: "مميز", en: "Premium" },

  /* ── Actions ── */
  whatsapp: { fr: "WhatsApp", ar: "واتساب", en: "WhatsApp" },
  email: { fr: "Email", ar: "البريد", en: "Email" },
  call: { fr: "Appeler", ar: "اتصال", en: "Call" },
  book: { fr: "Réserver", ar: "حجز", en: "Book" },
  save_contact: {
    fr: "Enregistrer le contact",
    ar: "حفظ جهة الاتصال",
    en: "Save Contact",
  },

  /* ── Connections ── */
  met_at: { fr: "Rencontré à", ar: "التقينا في", en: "Met at" },
  introduced_by: { fr: "Présenté par", ar: "قدّمه", en: "Introduced by" },
  follow_up: { fr: "Suivi", ar: "متابعة", en: "Follow up" },

  /* ── Stats ── */
  views: { fr: "Vues", ar: "مشاهدات", en: "Views" },
  taps: { fr: "Taps", ar: "نقرات", en: "Taps" },
  scans: { fr: "Scans", ar: "مسح", en: "Scans" },
  clicks: { fr: "Clics", ar: "نقرات", en: "Clicks" },
  performance: { fr: "Performance", ar: "الأداء", en: "Performance" },

  /* ── Share (extended) ── */
  download_qr: {
    fr: "Télécharger le QR",
    ar: "تحميل رمز QR",
    en: "Download QR",
  },
  nfc_description: {
    fr: "Approchez votre téléphone d'un autre appareil pour partager votre profil",
    ar: "قرّب هاتفك من جهاز آخر لمشاركة ملفك",
    en: "Hold your phone near another device to share your profile",
  },
  ready: { fr: "Prêt", ar: "جاهز", en: "Ready" },
  other_methods: {
    fr: "Autres méthodes",
    ar: "طرق أخرى",
    en: "Other methods",
  },
  copied: { fr: "Copié !", ar: "تم النسخ!", en: "Copied!" },
  profile_link: {
    fr: "Votre lien de profil",
    ar: "رابط ملفك الشخصي",
    en: "Your profile link",
  },
  add_wallet: {
    fr: "Ajouter au Wallet",
    ar: "إضافة للمحفظة",
    en: "Add to Wallet",
  },
  soon: { fr: "Bientôt", ar: "قريبًا", en: "Soon" },

  /* ── Connections ── */
  scan_memory: {
    fr: "Mémoire de scan",
    ar: "ذاكرة المسح",
    en: "Scan Memory",
  },
  your_connections: {
    fr: "Vos connexions",
    ar: "اتصالاتك",
    en: "Your connections",
  },
  no_connections: {
    fr: "Aucune connexion pour le moment",
    ar: "لا توجد اتصالات حتى الآن",
    en: "No connections yet",
  },

  /* ── Onboarding ── */
  onboarding_skip: { fr: "Passer", ar: "تخطي", en: "Skip" },
  onboarding_continue: { fr: "Continuer", ar: "متابعة", en: "Continue" },
  onboarding_enter: {
    fr: "Entrer dans VELORA",
    ar: "دخول VELORA",
    en: "Enter VELORA",
  },
  tagline: {
    fr: "Votre identité, élevée",
    ar: "هويتك، بمستوى أعلى",
    en: "Your identity, elevated",
  },
};

/**
 * Returns a time-aware greeting key.
 */
export function getGreetingKey(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "greeting_morning";
  if (hour < 18) return "greeting_afternoon";
  return "greeting_evening";
}

/**
 * Translation function factory.
 * Returns a function that resolves a key to the localized string.
 */
export function createTranslator(locale: Locale) {
  return function t(key: string): string {
    return translations[key]?.[locale] ?? key;
  };
}

/**
 * React hook for translations.
 */
export function useTranslation(locale: Locale = "fr") {
  const t = createTranslator(locale);
  return { t, locale, getGreetingKey };
}
