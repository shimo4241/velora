"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ProfileProvider } from "@/components/providers/ProfileProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ProfileProvider>{children}</ProfileProvider>
    </AuthProvider>
  );
}
