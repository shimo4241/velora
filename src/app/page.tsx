"use client";
import { logger } from "@/lib/logger";


import React, { memo, useEffect, useMemo, useState, useRef, useSyncExternalStore } from "react";
import { AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { BottomNav } from "@/components/ui/BottomNav";
import { SplashScreen, OnboardingScreen } from "@/components/features/onboarding";
import { HomeScreen } from "@/components/features/home";
import { WelcomeScreen } from "@/components/features/onboarding/WelcomeScreen";
import { ProfileSetupScreen } from "@/components/features/onboarding/ProfileSetupScreen";
import { useAuth } from "@/providers/AuthProvider";
import { useProfileNullable } from "@/hooks/useProfile";
import { LoadingScreen, ProfileErrorState } from "@/components/ui/States";
import { OfflineScreen } from "@/components/ui/OfflineScreen";
import { useOnlineStatus } from "@/lib/beta";
import { AppErrorBoundary } from "@/components/ui/ErrorBoundary";
import { useTranslation } from "@/lib/i18n";
import type { AppTab } from "@/types";
import { useConversations } from "@/hooks/useMessages";
import { useToast } from "@/providers/ToastProvider";
import { checkInToEvent } from "@/services";

/* ═══════════════════════════════════════════════════
   VELORA — App Orchestrator
   Splash → Welcome → Setup → Onboarding → App
   ═══════════════════════════════════════════════════ */

const ProfileScreen = dynamic(
  () => import("@/components/features/profile/ProfileScreen").then((mod) => mod.ProfileScreen),
  { loading: () => null }
);

const ShareScreen = dynamic(
  () => import("@/components/features/share/ShareScreen").then((mod) => mod.ShareScreen),
  { loading: () => null }
);

const DiscoverScreen = dynamic(
  () => import("@/components/features/discover/DiscoverScreen").then((mod) => mod.DiscoverScreen),
  { loading: () => null }
);

const AgendaScreen = dynamic(
  () => import("@/components/features/agenda/AgendaScreen").then((mod) => mod.AgendaScreen),
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
      id={`tabpanel-${tab}`}
      aria-labelledby={`tab-${tab}`}
      role="tabpanel"
    >
      <AppErrorBoundary>
        {tab === "home" && <HomeScreen onTabChange={onTabChange} />}
        {tab === "identity" && <ProfileScreen onNavigate={onTabChange} />}
        {tab === "share" && <ShareScreen />}
        {tab === "discover" && <DiscoverScreen />}
        {tab === "agenda" && <AgendaScreen />}
      </AppErrorBoundary>
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
  const isOnline = useOnlineStatus();
  const { user, loading: authLoading, isAuthReady } = useAuth();
  const {
    profile,
    isLoading: profileLoading,
    isProfileReady,
    error: profileError,
    refreshProfile,
    updateProfile,
  } = useProfileNullable();
  
  const [hasCachedUser, setHasCachedUser] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setHasCachedUser(Boolean(localStorage.getItem("velora_cached_user")));
    }
  }, []);

  const [splashFinished, setSplashFinished] = useState(false);
  const [onboardingAcknowledged, setOnboardingAcknowledged] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>("home");
  const { totalUnreadCount } = useConversations();
  const { showToast } = useToast();

  const hasFiredCheckinRef = useRef(false);
  const hasPreloadedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !user || !profile || hasFiredCheckinRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const action = params.get("action");
    const eventId = params.get("eventId");

    if (action === "checkin" && eventId) {
      hasFiredCheckinRef.current = true;
      // Clear URL params to prevent double triggers
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);

      const performCheckIn = async () => {
        try {
          await checkInToEvent(eventId, user.uid, profile, "qr");
          showToast({
            title: "Velora",
            message: t("event_checkin_success") || "Enregistrement validé avec succès !",
            tone: "success",
          });
          setActiveTab("agenda");
        } catch {
          showToast({
            title: "Velora",
            message: t("event_checkin_error") || "Erreur lors de l'enregistrement.",
            tone: "error",
          });
        }
      };
      void performCheckIn();
    }
  }, [user, profile, showToast, t]);

  const [mountedTabs, setMountedTabs] = useState<Set<AppTab>>(() => new Set(["home"]));
  const stableTabs = useMemo(() => appTabs, []);

  const handleTabChange = React.useCallback((tab: AppTab) => {
    setMountedTabs((current) => {
      if (current.has(tab)) return current;
      const next = new Set(current);
      next.add(tab);
      return next;
    });
    setActiveTab(tab);
  }, []);

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

  const renderApp = phase === "app" && Boolean(user) && isProfileReady && Boolean(profile);

  // PWA Deep Link shortcut handler
  useEffect(() => {
    if (typeof window === "undefined" || !renderApp) return;
    const params = new URLSearchParams(window.location.search);
    const screen = params.get("screen");
    const tab = params.get("tab");
    const target = (tab || screen) as AppTab;
    if (target && appTabs.includes(target)) {
      window.queueMicrotask(() => handleTabChange(target));
      // Clear URL params to clean address bar
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [renderApp, handleTabChange]);

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
        logger.error("[Onboarding Error] Failed to persist onboarding state:", error);
      });
    }
  };

  useEffect(() => {
    if (!renderApp || hasPreloadedRef.current) return;
    hasPreloadedRef.current = true;
    const id = window.setTimeout(() => {
      void import("@/components/features/profile/ProfileScreen");
      void import("@/components/features/share/ShareScreen");
      void import("@/components/features/discover/DiscoverScreen");
      void import("@/components/features/agenda/AgendaScreen");
    }, 350);
    return () => window.clearTimeout(id);
  }, [renderApp]);

  if (phase === "loading") {
    if (!isOnline && !hasCachedUser) {
      return (
        <OfflineScreen
          onRetry={() => {
            window.location.reload();
          }}
        />
      );
    }
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
          <ProfileErrorState
            key="error-state"
            error={profileError}
            onRetry={() => void refreshProfile()}
          />
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

          <BottomNav activeTab={activeTab} onTabChange={handleTabChange} unreadCount={totalUnreadCount} />
        </>
      )}
    </div>
  );
}

export default function VeloraApp() {
  return <VeloraAppInner />;
}
