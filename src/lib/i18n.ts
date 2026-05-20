/* ═══════════════════════════════════════════════════
   VELORA — Multilingual System
   French · Arabic · English · Spanish
   ═══════════════════════════════════════════════════ */

import fr from "../locales/fr.json";
import en from "../locales/en.json";
import ar from "../locales/ar.json";
import es from "../locales/es.json";

export type Locale = "fr" | "ar" | "en" | "es";

const locales: Record<Locale, Record<string, string>> = {
  fr: fr as Record<string, string>,
  en: en as Record<string, string>,
  ar: ar as Record<string, string>,
  es: es as Record<string, string>,
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
  const activeLocale = locales[locale] ? locale : "fr";
  return function t(key: string): string {
    return locales[activeLocale]?.[key] ?? key;
  };
}

/**
 * React hook for translations.
 */
export function useTranslation(locale: Locale = "fr") {
  // Try to load language from localStorage client-side
  let activeLocale = locale;
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("velora_lang") as Locale;
    if (saved && locales[saved]) {
      activeLocale = saved;
    }
  }

  const t = createTranslator(activeLocale);
  const isRtl = activeLocale === "ar";
  const dir = isRtl ? "rtl" : "ltr";

  return { t, locale: activeLocale, getGreetingKey, isRtl, dir };
}
