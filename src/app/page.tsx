"use client";

import React, { useMemo, useState, useSyncExternalStore } from "react";
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
import { useAuth } from "@/components/providers/AuthProvider";
import { useProfileNullable } from "@/hooks/useProfile";
import { LoadingScreen } from "@/components/ui/States";
import type { AppTab } from "@/types";

/* ═══════════════════════════════════════════════════
   VELORA — App Orchestrator
   Splash → Welcome → Setup → Onboarding → App
   ═══════════════════════════════════════════════════ */

function getScreens(onTabChange: (tab: AppTab) => void): Record<AppTab, () => React.JSX.Element> {
  return {
    home: () => <HomeScreen onTabChange={onTabChange} />,
    identity: () => <ProfileScreen />,
    share: () => <ShareScreen />,
    discover: () => <NetworkScreen />,
    insights: () => <AnalyticsScreen />,
  };
}

function subscribeToOnboardingStorage(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => undefined;

  window.addEventListener("storage", onStoreChange);
  window.addEventListener("velora:onboarding-storage", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("velora:onboarding-storage", onStoreChange);
  };
}

function getStoredOnboardingSnapshot() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("velora_onboarded") === "true";
}

function VeloraAppInner() {
  const { user, loading: authLoading, isAuthReady } = useAuth();
  const {
    profile,
    isLoading: profileLoading,
    isProfileReady,
    error: profileError,
    refreshProfile,
    updateProfile,
  } = useProfileNullable();
  
  const [splashFinished, setSplashFinished] = useState(false);
  const [onboardingAcknowledged, setOnboardingAcknowledged] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>("home");
  const screens = useMemo(() => getScreens(setActiveTab), []);
  const hasStoredOnboarding = useSyncExternalStore(
    subscribeToOnboardingStorage,
    getStoredOnboardingSnapshot,
    () => false
  );
  const hasCompletedOnboarding = Boolean(
    profile?.onboarding?.productTourComplete ||
    onboardingAcknowledged ||
    hasStoredOnboarding
  );
  const isAuthRestoring = authLoading || !isAuthReady;
  const isProfileHydrating = Boolean(user && profileLoading);

  let phase: "splash" | "loading" | "welcome" | "setup" | "onboarding" | "app" | "error" = "splash";
  if (splashFinished) {
    if (isAuthRestoring || isProfileHydrating) {
      phase = "loading";
    } else if (user && profileError) {
      phase = "error";
    } else if (!user) {
      phase = "welcome";
    } else if (!isProfileReady || !profile) {
      phase = "setup";
    } else if (!hasCompletedOnboarding) {
      phase = "onboarding";
    } else {
      phase = "app";
    }
  }

  const handleSplashComplete = () => {
    setSplashFinished(true);
  };

  const handleOnboardingComplete = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("velora_onboarded", "true");
      window.dispatchEvent(new Event("velora:onboarding-storage"));
    }
    setOnboardingAcknowledged(true);

    if (profile) {
      const now = new Date().toISOString();
      void updateProfile({
        onboarding: {
          profileSetupComplete: true,
          productTourComplete: true,
          initializedAt: profile.onboarding?.initializedAt || now,
          updatedAt: now,
        },
      }).catch((error) => {
        console.error("[Onboarding Error] Failed to persist onboarding state:", error);
      });
    }
  };

  if (phase === "loading") {
    return (
      <LoadingScreen
        message={isAuthRestoring ? "Restauration de session..." : "Chargement du profil..."}
      />
    );
  }

  const renderApp = phase === "app" && Boolean(user) && isProfileReady && Boolean(profile);

  return (
    <div className="app-container">
      {/* Splash */}
      <AnimatePresence>
        {phase === "splash" && !splashFinished && (
          <SplashScreen onComplete={handleSplashComplete} />
        )}
      </AnimatePresence>

      {/* Welcome */}
      <AnimatePresence>
        {phase === "welcome" && (
          <WelcomeScreen onSuccess={() => undefined} />
        )}
      </AnimatePresence>

      {/* Profile bootstrap error */}
      <AnimatePresence>
        {phase === "error" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-velora-black px-6">
            <div className="w-full max-w-sm rounded-2xl border border-velora-rose/20 bg-velora-rose/10 p-5 text-center">
              <p className="text-sm font-medium text-velora-text mb-2">
                Initialisation du profil impossible
              </p>
              <p className="text-xs text-velora-text-muted mb-4">
                {profileError?.message || "Veuillez reessayer."}
              </p>
              <button
                onClick={() => void refreshProfile()}
                className="h-10 px-4 rounded-xl bg-velora-gold text-velora-black text-sm font-medium"
              >
                Reessayer
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Setup */}
      <AnimatePresence>
        {phase === "setup" && (
          <ProfileSetupScreen onComplete={() => undefined} />
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
  return <VeloraAppInner />;
}
