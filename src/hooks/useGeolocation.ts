"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { logger } from "@/lib/logger";
import { db } from "@/lib/firebase";
import { useAuth } from "@/providers/AuthProvider";
import { useProfile } from "@/hooks/useProfile";
import { useStableCallback } from "@/hooks/useFirestoreListener";
import { calculateHaversineDistance, getCoarseCoordinates } from "@/utils/geolocation";

export type PermissionStateExtended = PermissionState | "unsupported";

interface Coordinates {
  lat: number;
  lng: number;
}

interface GeolocationState {
  permissionState: PermissionStateExtended;
  coords: Coordinates | null;
  loading: boolean;
  error: string | null;
}

type GeolocationAction =
  | { type: "permission"; permissionState: PermissionStateExtended }
  | { type: "request" }
  | { type: "success"; coords: Coordinates }
  | { type: "error"; permissionState?: PermissionStateExtended; error: string }
  | { type: "clear-coords" };

const initialState: GeolocationState = {
  permissionState: "unsupported",
  coords: null,
  loading: false,
  error: null,
};

function geolocationReducer(state: GeolocationState, action: GeolocationAction): GeolocationState {
  switch (action.type) {
    case "permission":
      return { ...state, permissionState: action.permissionState };
    case "request":
      return { ...state, loading: true, error: null };
    case "success":
      return {
        permissionState: "granted",
        coords: action.coords,
        loading: false,
        error: null,
      };
    case "error":
      return {
        ...state,
        permissionState: action.permissionState ?? state.permissionState,
        loading: false,
        error: action.error,
      };
    case "clear-coords":
      return { ...state, coords: null };
    default:
      return state;
  }
}

function getGeolocationErrorMessage(err: GeolocationPositionError) {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return {
        permissionState: "denied" as const,
        error: "Permission de geolocalisation refusee.",
      };
    case err.POSITION_UNAVAILABLE:
      return { error: "Position geographique indisponible." };
    case err.TIMEOUT:
      return { error: "Delai d'attente depasse." };
    default:
      return { error: err.message };
  }
}

