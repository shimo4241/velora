"use client";
import { logger } from "@/lib/logger";


import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthProvider";
import { useFirestoreListener } from "@/hooks/useFirestoreListener";
import {
  ensureGoogleUserProfile,
  getProfile,
  onProfileChange,
  updateProfile as firestoreUpdateProfile,
  uploadAvatar as firestoreUploadAvatar,
  uploadCover as firestoreUploadCover,
  uploadPortfolioImage as firestoreUploadPortfolioImage,
  type UploadOptions,
} from "@/services";
import type { VeloraProfile } from "@/types";

export interface ProfileContextValue {
  profile: VeloraProfile | null;
  isProfileReady: boolean;
  isLoading: boolean;
  error: Error | null;
  refreshProfile: () => Promise<VeloraProfile | null>;
  updateProfile: (data: Partial<Omit<VeloraProfile, "id" | "username">>) => Promise<void>;
  uploadAvatar: (file: File, options?: UploadOptions) => Promise<string>;
  uploadCover: (file: File, options?: UploadOptions) => Promise<string>;
  uploadPortfolioImage: (file: File, options?: UploadOptions) => Promise<string>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

interface ProfileBootstrapSnapshot {
  pending: boolean;
  error: Error | null;
}

const idleBootstrapSnapshot: ProfileBootstrapSnapshot = {
  pending: false,
  error: null,
};

type BootstrapListener = () => void;

class ProfileBootstrapStore {
  private listeners = new Set<BootstrapListener>();
  private snapshot: ProfileBootstrapSnapshot = { pending: true, error: null };
  private started = false;

  constructor(
    private readonly uid: string,
    private user: Parameters<typeof ensureGoogleUserProfile>[0]
  ) {}

  updateUser(user: Parameters<typeof ensureGoogleUserProfile>[0]) {
    this.user = user;
  }

  getSnapshot = () => this.snapshot;

  getServerSnapshot = () => this.snapshot;

  subscribe = (listener: BootstrapListener) => {
    this.listeners.add(listener);
    this.start();

    return () => {
      this.listeners.delete(listener);
    };
  };

  retry() {
    if (this.snapshot.pending) return;
    this.started = false;
    this.setSnapshot({ pending: true, error: null });
    this.start();
  }

  private start() {
    if (this.started) return;
    this.started = true;

    logger.debug("[Profile] bootstrap:start", { uid: this.uid });

    void ensureGoogleUserProfile(this.user)
      .then((profile) => {
        logger.debug("[Profile] bootstrap:complete", {
          uid: this.uid,
          username: profile.username || null,
        });
        this.setSnapshot({ pending: false, error: null });
      })
      .catch((bootstrapError) => {
        const error =
          bootstrapError instanceof Error
            ? bootstrapError
            : new Error("Failed to initialize profile");
        logger.debug("[Profile] bootstrap:error", {
          uid: this.uid,
          message: error.message,
        });
        this.setSnapshot({ pending: false, error });
      });
  }

  private setSnapshot(snapshot: ProfileBootstrapSnapshot) {
    if (
      this.snapshot.pending === snapshot.pending &&
      Object.is(this.snapshot.error, snapshot.error)
    ) {
      return;
    }

    this.snapshot = snapshot;
    this.listeners.forEach((listener) => listener());
  }
}

const profileBootstrapStores = new Map<string, ProfileBootstrapStore>();

function getProfileBootstrapStore(
  uid: string,
  user: Parameters<typeof ensureGoogleUserProfile>[0]
) {
  const existingStore = profileBootstrapStores.get(uid);
  if (existingStore) {
    existingStore.updateUser(user);
    return existingStore;
  }

  const store = new ProfileBootstrapStore(uid, user);
  profileBootstrapStores.set(uid, store);
  return store;
}

function useProfileBootstrap(
  uid: string | null,
  user: Parameters<typeof ensureGoogleUserProfile>[0] | null,
  enabled: boolean
) {
  const store = useMemo(() => {
    if (!enabled || !uid || !user) return null;
    return getProfileBootstrapStore(uid, user);
  }, [enabled, uid, user]);

  return useSyncExternalStore(
    store?.subscribe ?? (() => () => undefined),
    store?.getSnapshot ?? (() => idleBootstrapSnapshot),
    store?.getServerSnapshot ?? (() => idleBootstrapSnapshot)
  );
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading, isAuthReady } = useAuth();
  const uid = user?.uid ?? null;
  const authReady = isAuthReady && !authLoading;
  const [cachedProfile, setCachedProfile] = useState<VeloraProfile | null>(null);

