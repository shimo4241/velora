"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X, Clipboard, ExternalLink } from "lucide-react";
import { useToast } from "@/providers/ToastProvider";
import type { VeloraProfile } from "@/types";

type AiStylePreset = "Luxury" | "Corporate" | "Founder" | "Executive";

const aiStylePresets: AiStylePreset[] = ["Luxury", "Corporate", "Founder", "Executive"];

const aiProviderLinks = [
  { label: "ChatGPT", href: "https://chatgpt.com/" },
  { label: "Gemini", href: "https://gemini.google.com/" },
  { label: "Claude", href: "https://claude.ai/" },
];

function buildAiPrompt({
  preset,
  notes,
  fallbackContext,
  language,
}: {
  preset: AiStylePreset;
  notes: string;
  fallbackContext: string;
  language: string;
}) {
  const context = notes.trim() || fallbackContext.trim();
  return [
    `Write a premium professional bio in a ${preset.toLowerCase()} style.`,
    `Write in ${language}.`,
    `Context: ${context || "Create a tasteful bio for a premium digital identity profile."}`,
    "Keep it elegant, specific, credible, and ready to paste into Velora. Use 2-3 concise sentences.",
  ].join("\n");
}

export function LocalAiWritingAssistant({
  profile,
  compact = false,
}: {
  profile?: Partial<VeloraProfile>;
  compact?: boolean;
}) {
  const { showToast } = useToast();
  const [preset, setPreset] = useState<AiStylePreset>(
    profile?.professionalMode === "corporate"
      ? "Corporate"
      : profile?.professionalMode === "luxury" || profile?.professionalMode === "vip"
        ? "Luxury"
        : profile?.professionalMode === "business"
          ? "Executive"
          : "Founder"
  );
  const [notes, setNotes] = useState("");
  const [prompt, setPrompt] = useState("");

  const language =
    profile?.locale === "en"
      ? "English"
      : profile?.locale === "es"
        ? "Spanish"
        : profile?.locale === "ar"
          ? "Arabic"
          : "French";

  const fallbackContext = [
    profile?.title,
    profile?.company,
    profile?.location,
    profile?.industry,
    profile?.skills?.length ? `Skills: ${profile.skills.join(", ")}` : "",
    profile?.bio,
  ]
    .filter(Boolean)
    .join(". ");

  const openPrompt = () => {
    setPrompt(buildAiPrompt({ preset, notes, fallbackContext, language }));
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      showToast({
        tone: "success",
        title: "Prompt copied",
        message: "Paste it into your preferred AI assistant.",
      });
    } catch {
      showToast({
        tone: "error",
        title: "Copy failed",
        message: "Select the prompt text and copy it manually.",
      });
    }
  };

  return (
    <>
      <div
        className={`${compact ? "rounded-[var(--radius-md)]" : "glass rounded-[var(--radius-card)]"} border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.065),var(--color-velora-gold-dim),color-mix(in srgb, var(--color-velora-black) 12%, transparent))] p-4 shadow-[0_8px_24px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.06)]`}
      >
        <div className="mb-4 flex items-center gap-2">
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-velora-gold-light),var(--color-velora-gold),var(--color-velora-gold-muted))] text-velora-black shadow-[0_0_8px_var(--color-velora-gold-glow)]">
            <Sparkles size={14} />
          </span>
          <p className="text-sm font-semibold text-velora-text">AI Bio Studio</p>
        </div>

        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Tell Velora about yourself..."
          rows={5}
          className="w-full resize-none rounded-[var(--radius-md)] border border-white/10 bg-black/18 px-4 py-3 text-sm leading-relaxed text-velora-text outline-none placeholder:text-velora-text-muted/40 focus:border-velora-gold/35"
        />

        <div className="mt-3 grid grid-cols-4 gap-1.5 rounded-full border border-white/8 bg-black/18 p-1">
          {aiStylePresets.map((style) => (
            <button
              key={style}
              type="button"
              onClick={() => setPreset(style)}
              className={`min-h-9 rounded-full px-2 text-[10px] font-semibold transition-colors ${preset === style ? "bg-velora-gold text-velora-black shadow-[0_4px_10px_var(--color-velora-gold-glow)]" : "text-velora-text-muted hover:text-velora-text"}`}
            >
              {style}
            </button>
          ))}
        </div>

        <motion.button
          type="button"
          onClick={openPrompt}
          whileTap={{ scale: 0.98 }}
          className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--color-velora-gold-light),var(--color-velora-gold),var(--color-velora-gold-muted))] text-sm font-semibold text-velora-black shadow-[0_6px_16px_var(--color-velora-gold-glow)]"
        >
          <Sparkles size={16} />
          Generate Bio
        </motion.button>
      </div>

      <AnimatePresence>
        {prompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[260] flex items-center justify-center bg-black/78 px-4 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)]"
          >
            <motion.div
              initial={{ y: 34, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-[460px] flex flex-col max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-3.5rem)] overflow-hidden rounded-[var(--radius-lg)] border border-velora-gold/25 bg-velora-dark shadow-[0_-8px_30px_rgba(0,0,0,0.4),0_0_12px_var(--color-velora-gold-glow)]"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-velora-gold-light),var(--color-velora-gold),var(--color-velora-gold-muted))] text-velora-black">
                    <Sparkles size={17} />
                  </span>
                  <div>
                    <h3 className="text-heading text-base text-velora-text">Generated AI prompt</h3>
                    <p className="text-[10px] text-velora-text-muted">{preset} bio</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPrompt("")}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-velora-text-muted hover:text-velora-text"
                  aria-label="Close AI prompt"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4">
                <textarea
                  readOnly
                  value={prompt}
                  rows={9}
                  className="w-full resize-none rounded-[var(--radius-md)] border border-white/10 bg-white/[0.04] p-3 text-sm leading-relaxed text-velora-text outline-none"
                />
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={copyPrompt}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-velora-gold text-sm font-semibold text-velora-black"
                  >
                    <Clipboard size={15} />
                    Copy prompt
                  </button>
                  {aiProviderLinks.map((provider) => (
                    <a
                      key={provider.label}
                      href={provider.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-white/10 bg-white/[0.04] text-sm font-medium text-velora-text-secondary hover:border-velora-gold/30 hover:text-velora-gold"
                    >
                      <ExternalLink size={14} />
                      Open {provider.label}
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
