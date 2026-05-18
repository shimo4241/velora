"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BottomNav } from "@/components/ui/BottomNav";
import { SplashScreen, OnboardingScreen } from "@/components/onboarding";
import { HomeScreen } from "@/components/home";
import { ProfileScreen } from "@/components/screens/ProfileScreen";
import { ShareScreen } from "@/components/screens/ShareScreen";
import { NetworkScreen } from "@/components/screens/NetworkScreen";
import { AnalyticsScreen } from "@/components/screens/AnalyticsScreen";
import type { AppTab } from "@/types";

/* ═══════════════════════════════════════════════════
   VELORA — App Orchestrator
   
   Thin routing layer. No business logic here.
   Splash → Onboarding → App (5 tabs)
   ═══════════════════════════════════════════════════ */

const screens: Record<AppTab, () => React.JSX.Element> = {
  home: () => <HomeScreen />,
  identity: () => <ProfileScreen />,
  share: () => <ShareScreen />,
  discover: () => <NetworkScreen />,
  insights: () => <AnalyticsScreen />,
};

export default function VeloraApp() {
  const [phase, setPhase] = useState<"splash" | "onboarding" | "app">("splash");
  const [activeTab, setActiveTab] = useState<AppTab>("home");

  return (
    <div className="app-container">
      {/* Splash */}
      <AnimatePresence>
        {phase === "splash" && (
          <SplashScreen onComplete={() => setPhase("onboarding")} />
        )}
      </AnimatePresence>

      {/* Onboarding */}
      <AnimatePresence>
        {phase === "onboarding" && (
          <OnboardingScreen onComplete={() => setPhase("app")} />
        )}
      </AnimatePresence>

      {/* Main app */}
      {phase === "app" && (
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
