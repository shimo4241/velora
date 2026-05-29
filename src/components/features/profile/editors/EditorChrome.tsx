"use client";

import type { ReactNode } from "react";
import { useTranslation } from "@/lib/i18n";
import { motion } from "framer-motion";
import { ModalPortal } from "@/components/ui/ModalPortal";
import { Loader2, Save, X, type LucideIcon } from "lucide-react";
import { GoldButton } from "@/components/ui";

interface EditorChromeProps {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  saving: boolean;
  onCancel: () => void;
  onSave: () => void;
}

export default function EditorChrome({
  title,
  icon: Icon,
  children,
  saving,
  onCancel,
  onSave,
}: EditorChromeProps) {
  const { t } = useTranslation();

  return (
    <ModalPortal id="profile-editor">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-[var(--z-modal)] flex items-start justify-center overflow-y-auto bg-black/78 px-4 py-6 md:items-center"
      >
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col my-auto max-h-[calc(100dvh-3rem)] w-full max-w-[430px] overflow-hidden rounded-[var(--radius-lg)] border border-velora-gold/20 bg-velora-dark shadow-[0_-8px_30px_rgba(0,0,0,0.4),0_0_12px_var(--color-velora-gold-dim)]"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-5 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-velora-gold-dim text-velora-gold">
                <Icon size={16} />
              </span>
              <h3 className="text-heading truncate text-base text-velora-text">{title}</h3>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="flex h-9 w-9 items-center justify-center rounded-full text-velora-text-muted transition-colors hover:text-velora-text"
              aria-label={t("cancel")}
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {children}
          </div>

          <div className="flex shrink-0 gap-3 border-t border-white/8 px-5 py-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="h-11 flex-1 rounded-[var(--radius-md)] border border-white/10 text-sm font-medium text-velora-text-secondary disabled:opacity-50"
            >
              {t("cancel")}
            </button>
            <GoldButton onClick={onSave} disabled={saving} className="h-11 flex-1">
              {saving ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <>
                  <Save size={14} />
                  {t("save")}
                </>
              )}
            </GoldButton>
          </div>
        </motion.div>
      </motion.div>
    </ModalPortal>
  );
}
