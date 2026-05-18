"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BottomNav } from "@/components/ui/BottomNav";
import { SplashScreen, OnboardingScreen } from "@/components/onboarding";
import { HomeScreen } from "@/components/home";
import { ProfileScreen } from "@/components/screens/ProfileScreen";
import { ShareScreen } from "@/components/screens/ShareScreen";
import { NetworkScreen } from "@/components/screens/NetworkScreen";
import { AnalyticsScreen } from "@/components/screens/AnalyticsScreen";
import { LoginScreen } from "@/components/screens/LoginScreen";
import { AuthProvider, useAuth } from "@/components/providers/AuthProvider";
import { LoadingScreen } from "@/components/ui/States";
import type { AppTab } from "@/types";

/* ═══════════════════════════════════════════════════
   VELORA — App Orchestrator

   Thin routing layer. No business logic here.
   Splash → Onboarding → Login → App (5 tabs)
   ═══════════════════════════════════════════════════ */

const screens: Record<AppTab, () => React.JSX.Element> = {
  home: () => <HomeScreen />,
  identity: () => <ProfileScreen />,
  share: () => <ShareScreen />,
  discover: () => <NetworkScreen />,
  insights: () => <AnalyticsScreen />,
};

function VeloraAppInner() {
  const { user, loading: authLoading } = useAuth();
  const [phase, setPhase] = useState<"splash" | "onboarding" | "login" | "app">("splash");
  const [activeTab, setActiveTab] = useState<AppTab>("home");

  // After auth resolves, determine phase
  useEffect(() => {
    if (authLoading) return;
    if (phase === "splash") return; // Let splash finish naturally

    if (user) {
      // Check if onboarding was completed
      const onboarded = typeof window !== "undefined" && localStorage.getItem("velora_onboarded");
      if (onboarded) {
        setPhase("app");
      } else if (phase === "login") {
        // Just logged in, show onboarding
        setPhase("onboarding");
      }
    } else if (phase === "app" || phase === "onboarding") {
      // User signed out
      setPhase("login");
    }
  }, [user, authLoading, phase]);

  // After splash completes
  const handleSplashComplete = () => {
    if (authLoading) return; // Wait for auth
    if (user) {
      const onboarded = typeof window !== "undefined" && localStorage.getItem("velora_onboarded");
      setPhase(onboarded ? "app" : "onboarding");
    } else {
      setPhase("login");
    }
  };

  // After onboarding completes
  const handleOnboardingComplete = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("velora_onboarded", "true");
    }
    if (user) {
      setPhase("app");
    } else {
      setPhase("login");
    }
  };

  // After login succeeds
  const handleLoginSuccess = () => {
    const onboarded = typeof window !== "undefined" && localStorage.getItem("velora_onboarded");
    setPhase(onboarded ? "app" : "onboarding");
  };

  // Show loading while auth initializes during splash
  if (authLoading && phase !== "splash") {
    return <LoadingScreen />;
  }

  return (
    <div className="app-container">
      {/* Splash */}
      <AnimatePresence>
        {phase === "splash" && (
          <SplashScreen onComplete={handleSplashComplete} />
        )}
      </AnimatePresence>

      {/* Onboarding */}
      <AnimatePresence>
        {phase === "onboarding" && (
          <OnboardingScreen onComplete={handleOnboardingComplete} />
        )}
      </AnimatePresence>

      {/* Login */}
      <AnimatePresence>
        {phase === "login" && (
          <LoginScreen onSuccess={handleLoginSuccess} />
        )}
      </AnimatePresence>

      {/* Main app */}
      {phase === "app" && user && (
        <>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              {screens[activeTab]()}
            </motion.div>
          </AnimatePresence>

          <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        </>
      )}
    </div>
  );
}

export default function VeloraApp() {
  return (
    <AuthProvider>
      <VeloraAppInner />
    </AuthProvider>
  );
}
