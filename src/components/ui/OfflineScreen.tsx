"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { WifiOff, RefreshCw } from "lucide-react";
import { GlassCard, GoldButton } from "@/components/ui";
import { useTranslation } from "@/lib/i18n";

interface OfflineScreenProps {
  onRetry?: () => void;
  title?: string;
  description?: string;
}

export function OfflineScreen({ onRetry, title, description }: OfflineScreenProps) {
  const { t } = useTranslation();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (!onRetry) return;
    setIsRetrying(true);
    // Simulate a brief delay to feel premium/deliberate
    await new Promise((resolve) => setTimeout(resolve, 800));
    try {
      onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 min-h-[60vh] w-full">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        <GlassCard className="p-8 text-center border border-velora-rose/20 bg-velora-rose/5" hover={false}>
          <div className="relative mx-auto w-16 h-16 mb-6 flex items-center justify-center">
            <motion.div
              className="absolute inset-0 rounded-full bg-velora-rose/25 blur-md"
              animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0.9, 0.6] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            />
            <div className="relative w-14 h-14 rounded-full bg-velora-rose/10 flex items-center justify-center border border-velora-rose/30">
              <WifiOff className="text-velora-rose" size={24} />
            </div>
          </div>

          <h3 className="text-heading text-base text-velora-text mb-2 font-semibold">
            {title || t("offline_title") || "Connexion requise"}
          </h3>

          <p className="text-xs text-velora-text-muted mb-8 leading-relaxed max-w-[280px] mx-auto">
            {description || t("offline_desc") || "Cette fonctionnalité nécessite une connexion Internet active pour synchroniser les données en temps réel."}
          </p>

          {onRetry && (
            <GoldButton
              onClick={handleRetry}
              disabled={isRetrying}
              fullWidth
              size="md"
            >
              <motion.div
                animate={isRetrying ? { rotate: 360 } : {}}
                transition={isRetrying ? { repeat: Infinity, duration: 1, ease: "linear" } : {}}
                className="flex items-center gap-2 justify-center"
              >
                <RefreshCw size={14} className={isRetrying ? "animate-spin" : ""} />
                <span>{isRetrying ? t("loading_default") || "Reconnexion..." : t("error_retry") || "Réessayer"}</span>
              </motion.div>
            </GoldButton>
          )}
        </GlassCard>
      </motion.div>
    </div>
  );
}
