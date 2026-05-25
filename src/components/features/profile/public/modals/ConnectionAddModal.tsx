"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { ModalPortal } from "@/components/ui/ModalPortal";
import { IdentityTheme } from "../publicShared";

interface ConnectionAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    notes: string;
    tags: string[];
    locationName: string;
    eventName: string;
  }) => Promise<void>;
  initialLocationName?: string;
  initialEventName?: string;
  theme: IdentityTheme;
  t: (key: string) => string;
}

export default function ConnectionAddModal({
  isOpen,
  onClose,
  onSave,
  initialLocationName = "",
  initialEventName = "",
  theme,
  t,
}: ConnectionAddModalProps) {
  const [notes, setNotes] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [locationName, setLocationName] = useState(initialLocationName);
  const [eventName, setEventName] = useState(initialEventName);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave({
        notes,
        tags: selectedTags,
        locationName,
        eventName,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
        <motion.div
          className="fixed inset-0 bg-black/75"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ willChange: "opacity" }}
        />
        <motion.div
          className="relative z-10 w-full flex flex-col max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-3.5rem)] rounded-[24px] border border-white/10 bg-velora-dark p-6 shadow-2xl md:max-w-md md:rounded-[24px] overflow-hidden"
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{ willChange: "transform, opacity" }}
        >
          <div
            className="glow-layer pointer-events-none absolute inset-x-8 -top-16 h-36 rounded-full bg-[rgba(var(--identity-accent-rgb),0.1)] blur-xl"
            style={{
              background: `radial-gradient(circle, rgba(${theme.accentRgb},0.15) 0%, transparent 70%)`,
            }}
          />

          <div className="flex shrink-0 items-center justify-between border-b border-white/5 pb-4">
            <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-velora-text">
              {t("add_to_network")}
            </h3>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-velora-text-muted hover:bg-white/10"
            >
              <X size={16} />
            </button>
          </div>

          <div className="mt-4 space-y-4 flex-1 overflow-y-auto pr-1">
            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.1em] text-velora-text-muted mb-1.5">
                {t("notes")}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("add_note_placeholder")}
                rows={3}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-velora-text placeholder-white/20 focus:border-[var(--identity-accent)] focus:outline-none"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.1em] text-velora-text-muted mb-1.5">
                {t("tags")}
              </label>
              <div className="flex flex-wrap gap-2">
                {["Business", "Dentist", "Client", "VIP", "Friend", "Partner"].map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setSelectedTags((prev) =>
                          prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                        );
                      }}
                      style={{
                        borderColor: isSelected ? "var(--identity-accent)" : "rgba(255,255,255,0.1)",
                        background: isSelected
                          ? `rgba(${theme.accentRgb}, 0.12)`
                          : "rgba(255,255,255,0.03)",
                      }}
                      className="rounded-full border px-3 py-1 text-xs font-medium text-velora-text hover:border-white/20 transition-all"
                    >
                      {t(`filter_${tag.toLowerCase()}`)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Location Met */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.1em] text-velora-text-muted mb-1.5">
                {t("met_at_location")}
              </label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder={t("where_met_placeholder")}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-velora-text placeholder-white/20 focus:border-[var(--identity-accent)] focus:outline-none"
              />
            </div>

            {/* Event Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.1em] text-velora-text-muted mb-1.5">
                {t("event_name")}
              </label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder={t("event_name_placeholder")}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-velora-text placeholder-white/20 focus:border-[var(--identity-accent)] focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3 shrink-0">
            <button
              onClick={onClose}
              className="flex-1 rounded-2xl bg-white/5 py-3.5 text-sm font-semibold text-velora-text hover:bg-white/10 transition-colors"
            >
              {t("cancel")}
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              style={{
                background: `linear-gradient(135deg, var(--identity-accent), var(--identity-secondary))`,
              }}
              className="flex-1 rounded-2xl py-3.5 text-sm font-semibold text-velora-black shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <span className="animate-spin text-velora-black">●</span>
              ) : (
                t("save")
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </ModalPortal>
  );
}
