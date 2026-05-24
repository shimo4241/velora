"use client";

import React, { memo, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { BottomNav } from "@/components/ui/BottomNav";
import { SplashScreen, OnboardingScreen } from "@/components/onboarding";
import { HomeScreen } from "@/components/home";
import { WelcomeScreen } from "@/components/screens/WelcomeScreen";
import { ProfileSetupScreen } from "@/components/screens/ProfileSetupScreen";
import { useAuth } from "@/components/providers/AuthProvider";
import { useProfileNullable } from "@/hooks/useProfile";
import { LoadingScreen } from "@/components/ui/States";
import { useTranslation } from "@/lib/i18n";
import type { AppTab } from "@/types";

/* ═══════════════════════════════════════════════════
   VELORA — App Orchestrator
   Splash → Welcome → Setup → Onboarding → App
   ═══════════════════════════════════════════════════ */

const ProfileScreen = dynamic(
  () => import("@/components/screens/ProfileScreen").then((mod) => mod.ProfileScreen),
  { loading: () => null }
);

const ShareScreen = dynamic(
  () => import("@/components/screens/ShareScreen").then((mod) => mod.ShareScreen),
  { loading: () => null }
);

const DiscoverScreen = dynamic(
  () => import("@/components/screens/DiscoverScreen").then((mod) => mod.DiscoverScreen),
  { loading: () => null }
);

const AgendaScreen = dynamic(
  () => import("@/components/screens/AgendaScreen").then((mod) => mod.AgendaScreen),
  { loading: () => null }
);

const appTabs: AppTab[] = ["home", "identity", "share", "discover", "agenda"];

const MainTabPanel = memo(function MainTabPanel({
  tab,
  active,
  onTabChange,
}: {
  tab: AppTab;
  active: boolean;
  onTabChange: (tab: AppTab) => void;
}) {
  return (
    <section
      aria-hidden={!active}
      className={`app-tab-panel ${active ? "app-tab-panel-active" : "app-tab-panel-inactive"}`}
    >
      {tab === "home" && <HomeScreen onTabChange={onTabChange} />}
      {tab === "identity" && <ProfileScreen />}
      {tab === "share" && <ShareScreen />}
      {tab === "discover" && <DiscoverScreen />}
      {tab === "agenda" && <AgendaScreen />}
    </section>
  );
});

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
  const { t } = useTranslation();
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
  const [mountedTabs, setMountedTabs] = useState<Set<AppTab>>(() => new Set(["home"]));
  const stableTabs = useMemo(() => appTabs, []);
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

  const handleTabChange = React.useCallback((tab: AppTab) => {
    setMountedTabs((current) => {
      if (current.has(tab)) return current;
      const next = new Set(current);
      next.add(tab);
      return next;
    });
    setActiveTab(tab);
  }, []);

  const renderApp = phase === "app" && Boolean(user) && isProfileReady && Boolean(profile);

  useEffect(() => {
    if (!renderApp) return;
    const id = window.setTimeout(() => {
      void import("@/components/screens/ProfileScreen");
      void import("@/components/screens/ShareScreen");
      void import("@/components/screens/DiscoverScreen");
      void import("@/components/screens/AgendaScreen");
    }, 350);
    return () => window.clearTimeout(id);
  }, [renderApp]);

  if (phase === "loading") {
    return (
      <LoadingScreen
        message={isAuthRestoring ? t("loading_session") : t("loading_profile")}
      />
    );
  }

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
                {t("error_profile_init")}
              </p>
              <p className="text-xs text-velora-text-muted mb-4">
                {profileError?.message || t("error_profile_retry")}
              </p>
              <button
                onClick={() => void refreshProfile()}
                className="h-10 px-4 rounded-xl bg-velora-gold text-velora-black text-sm font-medium"
              >
                {t("error_retry")}
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
          <main className="app-tab-shell">
            {stableTabs.map((tab) => (
              mountedTabs.has(tab) ? (
                <MainTabPanel
                  key={tab}
                  tab={tab}
                  active={activeTab === tab}
                  onTabChange={handleTabChange}
                />
              ) : null
            ))}
          </main>

          <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        </>
      )}
    </div>
  );
}

export default function VeloraApp() {
  return <VeloraAppInner />;
}
