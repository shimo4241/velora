"use client";

import { motion } from "framer-motion";
import { WifiOff, Loader2, Inbox, RefreshCw } from "lucide-react";
import { GlassCard, GoldButton } from "@/components/ui";
import { useTranslation } from "@/lib/i18n";

/* ═══════════════════════════════════════════════════
   VELORA — State Components
   Offline banner, loading, empty states
   ═══════════════════════════════════════════════════ */

/** Loading spinner — luxury gold */
export function LoadingScreen({ message }: { message?: string }) {
  const { t } = useTranslation();
  return (
    <div
      className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-velora-black"
      role="status"
      aria-live="polite"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
      >
        <Loader2 size={32} className="text-velora-gold" />
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-xs text-velora-text-muted mt-4 font-medium"
      >
        {message || t("loading_default")}
      </motion.p>
    </div>
  );
}

/** Empty state — premium, not sad */
export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { t } = useTranslation();
  const stateTitle = title || t("empty_title");

  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-6"
      role="region"
      aria-label={stateTitle}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mb-5">
          <Inbox size={24} className="text-velora-text-muted" />
        </div>
      </motion.div>

      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="text-heading text-sm text-velora-text mb-1 text-center"
      >
        {stateTitle}
      </motion.h3>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="text-[11px] text-velora-text-muted text-center max-w-[220px] leading-relaxed"
      >
        {description || t("empty_description")}
      </motion.p>

      {actionLabel && onAction && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="mt-5"
        >
          <GoldButton size="sm" onClick={onAction}>
            <RefreshCw size={12} />
            {actionLabel}
          </GoldButton>
        </motion.div>
      )}
    </div>
  );
}

/** Founding Access badge */
export function FoundingAccessBadge() {
  const { t } = useTranslation();
  return (
    <GlassCard className="p-4 text-center" gold hover={false}>
      <div className="text-[10px] text-velora-gold font-mono tracking-[0.2em] uppercase mb-1">
        {t("founding_access")}
      </div>
      <div className="text-xs text-velora-text-secondary leading-relaxed">
        {t("founding_access_desc")}
      </div>
    </GlassCard>
  );
}

interface ProfileErrorStateProps {
  error?: Error | null;
  onRetry: () => void;
}

/** Branded error state for profile bootstrap or fetch failures */
export function ProfileErrorState({ error, onRetry }: ProfileErrorStateProps) {
  const { t } = useTranslation();
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-velora-black px-6"
      role="alert"
      aria-live="assertive"
    >
      <GlassCard className="w-full max-w-sm p-6 text-center border border-velora-rose/25 bg-velora-rose/5" hover={false}>
        <div className="mx-auto w-12 h-12 rounded-full bg-velora-rose/10 flex items-center justify-center mb-4">
          <WifiOff className="text-velora-rose" size={24} />
        </div>
        <h3 className="text-heading text-sm text-velora-text mb-2">
          {t("error_profile_init")}
        </h3>
        <p className="text-xs text-velora-text-muted mb-6 leading-relaxed">
          {error?.message || t("error_profile_retry")}
        </p>
        <GoldButton onClick={onRetry} fullWidth size="md">
          {t("error_retry")}
        </GoldButton>
      </GlassCard>
    </div>
  );
}
