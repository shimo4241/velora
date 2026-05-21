"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { isNfcSupported, startNfcScan, writeNfcProfile, type NfcScanResult } from "@/lib/nfc";
import { useHaptics } from "@/lib/capacitor";

export type NfcStatus = "unsupported" | "ready" | "scanning" | "success" | "error";

export function useNfc() {
  const [status, setStatus] = useState<NfcStatus>(() => (isNfcSupported() ? "ready" : "unsupported"));
  const [error, setError] = useState<string | null>(null);
  const { impact, notification } = useHaptics();

  const cancelScanRef = useRef<(() => void) | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const lastScanUrlRef = useRef<string>("");

  // Clean up reader on unmount
  useEffect(() => {
    return () => {
      if (cancelScanRef.current) {
        cancelScanRef.current();
      }
    };
  }, []);

  const stopScan = useCallback(() => {
    if (cancelScanRef.current) {
      cancelScanRef.current();
      cancelScanRef.current = null;
    }
    if (status === "scanning") {
      setStatus("ready");
    }
  }, [status]);

  const startScan = useCallback(
    async (onScanSuccess: (url: string) => void) => {
      if (!isNfcSupported()) {
        setStatus("unsupported");
        setError("NFC non disponible sur cet appareil.");
        return;
      }

      stopScan();
      setStatus("scanning");
      setError(null);
      await impact("medium");

      try {
        const cancel = await startNfcScan(
          (result: NfcScanResult) => {
            const now = Date.now();
            // Anti-Spam protection: Ignore same URL scanned within 5 seconds
            if (result.url === lastScanUrlRef.current && now - lastScanTimeRef.current < 5000) {
              console.debug("[NFC] Duplicate scan ignored (anti-spam cooldown).");
              return;
            }

            // Update anti-spam trackers
            lastScanTimeRef.current = now;
            lastScanUrlRef.current = result.url;

            setStatus("success");
            notification(); // Native success haptic
            onScanSuccess(result.url);

            // Reset back to ready after success animation
            setTimeout(() => {
              setStatus("ready");
            }, 2500);
          },
          (err: unknown) => {
            console.error("[NFC Hook] Scan failed:", err);
            setStatus("error");
            setError(err instanceof Error ? err.message : "Une erreur est survenue lors de la numerisation NFC.");
            setTimeout(() => {
              setStatus("ready");
            }, 3000);
          }
        );

        cancelScanRef.current = cancel;
      } catch (err: unknown) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Impossible de demarrer le lecteur NFC.");
      }
    },
    [impact, notification, stopScan]
  );

  const writeProfile = useCallback(
    async (profileUrl: string) => {
      if (!isNfcSupported()) {
        setStatus("unsupported");
        setError("NFC non disponible sur cet appareil.");
        throw new Error("NFC unsupported");
      }

      setStatus("scanning");
      setError(null);
      await impact("medium");

      try {
        await writeNfcProfile(profileUrl);
        setStatus("success");
        await notification();
        setTimeout(() => {
          setStatus("ready");
        }, 2000);
      } catch (err: unknown) {
        console.error("[NFC Hook] Write failed:", err);
        setStatus("error");
        setError(err instanceof Error ? err.message : "Impossible d'ecrire sur le badge NFC. Rapprochez le badge.");
        setTimeout(() => {
          setStatus("ready");
        }, 3000);
        throw err;
      }
    },
    [impact, notification]
  );

  return {
    status,
    isScanning: status === "scanning",
    error,
    startScan,
    stopScan,
    writeProfile,
    isSupported: isNfcSupported(),
  };
}