export function useGeolocation() {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const uid = user?.uid ?? null;
  const [state, dispatch] = useReducer(geolocationReducer, initialState);
  const stableUpdateProfile = useStableCallback(updateProfile);
  const watchIdRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef(0);
  const lastUpdateCoordsRef = useRef<Coordinates | null>(null);

  const ghostMode = Boolean(profile?.ghostMode);
  const isSharing = Boolean(profile?.locationSharing);
  const hasPublicLocation = Boolean(profile?.location_geo_coarse);
  const publicVisibility = profile?.isVisible;

  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      dispatch({ type: "permission", permissionState: "unsupported" });
      return;
    }

    dispatch({ type: "permission", permissionState: "prompt" });
    if (!navigator.permissions?.query) return;

    let active = true;
    let permissionsStatus: PermissionStatus | null = null;

    navigator.permissions
      .query({ name: "geolocation" as PermissionName })
      .then((result) => {
        if (!active) return;
        permissionsStatus = result;
        dispatch({ type: "permission", permissionState: result.state });
        result.onchange = () => {
          dispatch({ type: "permission", permissionState: result.state });
        };
      })
      .catch(() => {
        if (active) {
          dispatch({ type: "permission", permissionState: "prompt" });
        }
      });

    return () => {
      active = false;
      if (permissionsStatus) {
        permissionsStatus.onchange = null;
      }
    };
  }, []);

  const stopWatch = useCallback(() => {
    if (watchIdRef.current === null || typeof navigator === "undefined") return;
    navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
  }, []);

  const updateFirebaseLocation = useCallback(
    async (lat: number, lng: number, accuracy?: number) => {
      if (!uid || ghostMode) return;

      const now = Date.now();
      const lastTime = lastUpdateTimeRef.current;
      const lastCoords = lastUpdateCoordsRef.current;

      if (lastTime > 0 && now - lastTime < 60000) {
        logger.debug("[Geolocation] Update throttled: less than 60s since last write.");
        return;
      }

      if (lastCoords) {
        const distance = calculateHaversineDistance(lastCoords.lat, lastCoords.lng, lat, lng);
        if (distance < 80) {
          logger.debug(`[Geolocation] Update throttled: moved only ${distance.toFixed(1)}m.`);
          return;
        }
      }

      try {
        await setDoc(doc(db, "users", uid, "private_data", "location"), {
          lat,
          lng,
          accuracy: accuracy || null,
          updatedAt: serverTimestamp(),
        });

        const coarse = getCoarseCoordinates(lat, lng);
        await stableUpdateProfile({
          location_geo_coarse: isSharing && !ghostMode
            ? {
                lat: coarse.lat,
                lng: coarse.lng,
                lastActive: new Date().toISOString(),
              }
            : null,
          isVisible: isSharing && !ghostMode,
        });

        lastUpdateTimeRef.current = now;
        lastUpdateCoordsRef.current = { lat, lng };
      } catch (err) {
        logger.error("[Geolocation] Failed to write coordinates to Firestore:", err);
      }
    },
    [ghostMode, isSharing, stableUpdateProfile, uid]
  );

  const handleSuccess = useCallback(
    (position: GeolocationPosition) => {
      const coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      dispatch({ type: "success", coords });

      if (isSharing) {
        void updateFirebaseLocation(coords.lat, coords.lng, position.coords.accuracy);
      }
    },
    [isSharing, updateFirebaseLocation]
  );

  const handleError = useCallback((err: GeolocationPositionError) => {
    logger.warn("[Geolocation] Error code:", err.code, err.message);
    dispatch({ type: "error", ...getGeolocationErrorMessage(err) });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation || !uid) {
      stopWatch();
      return;
    }

    if (!isSharing || ghostMode) {
      if (hasPublicLocation || (ghostMode && publicVisibility !== false)) {
        void stableUpdateProfile({
          location_geo_coarse: null,
          ...(ghostMode ? { isVisible: false, ghostMode: true } : {}),
        });
      }
      stopWatch();
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: false,
      timeout: 15000,
      maximumAge: 60000,
    };

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options);
    stopWatch();
    watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, options);

    return stopWatch;
  }, [
    ghostMode,
    hasPublicLocation,
    handleError,
    handleSuccess,
    isSharing,
    publicVisibility,
    stableUpdateProfile,
    stopWatch,
    uid,
  ]);

  const requestPermissions = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      dispatch({
        type: "error",
        permissionState: "unsupported",
        error: "La geolocalisation n'est pas supportee par cet appareil.",
      });
      return;
    }

    dispatch({ type: "request" });
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: false,
    });
  }, [handleError, handleSuccess]);

  const toggleLocationSharing = useCallback(
    async (enabled: boolean) => {
      if (!uid) return;

      try {
        await stableUpdateProfile({
          locationSharing: enabled,
          isVisible: enabled && !ghostMode,
          location_geo_coarse: enabled && state.coords && !ghostMode
            ? {
                ...getCoarseCoordinates(state.coords.lat, state.coords.lng),
                lastActive: new Date().toISOString(),
              }
            : null,
        });

        if (!enabled) {
          dispatch({ type: "clear-coords" });
          lastUpdateCoordsRef.current = null;
          lastUpdateTimeRef.current = 0;
          stopWatch();
        }
      } catch (err) {
        logger.error("[Geolocation] Failed to toggle location sharing state:", err);
      }
    },
    [ghostMode, stableUpdateProfile, state.coords, stopWatch, uid]
  );

  const toggleGhostMode = useCallback(
    async (enabled: boolean) => {
      if (!uid) return;

      try {
        if (enabled) {
          stopWatch();
          dispatch({ type: "clear-coords" });
          lastUpdateCoordsRef.current = null;
          lastUpdateTimeRef.current = 0;

          await stableUpdateProfile({
            ghostMode: true,
            isVisible: false,
            location_geo_coarse: null,
          });
          return;
        }

        await stableUpdateProfile({
          ghostMode: false,
          isVisible: isSharing,
          location_geo_coarse: isSharing && state.coords
            ? {
                ...getCoarseCoordinates(state.coords.lat, state.coords.lng),
                lastActive: new Date().toISOString(),
              }
            : null,
        });
      } catch (err) {
        logger.error("[Geolocation] Failed to apply ghost mode on public profile:", err);
      }
    },
    [isSharing, stableUpdateProfile, state.coords, stopWatch, uid]
  );

  return {
    isSupported: state.permissionState !== "unsupported",
    permissionState: state.permissionState,
    location: state.coords,
    loading: state.loading,
    error: state.error,
    isSharing,
    ghostMode,
    toggleLocationSharing,
    toggleGhostMode,
    requestPermissions,
  };
}
