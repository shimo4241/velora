"use client";

import React, { useState, useEffect } from "react";
import { QrCode, Wifi, CheckCircle2, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ModalPortal } from "@/components/ui/ModalPortal";
import QrScannerModal from "@/components/network/QrScannerModal";
import { isNfcSupported, startNfcScan } from "@/lib/nfc";
import { useTranslation } from "@/lib/i18n";
import { useToast } from "@/components/providers/ToastProvider";
import { useHaptics } from "@/lib/capacitor";
import { logger } from "@/lib/logger";

interface CheckInButtonProps {
  eventId: string;
  isCheckedIn: boolean;
  actionLoading: boolean;
  onCheckIn: (method: "qr" | "nfc" | "manual") => Promise<void>;
}

export function CheckInButton({
  eventId,
  isCheckedIn,
  actionLoading,
  onCheckIn,
}: CheckInButtonProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { impact, notification } = useHaptics();

  const [showOptions, setShowOptions] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [showNfcListening, setShowNfcListening] = useState(false);
  const [nfcSupported, setNfcSupported] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setNfcSupported(isNfcSupported());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Handle NFC scanning lifecycle
  useEffect(() => {
    if (!showNfcListening) return;

    let cleanupNfc: (() => void) | null = null;

    const startScanning = async () => {
      try {
        cleanupNfc = await startNfcScan(
          async (result) => {
            const cleanUrl = result.url.trim().toLowerCase();
            // Validate if the tag URL matches our event validation criteria
            const matchesEvent =
              cleanUrl.includes(eventId.toLowerCase()) ||
              cleanUrl.includes(`velora-event:${eventId}`.toLowerCase());

            if (matchesEvent) {
              await notification(); // success haptic
              setShowNfcListening(false);
              try {
                await onCheckIn("nfc");
                showToast({
                  title: "Velora",
                  message: t("event_checkin_success") || "Enregistrement validé avec succès !",
                  tone: "success",
                });
              } catch {
                showToast({
                  title: "Velora",
                  message: t("event_checkin_error") || "Erreur d'enregistrement.",
                  tone: "error",
                });
              }
            } else {
              showToast({
                title: "Velora",
                message: t("event_nfc_invalid") || "Tag NFC invalide pour cet événement.",
                tone: "error",
              });
            }
          },
          (error: unknown) => {
            logger.error("[NFC Check-in] error:", error);
            setShowNfcListening(false);
            showToast({
              title: "NFC",
              message: "Erreur de lecture du tag NFC. Veuillez réessayer.",
              tone: "error",
            });
          }
        );
      } catch {
        setShowNfcListening(false);
        showToast({
          title: "NFC",
          message: "L'accès NFC a échoué ou n'est pas autorisé.",
          tone: "error",
        });
      }
    };

    void startScanning();

    return () => {
      if (cleanupNfc) cleanupNfc();
    };
  }, [showNfcListening, eventId, onCheckIn, showToast, t, notification]);

  const handleQrScanSuccess = async (decodedText: string) => {
    const cleanText = decodedText.trim();
    // Validate if the scanned text corresponds to this event
    const matchesEvent =
      cleanText === eventId ||
      cleanText === `velora-event:${eventId}` ||
      cleanText.toLowerCase().includes(eventId.toLowerCase());

    if (matchesEvent) {
      try {
        await onCheckIn("qr");
        showToast({
          title: "Velora",
          message: t("event_checkin_success") || "Enregistrement validé avec succès !",
          tone: "success",
        });
      } catch {
        showToast({
          title: "Velora",
          message: t("event_checkin_error") || "Erreur d'enregistrement.",
          tone: "error",
        });
      }
    } else {
      showToast({
        title: "Velora",
        message: t("event_qr_invalid") || "Code QR invalide pour cet événement.",
        tone: "error",
      });
    }
  };

  const handleOpenNfc = () => {
    impact("medium");
    setShowOptions(false);
    setShowNfcListening(true);
  };

  const handleOpenQr = () => {
    impact("medium");
    setShowOptions(false);
    setShowQrScanner(true);
  };

  if (isCheckedIn) {
    return (
      <div className="flex-[1.2] flex items-center justify-center gap-2 h-12 rounded-xl text-xs font-semibold bg-velora-emerald/10 border border-velora-emerald/20 text-velora-emerald">
        <CheckCircle2 size={16} />
        <span>{t("event_checkin_done") || "Enregistré"}</span>
      </div>
    );
  }

  return (
    <>
      <motion.button
        onClick={() => {
          if (nfcSupported) {
            setShowOptions(true);
          } else {
            setShowQrScanner(true);
          }
        }}
        disabled={actionLoading}
        whileTap={{ scale: 0.95 }}
        className="flex-[1.2] flex items-center justify-center gap-2 h-12 rounded-xl text-xs font-semibold bg-velora-gold border border-velora-gold text-velora-black shadow-md shadow-velora-gold/10"
      >
        {actionLoading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <QrCode size={16} />
        )}
        <span>{t("event_checkin_btn") || "S'enregistrer"}</span>
      </motion.button>

      {/* NFC / QR Method Selection Sheet */}
      <AnimatePresence>
        {showOptions && (
          <ModalPortal>
            <div className="fixed inset-0 z-[var(--z-modal)] flex items-end justify-center">
              <motion.div
                className="absolute inset-0 bg-black/60"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowOptions(false)}
              />
              <motion.div
                className="relative z-10 w-full max-w-md rounded-t-[32px] border-t border-white/10 bg-velora-dark px-6 py-6 pb-8 shadow-2xl flex flex-col gap-4"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <h3 className="font-[family-name:var(--font-display)] text-base font-semibold text-velora-text">
                    Méthode d&apos;enregistrement
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowOptions(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-velora-text-secondary"
                  >
                    <X size={15} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-1">
                  <button
                    type="button"
                    onClick={handleOpenQr}
                    className="flex flex-col items-center justify-center gap-2.5 p-5 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all group"
                  >
                    <QrCode className="text-velora-gold group-hover:scale-105 transition-transform" size={24} />
                    <span className="text-xs font-semibold text-velora-text">QR Code</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenNfc}
                    className="flex flex-col items-center justify-center gap-2.5 p-5 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all group"
                  >
                    <Wifi className="text-velora-gold group-hover:scale-105 transition-transform rotate-90" size={24} />
                    <span className="text-xs font-semibold text-velora-text">Borne NFC</span>
                  </button>
                </div>
              </motion.div>
            </div>
          </ModalPortal>
        )}
      </AnimatePresence>

      {/* QR Scanner Modal */}
      <QrScannerModal
        isOpen={showQrScanner}
        onClose={() => setShowQrScanner(false)}
        onScanSuccess={handleQrScanSuccess}
      />

      {/* NFC Listening Overlay */}
      <AnimatePresence>
        {showNfcListening && (
          <ModalPortal>
            <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-6">
              <motion.div
                className="absolute inset-0 bg-black/85 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
              <motion.div
                className="relative z-10 w-full max-w-sm rounded-[32px] border border-white/10 bg-velora-dark p-6 text-center shadow-2xl"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-velora-gold/10 border border-velora-gold/30 text-velora-gold relative mb-4">
                  {/* Animate scanning rings */}
                  <span className="absolute inset-0 rounded-full border border-velora-gold/40 animate-ping opacity-60" />
                  <Wifi size={24} className="rotate-90" />
                </div>

                <h3 className="font-[family-name:var(--font-display)] text-base font-semibold text-velora-text">
                  Validation NFC
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-velora-text-muted px-4">
                  Approchez le dos de votre téléphone du tag ou lecteur NFC de l&apos;événement.
                </p>

                <button
                  type="button"
                  onClick={() => setShowNfcListening(false)}
                  className="mt-6 w-full rounded-2xl border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-velora-text-secondary hover:text-white transition-colors"
                >
                  Annuler
                </button>
              </motion.div>
            </div>
          </ModalPortal>
        )}
      </AnimatePresence>
    </>
  );
}
