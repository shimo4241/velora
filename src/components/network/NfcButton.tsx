"use client";
import { logger } from "@/lib/logger";


import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ModalPortal } from "@/components/ui/ModalPortal";
import { Nfc, Check, Smartphone, Camera, AlertCircle, Copy, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useNfc } from "@/hooks/useNfc";
import { useProfile } from "@/hooks/useProfile";
import { getProfileUrl } from "@/lib/profileUrls";
import { useHaptics } from "@/lib/capacitor";
import QrScannerModal from "./QrScannerModal";



interface NfcButtonProps {
  onScanProfile: (username: string) => void;
}

export default function NfcButton({ onScanProfile }: NfcButtonProps) {
  const { profile } = useProfile();
  const { status, isScanning, error, startScan, stopScan } = useNfc();
  const { impact, notification } = useHaptics();
  
  const [showFallbackModal, setShowFallbackModal] = useState(false);
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);



  const isNfcSuccess = status === "success";
  const isNfcError = status === "error";
  const isNfcUnsupported = status === "unsupported";

  // Extracts username from a full profile URL (e.g. https://velora.app/u/username -> username)
  const handleScanSuccess = (url: string) => {
    try {
      const parsedUrl = new URL(url);
      const pathParts = parsedUrl.pathname.split("/");
      // The path format is typically /u/username
      const uIndex = pathParts.indexOf("u");
      if (uIndex !== -1 && pathParts[uIndex + 1]) {
        const username = pathParts[uIndex + 1];
        onScanProfile(username);
      } else {
        logger.warn("[NFC] Unrecognized URL pattern:", url);
      }
    } catch {
      // In case we receive just a relative path or raw text
      if (url.includes("/u/")) {
        const parts = url.split("/u/");
        const username = parts[parts.length - 1].split("?")[0];
        onScanProfile(username);
      }
    }
  };

  const handlePressNfc = async () => {
    if (isNfcUnsupported) {
      await impact("medium");
      setShowFallbackModal(true);
      return;
    }

    if (isScanning) {
      stopScan();
      return;
    }

    startScan(handleScanSuccess);
  };

  const handleCopyLink = async () => {
    if (!profile) return;
    const url = getProfileUrl(profile.username);
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      await notification();
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      logger.error("Failed to copy link:", err);
    }
  };

  if (!profile) return null;

  return (
    <div className="flex flex-col items-center justify-center p-4">
      {/* NFC Button Core */}
      <motion.button
        type="button"
        onClick={handlePressNfc}
        whileTap={{ scale: 0.94 }}
        className="relative flex h-24 w-24 items-center justify-center rounded-full border border-velora-gold/20 bg-black/40 shadow-2xl backdrop-blur-md"
      >
        {/* Animated outer glowing rings (if scanning) */}
        {isScanning && (
          <>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border border-velora-gold/20"
                animate={{
                  scale: [1, 2.2],
                  opacity: [0.65, 0],
                }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: i * 0.7,
                }}
              />
            ))}
          </>
        )}

        {/* Inner layout based on scan status */}
        <motion.div
          animate={
            isScanning
              ? { scale: [1, 1.08, 1] }
              : { scale: 1 }
          }
          transition={isScanning ? { repeat: Infinity, duration: 2, ease: "easeInOut" } : undefined}
          className={`relative z-10 flex h-18 w-18 items-center justify-center rounded-full border transition-all duration-500 ${
            isNfcSuccess
              ? "border-velora-emerald/30 bg-velora-emerald/10 text-velora-emerald"
              : isNfcError
              ? "border-velora-rose/30 bg-velora-rose/10 text-velora-rose"
              : "border-velora-gold/20 bg-velora-gold/5 text-velora-gold hover:border-velora-gold/45"
          }`}
        >
          {isNfcSuccess ? (
            <Check size={28} className="text-velora-emerald" />
          ) : (
            <Nfc size={28} className="text-velora-gold" />
          )}
        </motion.div>
      </motion.button>

      {/* Button Subtitle description */}
      <div className="mt-3 text-center">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-velora-text-muted block">
          {isScanning
            ? "Rapprochez les appareils..."
            : isNfcSuccess
            ? "Connexion établie !"
            : isNfcUnsupported
            ? "Scanner / QR Code"
            : "Échange NFC Sans contact"}
        </span>
      </div>

      {/* error message alert badge */}
      {error && !isNfcUnsupported && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex items-center gap-1.5 rounded-full bg-velora-rose/10 border border-velora-rose/20 px-3.5 py-1 text-xs text-velora-rose font-medium"
        >
          <AlertCircle size={12} />
          {error}
        </motion.div>
      )}

      {/* Premium iOS Fallback sheet/modal */}
      <AnimatePresence>
        {showFallbackModal && (
          <ModalPortal>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/80 p-4 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)]"
              style={{ willChange: "opacity" }}
            >
              {/* Modal Container */}
              <motion.div
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 24, opacity: 0 }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full max-w-md flex flex-col max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-3.5rem)] overflow-hidden rounded-[36px] border border-white/10 bg-velora-dark p-6 shadow-2xl"
                style={{ willChange: "transform, opacity" }}
              >
              <button
                type="button"
                onClick={() => setShowFallbackModal(false)}
                className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 border border-white/5 text-velora-text-secondary hover:bg-white/10"
              >
                <X size={15} />
              </button>

              <div className="flex-1 overflow-y-auto pr-1">
                {/* Title Header */}
                <div className="flex flex-col items-center text-center mt-2">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-velora-gold/10 text-velora-gold border border-velora-gold/15 mb-3">
                    <Smartphone size={20} />
                  </div>
                  <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-velora-text">
                    Partager votre profil
                  </h3>
                  <p className="mt-1.5 text-xs text-velora-text-muted px-4 leading-relaxed">
                    L&apos;echange NFC direct n&apos;est pas supporte par cet appareil ou ce navigateur. Utilisez le QR Code de secours ci-dessous.
                  </p>
                </div>

                {/* Gold border Frame around user's own QR Code */}
                <div className="relative mx-auto mt-6 flex justify-center w-full max-w-[200px] mb-2">
                  <div className="absolute -inset-3.5 pointer-events-none">
                    <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-velora-gold rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-velora-gold rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-velora-gold rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-velora-gold rounded-br-lg" />
                  </div>

                  <div className="relative overflow-hidden rounded-2xl bg-white p-3.5 shadow-2xl">
                    <QRCodeSVG
                      value={getProfileUrl(profile.username)}
                      size={160}
                      bgColor="#FFFFFF"
                      fgColor="#0B0B0B"
                      level="H"
                    />
                  </div>
                </div>
              </div>

              {/* QR Scanner CTA & Quick actions */}
              <div className="mt-6 flex flex-col gap-2.5 shrink-0">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setShowFallbackModal(false);
                    setShowCameraScanner(true);
                  }}
                  className="flex w-full items-center justify-center gap-2.5 rounded-full border border-velora-gold/30 bg-velora-gold/10 py-3.5 text-sm font-semibold text-velora-gold shadow-[0_4px_12px_var(--color-velora-gold-dim)] transition-all hover:bg-velora-gold/15"
                >
                  <Camera size={16} />
                  Scanner un QR Code
                </motion.button>

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCopyLink}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-3 text-sm font-medium text-velora-text hover:bg-white/[0.08]"
                >
                  {linkCopied ? (
                    <>
                      <Check size={14} className="text-velora-emerald" />
                      Lien copié !
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      Copier le lien de mon profil
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
          </ModalPortal>
        )}
      </AnimatePresence>

      {/* Interactive Camera QR Scanner Modal */}
      <QrScannerModal
        isOpen={showCameraScanner}
        onClose={() => setShowCameraScanner(false)}
        onScanSuccess={handleScanSuccess}
      />
    </div>
  );
}
