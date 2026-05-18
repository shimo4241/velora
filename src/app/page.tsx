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
import { WelcomeScreen } from "@/components/screens/WelcomeScreen";
import { ProfileSetupScreen } from "@/components/screens/ProfileSetupScreen";
import { AuthProvider, useAuth } from "@/components/providers/AuthProvider";
import { useProfileNullable } from "@/hooks/useProfile";
import { LoadingScreen } from "@/components/ui/States";
import type { AppTab } from "@/types";

/* ═══════════════════════════════════════════════════
   VELORA — App Orchestrator
   Splash → Welcome → Setup → Onboarding → App
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
  const { profile, loading: profileLoading } = useProfileNullable();
  
  const [phase, setPhase] = useState<"splash" | "welcome" | "setup" | "onboarding" | "app">("splash");
  const [splashFinished, setSplashFinished] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>("home");

  // Main Orchestration Effect
  useEffect(() => {
    if (!splashFinished) return;
    if (authLoading) return;

    if (!user) {
      setPhase("welcome");
      return;
    }

    if (profileLoading) return;

    if (!profile) {
      setPhase("setup");
      return;
    }

    const onboarded = typeof window !== "undefined" && localStorage.getItem("velora_onboarded");
    if (!onboarded) {
      setPhase("onboarding");
    } else {
      setPhase("app");
    }
  }, [splashFinished, user, authLoading, profile, profileLoading]);

  const handleSplashComplete = () => {
    setSplashFinished(true);
  };

  const handleOnboardingComplete = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("velora_onboarded", "true");
    }
    setPhase("app");
  };

  // Show a generic loading screen if splash is done but data is still fetching
  const isDataLoading = splashFinished && (authLoading || (user && profileLoading));

  if (isDataLoading && phase !== "welcome" && phase !== "setup" && phase !== "app") {
    return <LoadingScreen />;
  }

  // Ensure we don't render app components if profile is strictly null (e.g., during transition to setup)
  const renderApp = phase === "app" && profile !== null;

  return (
    <div className="app-container">
      {/* Splash */}
      <AnimatePresence>
        {phase === "splash" && !splashFinished && (
          <SplashScreen onComplete={handleSplashComplete} />
        )}
      </AnimatePresence>

      {/* Welcome (Anonymous Auth) */}
      <AnimatePresence>
        {phase === "welcome" && (
          <WelcomeScreen onSuccess={() => setPhase("setup")} />
        )}
      </AnimatePresence>

      {/* Setup */}
      <AnimatePresence>
        {phase === "setup" && (
          <ProfileSetupScreen onComplete={() => setPhase("onboarding")} />
        )}
      </AnimatePresence>

      {/* Onboarding */}
      <AnimatePresence>
        {phase === "onboarding" && (
          <OnboardingScreen onComplete={handleOnboardingComplete} />
        )}
      </AnimatePresence>

      {/* Main app */}
      {renderApp && (
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
