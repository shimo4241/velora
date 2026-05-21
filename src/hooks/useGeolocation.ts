"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useProfile } from "@/hooks/useProfile";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { calculateHaversineDistance, getCoarseCoordinates } from "@/lib/geolocation";

export type PermissionStateExtended = PermissionState | "unsupported";

export function useGeolocation() {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const uid = user?.uid ?? null;

  // Local permissions & states
  const [permissionState, setPermissionState] = useState<PermissionStateExtended>(() => {
    if (typeof window === "undefined" || !navigator.geolocation) return "unsupported";
    return "prompt";
  });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Ghost mode allows seeing nearby profiles without appearing yourself
  const [ghostMode, setGhostMode] = useState<boolean>(false);

  // References for battery optimization / throttling
  const watchIdRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const lastUpdateCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

  const isSharing = Boolean(profile?.locationSharing);

  // Sync permission state
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      return;
    }

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: "geolocation" as PermissionName })
        .then((result) => {
          setPermissionState(result.state);
          result.onchange = () => {
            setPermissionState(result.state);
          };
        })
        .catch(() => {
          // Fallback if query fails on some browsers
          setPermissionState("prompt");
        });
    }
  }, []);

  // Update Firestore locations with throttle & battery efficiency algorithms
  const updateFirebaseLocation = useCallback(
    async (lat: number, lng: number, accuracy?: number) => {
      if (!uid) return;

      const now = Date.now();
      const lastTime = lastUpdateTimeRef.current;
      const lastCoords = lastUpdateCoordsRef.current;

      // 1. Time Check: Minimum interval of 60 seconds
      if (lastTime > 0 && now - lastTime < 60000) {
        console.debug("[Geolocation] Update throttled: Less than 60s since last write.");
        return;
      }

      // 2. Distance Check: Minimum movement of 80 meters
      if (lastCoords) {
        const distance = calculateHaversineDistance(lastCoords.lat, lastCoords.lng, lat, lng);
        if (distance < 80) {
          console.debug(`[Geolocation] Update throttled: Moved only ${distance.toFixed(1)}m (min: 80m).`);
          return;
        }
      }

      try {
        // A. Store exact raw coordinates securely in owner-only private collection
        const privateLocRef = doc(db, "users", uid, "private_data", "location");
        await setDoc(privateLocRef, {
          lat,
          lng,
          accuracy: accuracy || null,
          updatedAt: serverTimestamp(),
        });

        // B. Store rounded coarse coordinates on public user doc only if active & not ghost
        const coarse = getCoarseCoordinates(lat, lng);
        await updateProfile({
          location_geo_coarse: isSharing && !ghostMode
            ? {
                lat: coarse.lat,
                lng: coarse.lng,
                lastActive: new Date().toISOString(),
              }
            : null,
        });

        // Update local reference states
        lastUpdateTimeRef.current = now;
        lastUpdateCoordsRef.current = { lat, lng };
        console.debug("[Geolocation] Firestore location synchronized successfully.", {
          ghostMode,
          isSharing,
          coarse,
        });
      } catch (err) {
        console.error("[Geolocation] Failed to write coordinates to Firestore:", err);
      }
    },
    [uid, isSharing, ghostMode, updateProfile]
  );

  // Watch position callback handlers
  const handleSuccess = useCallback(
    (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = position.coords;
      const newCoords = { lat: latitude, lng: longitude };

      setCoords(newCoords);
      setPermissionState("granted");
      setLoading(false);
      setError(null);

      // Sync if location sharing is allowed
      if (isSharing) {
        updateFirebaseLocation(latitude, longitude, accuracy);
      }
    },
    [isSharing, updateFirebaseLocation]
  );

  const handleError = useCallback((err: GeolocationPositionError) => {
    console.warn("[Geolocation] Error code:", err.code, err.message);
    setLoading(false);

    switch (err.code) {
      case err.PERMISSION_DENIED:
        setPermissionState("denied");
        setError("Permission de géolocalisation refusée.");
        break;
      case err.POSITION_UNAVAILABLE:
        setError("Position géographique indisponible.");
        break;
      case err.TIMEOUT:
        setError("Délai d'attente dépassé.");
        break;
      default:
        setError(err.message);
    }
  }, []);

  // Set up the Geolocation listener
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation || !uid) {
      return;
    }

    if (!isSharing) {
      // If user disabled sharing, clear their public coordinates
      if (profile?.location_geo_coarse) {
        updateProfile({ location_geo_coarse: null });
      }
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    // Battery Optimization: enableHighAccuracy: false
    const options: PositionOptions = {
      enableHighAccuracy: false,
      timeout: 15000,
      maximumAge: 60000, // cache for 60s
    };

    // Fetch initial location immediately
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options);

    // Watch position for movement updates
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      options
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [uid, isSharing, handleSuccess, handleError, updateProfile, profile?.location_geo_coarse]);

  // Request permissions manual trigger
  const requestPermissions = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setError("La géolocalisation n'est pas supportée par cet appareil.");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handleSuccess(pos);
      },
      (err) => {
        handleError(err);
      },
      { enableHighAccuracy: false }
    );
  }, [handleSuccess, handleError]);

  // Toggle sharing active state on/off
  const toggleLocationSharing = useCallback(
    async (enabled: boolean) => {
      if (!uid) return;
      try {
        await updateProfile({
          locationSharing: enabled,
          location_geo_coarse: enabled && coords && !ghostMode
            ? {
                ...getCoarseCoordinates(coords.lat, coords.lng),
                lastActive: new Date().toISOString(),
              }
            : null,
        });

        if (!enabled) {
          setCoords(null);
          lastUpdateCoordsRef.current = null;
          lastUpdateTimeRef.current = 0;
        }
      } catch (err) {
        console.error("[Geolocation] Failed to toggle location sharing state:", err);
      }
    },
    [uid, coords, ghostMode, updateProfile]
  );

  // Toggle Ghost mode
  const toggleGhostMode = useCallback(
    async (enabled: boolean) => {
      setGhostMode(enabled);
      // Immediately update public profile document to add/remove coarse position
      if (uid && isSharing) {
        try {
          await updateProfile({
            location_geo_coarse: !enabled && coords
              ? {
                  ...getCoarseCoordinates(coords.lat, coords.lng),
                  lastActive: new Date().toISOString(),
                }
              : null,
          });
        } catch (err) {
          console.error("[Geolocation] Failed to apply ghost mode on public profile:", err);
        }
      }
    },
    [uid, isSharing, coords, updateProfile]
  );

  return {
    isSupported: permissionState !== "unsupported",
    permissionState,
    location: coords,
    loading,
    error,
    isSharing,
    ghostMode,
    toggleLocationSharing,
    toggleGhostMode,
    requestPermissions,
  };
}
