"use client";
import { logger } from "@/lib/logger";


import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ModalPortal } from "@/components/ui/ModalPortal";
import { Camera, X, RefreshCw, AlertCircle } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { useHaptics } from "@/lib/capacitor";

import { useScrollLock } from "@/lib/scrollLock";

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
}

export default function QrScannerModal({ isOpen, onClose, onScanSuccess }: QrScannerModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const { impact, notification } = useHaptics();

  const qrCodeInstanceRef = useRef<Html5Qrcode | null>(null);
  const readerId = "velora-qr-reader";

  useScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;

    // Give the DOM a tiny moment to render the div container
    const timer = setTimeout(() => {
      setIsInitializing(true);
      setError(null);
      const scanner = new Html5Qrcode(readerId);
      qrCodeInstanceRef.current = scanner;

      scanner
        .start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: (width, height) => {
              const size = Math.min(width, height) * 0.7;
              return { width: size, height: size };
            },
          },
          async (decodedText) => {
            // Found a QR code!
            await notification(); // Success haptics
            onScanSuccess(decodedText);
            onClose();
          },
          () => {
            // Reading failure (ignored as it polls continuously)
          }
        )
        .then(() => {
          setHasPermission(true);
          setCameraActive(true);
          setIsInitializing(false);
          impact("light");
        })
        .catch((err) => {
          logger.error("[QR Scanner] Initialization failed:", err);
          setIsInitializing(false);
          if (err?.toString().includes("NotAllowedError") || err?.toString().includes("Permission denied")) {
            setHasPermission(false);
            setError("Accès caméra refusé. Veuillez accorder la permission dans les réglages.");
          } else {
            setError("Impossible de démarrer la caméra. Vérifiez qu'aucune autre app ne l'utilise.");
          }
        });
    }, 300);

    return () => {
      clearTimeout(timer);
      if (qrCodeInstanceRef.current) {
        const scanner = qrCodeInstanceRef.current;
        if (scanner.isScanning) {
          scanner
            .stop()
            .then(() => {
              logger.debug("[QR Scanner] Camera stopped successfully.");
            })
            .catch((err) => {
              logger.error("[QR Scanner] Error stopping camera:", err);
            });
        }
      }
    };
  }, [isOpen, onClose, onScanSuccess, impact, notification]);

  return (
    <AnimatePresence>
      {isOpen && (
        <ModalPortal>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/85 p-4 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)]"
            style={{ willChange: "opacity" }}
          >
            {/* Main Card */}
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-md flex flex-col max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-3.5rem)] overflow-hidden rounded-[32px] border border-white/10 bg-velora-dark p-6 shadow-2xl"
              style={{ willChange: "transform, opacity" }}
            >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-velora-gold/15 text-velora-gold">
                  <Camera size={16} />
                </div>
                <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-velora-text">
                  Scanner QR Code
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/5 bg-white/5 text-velora-text-secondary transition-colors hover:bg-white/10 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              {/* Subtext */}
              <p className="text-xs text-velora-text-muted pb-4">
                Scannez le QR Code Velora d&apos;un autre membre pour vous connecter instantanement.
              </p>

              {/* Scanner Container */}
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-black/40 border border-white/5">
                {/* Gold Scan Border Box Overlay */}
                {cameraActive && !error && (
                  <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
                    <div className="relative h-2/3 w-2/3">
                      {/* Corners */}
                      <div className="absolute top-0 left-0 h-6 w-6 border-t-2 border-l-2 border-velora-gold rounded-tl-md" />
                      <div className="absolute top-0 right-0 h-6 w-6 border-t-2 border-r-2 border-velora-gold rounded-tr-md" />
                      <div className="absolute bottom-0 left-0 h-6 w-6 border-b-2 border-l-2 border-velora-gold rounded-bl-md" />
                      <div className="absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-velora-gold rounded-br-md" />

                      {/* Animated Gold Laser Line */}
                      <motion.div
                        animate={{ y: ["0%", "100%"] }}
                        transition={{
                          repeat: Infinity,
                          repeatType: "reverse",
                          duration: 2.2,
                          ease: "easeInOut",
                        }}
                        className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-velora-gold to-transparent shadow-[0_0_6px_var(--color-velora-gold-glow)]"
                      />
                    </div>
                  </div>
                )}

                {/* The HTML5 QR Code Mount element */}
                <div id={readerId} className="h-full w-full object-cover [&_video]:object-cover" />

                {/* Initializing State Screen */}
                {isInitializing && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-velora-black/80">
                    <RefreshCw size={24} className="animate-spin text-velora-gold" />
                    <span className="mt-3 text-xs font-medium text-velora-text-secondary">
                      Initialisation de la caméra...
                    </span>
                  </div>
                )}

                {/* Error Screen / Custom Permission Denied States */}
                {error && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-velora-black/90 px-8 text-center">
                    <AlertCircle size={32} className="text-velora-gold/80" />
                    <h4 className="mt-3 font-semibold text-sm text-velora-text">
                      Accès requis
                    </h4>
                    <p className="mt-2 text-xs leading-5 text-velora-text-muted">
                      {error}
                    </p>
                    {!hasPermission && (
                      <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="mt-5 rounded-full border border-velora-gold/30 bg-velora-gold/10 px-5 py-2 text-xs font-semibold text-velora-gold transition-all hover:bg-velora-gold/20"
                      >
                        Actualiser la page
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Action Bar Footer */}
            <div className="mt-6 flex shrink-0 items-center justify-center border-t border-white/5 pt-4 text-center">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-velora-gold/80">
                VELORA SECURE CHANNEL
              </span>
            </div>
          </motion.div>
        </motion.div>
        </ModalPortal>
      )}
    </AnimatePresence>
  );
}
