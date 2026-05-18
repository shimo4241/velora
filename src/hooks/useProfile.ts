"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  onProfileChange,
  onPortfolioChange,
  onExperienceChange,
  updateProfile as updateProfileFn,
  uploadAvatar as uploadAvatarFn,
  uploadPortfolioImage as uploadPortfolioImageFn,
} from "@/lib/firestore";
import type { VeloraProfile, PortfolioItem, ExperienceEntry } from "@/types";

/* ═══════════════════════════════════════════════════
   VELORA — useProfile Hook
   Real-time profile data from Firestore
   ═══════════════════════════════════════════════════ */

const DEFAULT_PROFILE: VeloraProfile = {
  id: "",
  username: "",
  fullName: "",
  title: "",
  company: "",
  location: "Casablanca, Morocco",
  bio: "",
  avatarUrl: "",
  socialLinks: [],
  professionalMode: "entrepreneur",
  isVerified: false,
  isPremium: false,
  isNoir: false,
  locale: "fr",
};

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<VeloraProfile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(DEFAULT_PROFILE);
      setLoading(false);
      return;
    }

    const unsubscribe = onProfileChange(user.uid, (p) => {
      setProfile(p || DEFAULT_PROFILE);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const updateProfile = async (data: Partial<Omit<VeloraProfile, "id">>) => {
    if (!user) return;
    await updateProfileFn(user.uid, data);
  };

  const uploadAvatar = async (file: File): Promise<string> => {
    if (!user) throw new Error("Not authenticated");
    return uploadAvatarFn(user.uid, file);
  };

  const uploadPortfolioImage = async (file: File): Promise<string> => {
    if (!user) throw new Error("Not authenticated");
    return uploadPortfolioImageFn(user.uid, file);
  };

  return { profile, loading, updateProfile, uploadAvatar, uploadPortfolioImage };
}

export function usePortfolio() {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setPortfolio([]); setLoading(false); return; }
    const unsub = onPortfolioChange(user.uid, (items) => {
      setPortfolio(items);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  return { portfolio, loading };
}

export function useExperience() {
  const { user } = useAuth();
  const [experience, setExperience] = useState<ExperienceEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setExperience([]); setLoading(false); return; }
    const unsub = onExperienceChange(user.uid, (entries) => {
      setExperience(entries);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  return { experience, loading };
}
