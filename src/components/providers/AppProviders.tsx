"use client";
import { logger } from "@/lib/logger";


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
      const savedVisualTheme = localStorage.getItem("velora_visual_theme") || "gold";
      document.documentElement.setAttribute("data-theme", savedVisualTheme);
      if (savedVisualTheme === "medical") {
        document.documentElement.classList.add("light");
      } else {
        const savedTheme = localStorage.getItem("velora_theme") || "dark";
        if (savedTheme === "light") {
          document.documentElement.classList.add("light");
        } else {
          document.documentElement.classList.remove("light");
        }
      }
      // Register Firebase Messaging Service Worker dynamically on app load
      if ("serviceWorker" in navigator) {
        const configParams = {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
        };
        const query = new URLSearchParams(configParams).toString();
        const swUrl = `/firebase-messaging-sw.js?${query}`;
        
        navigator.serviceWorker
          .register(swUrl)
          .then((reg) => {
            logger.info("FCM Service Worker registered on app load:", reg.scope);
          })
          .catch((err) => {
            logger.error("FCM Service Worker registration failed on app load:", err);
          });
      }
    } catch (e) {
      logger.error("Error initializing lang/theme provider:", e);
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
