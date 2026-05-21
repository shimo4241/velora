"use client";

import { useEffect, type ReactNode } from "react";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ProfileProvider } from "@/components/providers/ProfileProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { useNativeRuntime } from "@/lib/nativeRuntime";

export function AppProviders({ children }: { children: ReactNode }) {
  useNativeRuntime();

  useEffect(() => {
    try {
      // Initialize language from localStorage
      const savedLang = localStorage.getItem("velora_lang") || "fr";
      const isRtl = savedLang === "ar";
      document.documentElement.lang = savedLang;
      document.documentElement.dir = isRtl ? "rtl" : "ltr";
      if (isRtl) {
        document.documentElement.classList.add("rtl");
      } else {
        document.documentElement.classList.remove("rtl");
      }

      // Initialize theme from localStorage
      const savedTheme = localStorage.getItem("velora_theme") || "dark";
      document.documentElement.setAttribute("data-theme", savedTheme);
      if (savedTheme === "light") {
        document.documentElement.classList.add("light");
      } else {
        document.documentElement.classList.remove("light");
      }
    } catch (e) {
      console.error("Error initializing lang/theme provider:", e);
    }
  }, []);

  return (
    <ToastProvider>
      <AuthProvider>
        <ProfileProvider>{children}</ProfileProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