  // Sync cached profile from localStorage on mount/uid change
  useEffect(() => {
    if (typeof window !== "undefined" && uid) {
      try {
        const stored = localStorage.getItem(`velora_cached_profile_${uid}`);
        if (stored) {
          setCachedProfile(JSON.parse(stored));
        } else {
          // Fallback to un-namespaced legacy key if matching
          const legacy = localStorage.getItem("velora_cached_profile");
          if (legacy) {
            const parsed = JSON.parse(legacy);
            if (parsed.id === uid) {
              setCachedProfile(parsed);
              localStorage.setItem(`velora_cached_profile_${uid}`, legacy);
            }
          }
        }
      } catch (e) {
        logger.error("[Profile] Failed to restore cached profile:", e);
      }
    } else {
      setCachedProfile(null);
    }
  }, [uid]);

  const profileSnapshot = useFirestoreListener<VeloraProfile | null>(
    authReady && uid ? `profile:${uid}` : null,
    authReady && uid
      ? (onNext, onError) => onProfileChange(uid, onNext, onError)
      : null,
    null
  );

  // Update localStorage cache when subscription updates
  useEffect(() => {
    if (profileSnapshot.data && uid) {
      setCachedProfile(profileSnapshot.data);
      localStorage.setItem(`velora_cached_profile_${uid}`, JSON.stringify(profileSnapshot.data));
      localStorage.setItem("velora_cached_profile", JSON.stringify(profileSnapshot.data));
    }
  }, [profileSnapshot.data, uid]);

  const shouldBootstrapProfile = Boolean(
    authReady &&
      uid &&
      user &&
      !profileSnapshot.loading &&
      profileSnapshot.data === null &&
      !profileSnapshot.error
  );
  const bootstrapSnapshot = useProfileBootstrap(uid, user, shouldBootstrapProfile);

  const refreshProfile = useCallback(async () => {
    if (!uid) return null;

    try {
      const latestProfile = await getProfile(uid);
      const resolvedProfile = latestProfile || (user ? await ensureGoogleUserProfile(user) : null);
      if (resolvedProfile) {
        setCachedProfile(resolvedProfile);
        localStorage.setItem(`velora_cached_profile_${uid}`, JSON.stringify(resolvedProfile));
      }
      return resolvedProfile;
    } catch (refreshError) {
      const normalizedError =
        refreshError instanceof Error
          ? refreshError
          : new Error("Failed to refresh profile");
      throw normalizedError;
    }
  }, [uid, user]);

  const updateProfile = useCallback(async (data: Partial<Omit<VeloraProfile, "id" | "username">>) => {
    if (!uid) throw new Error("Unauthenticated");
    await firestoreUpdateProfile(uid, data);
  }, [uid]);

  const uploadAvatar = useCallback(async (file: File, options?: UploadOptions): Promise<string> => {
    if (!uid) throw new Error("Please sign in again before uploading an image.");
    return firestoreUploadAvatar(uid, file, options);
  }, [uid]);

  const uploadCover = useCallback(async (file: File, options?: UploadOptions): Promise<string> => {
    if (!uid) throw new Error("Please sign in again before uploading an image.");
    return firestoreUploadCover(uid, file, options);
  }, [uid]);

  const uploadPortfolioImage = useCallback(async (file: File, options?: UploadOptions): Promise<string> => {
    if (!uid) throw new Error("Please sign in again before uploading an image.");
    return firestoreUploadPortfolioImage(uid, file, options);
  }, [uid]);

  const hasCachedProfile = Boolean(cachedProfile && cachedProfile.id === uid);
  const profile = authReady && uid ? (profileSnapshot.data || (hasCachedProfile ? cachedProfile : null)) : null;
  const error = authReady && uid ? profileSnapshot.error || bootstrapSnapshot.error : null;
  
  // Do not block app loading if we already have a cached profile matching the current uid
  const isLoading = !authReady || Boolean(
    uid && (profileSnapshot.loading && !hasCachedProfile) || bootstrapSnapshot.pending || shouldBootstrapProfile
  );
  
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
      error,
      refreshProfile,
      updateProfile,
      uploadAvatar,
      uploadCover,
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
      uploadCover,
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
