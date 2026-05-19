"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  getProfile,
  onProfileChange,
  updateProfile as firestoreUpdateProfile,
  uploadAvatar as firestoreUploadAvatar,
  uploadPortfolioImage as firestoreUploadPortfolioImage,
} from "@/lib/firestore";
import type { VeloraProfile } from "@/types";

export interface ProfileContextValue {
  profile: VeloraProfile | null;
  isProfileReady: boolean;
  isLoading: boolean;
  loading: boolean;
  error: Error | null;
  refreshProfile: () => Promise<VeloraProfile | null>;
  updateProfile: (data: Partial<Omit<VeloraProfile, "id" | "username">>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
  uploadPortfolioImage: (file: File) => Promise<string>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const uid = user?.uid ?? null;
  const [profileState, setProfileState] = useState<{
    uid: string | null;
    profile: VeloraProfile | null;
    isLoading: boolean;
    error: Error | null;
  }>({ uid: null, profile: null, isLoading: false, error: null });
  const activeUidRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;

    if (authLoading) {
      activeUidRef.current = null;
      return () => {
        active = false;
      };
    }

    if (!uid) {
      activeUidRef.current = null;
      return () => {
        active = false;
      };
    }

    activeUidRef.current = uid;

    const unsubscribe = onProfileChange(uid, (p) => {
      if (!active) return;
      setProfileState({ uid, profile: p, isLoading: false, error: null });
    }, (listenerError) => {
      if (!active) return;
      setProfileState({ uid, profile: null, isLoading: false, error: listenerError });
    });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [authLoading, uid]);

  const refreshProfile = useCallback(async () => {
    if (!uid) {
      setProfileState({ uid: null, profile: null, isLoading: false, error: null });
      return null;
    }

    setProfileState((current) => ({
      uid,
      profile: current.uid === uid ? current.profile : null,
      isLoading: true,
      error: null,
    }));

    try {
      const latestProfile = await getProfile(uid);
      if (activeUidRef.current === uid) {
        setProfileState({ uid, profile: latestProfile, isLoading: false, error: null });
      }
      return latestProfile;
    } catch (refreshError) {
      const normalizedError =
        refreshError instanceof Error
          ? refreshError
          : new Error("Failed to refresh profile");
      if (activeUidRef.current === uid) {
        setProfileState({ uid, profile: null, isLoading: false, error: normalizedError });
      }
      throw normalizedError;
    }
  }, [uid]);

  const updateProfile = useCallback(async (data: Partial<Omit<VeloraProfile, "id" | "username">>) => {
    if (!uid) throw new Error("Unauthenticated");
    await firestoreUpdateProfile(uid, data);
  }, [uid]);

  const uploadAvatar = useCallback(async (file: File): Promise<string> => {
    if (!uid) throw new Error("Unauthenticated");
    return firestoreUploadAvatar(uid, file);
  }, [uid]);

  const uploadPortfolioImage = useCallback(async (file: File): Promise<string> => {
    if (!uid) throw new Error("Unauthenticated");
    return firestoreUploadPortfolioImage(uid, file);
  }, [uid]);

  const isCurrentProfile = profileState.uid === uid;
  const profile = !authLoading && uid && isCurrentProfile ? profileState.profile : null;
  const error = !authLoading && uid && isCurrentProfile ? profileState.error : null;
  const isLoading = authLoading || Boolean(uid && (!isCurrentProfile || profileState.isLoading));
  const isProfileReady = Boolean(!isLoading && profile?.id && profile?.username && profile?.fullName);

  const value = useMemo(
    () => ({
      profile,
      isProfileReady,
      isLoading,
      loading: isLoading,
      error,
      refreshProfile,
      updateProfile,
      uploadAvatar,
      uploadPortfolioImage,
    }),
    [
      profile,
      isProfileReady,
      isLoading,
      error,
      refreshProfile,
      updateProfile,
      uploadAvatar,
      uploadPortfolioImage,
    ]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfileContext() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfileContext must be used within a ProfileProvider");
  }
  return context;
}
