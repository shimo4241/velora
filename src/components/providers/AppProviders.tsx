"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ProfileProvider } from "@/components/providers/ProfileProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <ProfileProvider>{children}</ProfileProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
