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
  ensureGoogleUserProfile,
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
  const { user, loading: authLoading, isAuthReady } = useAuth();
  const uid = user?.uid ?? null;
  const authReady = isAuthReady && !authLoading;
  const [profileState, setProfileState] = useState<{
    uid: string | null;
    profile: VeloraProfile | null;
    isLoading: boolean;
    error: Error | null;
  }>({ uid: null, profile: null, isLoading: false, error: null });
  const activeUidRef = useRef<string | null>(null);
  const bootstrapUidRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;

    if (!authReady) {
      activeUidRef.current = null;
      console.debug("[Profile] waiting for auth hydration");
      return () => {
        active = false;
      };
    }

    if (!uid || !user) {
      activeUidRef.current = null;
      bootstrapUidRef.current = null;
      console.debug("[Profile] cleared unauthenticated state");
      return () => {
        active = false;
      };
    }

    activeUidRef.current = uid;
    console.debug("[Profile] hydration:start", { uid });

    const unsubscribe = onProfileChange(uid, async (p) => {
      if (!active) return;

      if (p) {
        console.debug("[Profile] hydration:snapshot", {
          uid,
          username: p.username || null,
          profileSetupComplete: p.onboarding?.profileSetupComplete ?? false,
          productTourComplete: p.onboarding?.productTourComplete ?? false,
        });
        setProfileState({ uid, profile: p, isLoading: false, error: null });
        return;
      }

      console.debug("[Profile] hydration:missing profile, bootstrapping", { uid });
      setProfileState({ uid, profile: null, isLoading: true, error: null });

      if (bootstrapUidRef.current === uid) return;
      bootstrapUidRef.current = uid;

      try {
        const bootstrappedProfile = await ensureGoogleUserProfile(user);
        if (!active) return;
        console.debug("[Profile] hydration:bootstrapped", {
          uid,
          username: bootstrappedProfile.username || null,
        });
        setProfileState({ uid, profile: bootstrappedProfile, isLoading: false, error: null });
      } catch (bootstrapError) {
        bootstrapUidRef.current = null;
        if (!active) return;
        const normalizedError =
          bootstrapError instanceof Error
            ? bootstrapError
            : new Error("Failed to initialize profile");
        console.debug("[Profile] hydration:error", {
          uid,
          message: normalizedError.message,
        });
        setProfileState({ uid, profile: null, isLoading: false, error: normalizedError });
      }
    }, (listenerError) => {
      if (!active) return;
      console.debug("[Profile] hydration:listener error", {
        uid,
        message: listenerError.message,
      });
      setProfileState({ uid, profile: null, isLoading: false, error: listenerError });
    });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [authReady, uid, user]);

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
      const resolvedProfile = latestProfile || (user ? await ensureGoogleUserProfile(user) : null);
      if (activeUidRef.current === uid) {
        setProfileState({ uid, profile: resolvedProfile, isLoading: false, error: null });
      }
      return resolvedProfile;
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
  }, [uid, user]);

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
  const profile = authReady && uid && isCurrentProfile ? profileState.profile : null;
  const error = authReady && uid && isCurrentProfile ? profileState.error : null;
  const isLoading = !authReady || Boolean(uid && (!isCurrentProfile || profileState.isLoading));
  const hasCompletedProfileSetup = Boolean(
    profile?.onboarding?.profileSetupComplete ||
    (profile?.title && (profile?.whatsapp || profile?.phone))
  );
  const isProfileReady = Boolean(
    !isLoading &&
    profile?.id &&
    profile?.username &&
    profile?.fullName &&
    hasCompletedProfileSetup
  );

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
