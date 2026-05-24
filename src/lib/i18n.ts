import { useState, useEffect } from "react";
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
 * Programmatically updates the app locale, stores it in localStorage,
 * updates HTML dir and lang, and notifies all active useTranslation hooks.
 */
export function setAppLocale(lang: Locale) {
  if (typeof window !== "undefined") {
    localStorage.setItem("velora_lang", lang);
    const isRtl = lang === "ar";
    document.documentElement.lang = lang;
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
    if (isRtl) {
      document.documentElement.classList.add("rtl");
    } else {
      document.documentElement.classList.remove("rtl");
    }
    window.dispatchEvent(new CustomEvent("velora_locale_change", { detail: lang }));
  }
}

/**
 * React hook for translations. Reacts to locale changes.
 */
export function useTranslation(defaultLocale: Locale = "fr") {
  const [activeLocale, setActiveLocale] = useState<Locale>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("velora_lang") as Locale;
      if (saved && locales[saved]) {
        return saved;
      }
    }
    return defaultLocale;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleLocaleChange = (e: Event) => {
      const customEvent = e as CustomEvent<Locale>;
      if (customEvent.detail && locales[customEvent.detail]) {
        setActiveLocale(customEvent.detail);
      }
    };

    window.addEventListener("velora_locale_change", handleLocaleChange);
    return () => {
      window.removeEventListener("velora_locale_change", handleLocaleChange);
    };
  }, []);

  const t = createTranslator(activeLocale);
  const isRtl = activeLocale === "ar";
  const dir = isRtl ? "rtl" : "ltr";

  return { t, locale: activeLocale, getGreetingKey, isRtl, dir };
}

