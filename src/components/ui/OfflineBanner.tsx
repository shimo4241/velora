"use client";

import { useOnlineStatus } from "@/lib/beta";
import { useTranslation } from "@/lib/i18n";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 40, opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="relative z-[999] flex w-full items-center justify-center bg-velora-rose/15 border-b border-velora-rose/20 text-velora-rose backdrop-blur-lg px-4 text-center text-xs font-semibold select-none overflow-hidden"
          style={{ height: 40 }}
        >
          <div className="flex items-center gap-2">
            <WifiOff size={14} className="shrink-0" />
            <span>{t("offline_banner")}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
