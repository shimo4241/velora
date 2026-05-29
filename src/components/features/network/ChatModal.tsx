"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { X, Send, Shield, Star, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { ModalPortal } from "@/components/ui/ModalPortal";
import { useMessages } from "@/hooks/useMessages";
import { getConversationId } from "@/services";
import { getActiveTheme } from "@/components/features/profile/public/publicShared";
import type { VeloraConnection } from "@/types";

interface ChatModalProps {
  connection: VeloraConnection;
  onClose: () => void;
}

export function ChatModal({ connection, onClose }: ChatModalProps) {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const profile = connection.profile;

  // Determine active theme colors of recipient for layout details
  const theme = useMemo(() => getActiveTheme(profile), [profile]);

  // Compute conversation ID
  const conversationId = useMemo(() => {
    if (!connection.userId || !connection.profile.id) return null;
    return getConversationId(connection.userId, connection.profile.id);
  }, [connection]);

  const { messages, loading, send } = useMessages(conversationId);

  // Auto-scroll to bottom of chat
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (messages.length > 0) {
      // Small timeout to allow DOM layout to adjust
      const timer = setTimeout(() => scrollToBottom("smooth"), 100);
      return () => clearTimeout(timer);
    }
  }, [messages.length]);

  useEffect(() => {
    // Initial scroll on load
    if (!loading) {
      const timer = setTimeout(() => scrollToBottom("auto"), 200);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    try {
      setInputText("");
      await send(text);
      // Immediate scroll after sending
      setTimeout(() => scrollToBottom("smooth"), 50);
    } catch {
      // Restore input text on error
      setInputText(text);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend(e);
    }
  };

  const formatTime = (timestamp: { toMillis?: () => number } | Date | string | number | null | undefined) => {
    if (!timestamp) return "";
    let date: Date;
    if (typeof timestamp === "object" && "toMillis" in timestamp && typeof timestamp.toMillis === "function") {
      date = new Date(timestamp.toMillis());
    } else {
      date = new Date(timestamp as Date | string | number);
    }
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <ModalPortal id="chat">
      <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-0 sm:p-4 pt-[calc(env(safe-area-inset-top))] pb-[calc(env(safe-area-inset-bottom))]">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          className="relative z-10 w-full sm:max-w-lg h-full sm:h-[80vh] flex flex-col overflow-hidden sm:rounded-[32px] border-0 sm:border border-white/10 bg-velora-dark shadow-2xl"
          initial={{ y: "100%", opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0.5 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{ willChange: "transform, opacity" }}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-white/5 bg-velora-dark/80 backdrop-blur-md px-5 py-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative shrink-0">
                <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-velora-gold/20 bg-black/25">
                  {profile.avatarUrl ? (
                    <Image src={profile.avatarUrl} alt="" fill sizes="44px" className="object-cover" />
                  ) : (
                    <span className="font-[family-name:var(--font-display)] text-sm font-semibold text-velora-gold">
                      {profile.fullName?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </span>
                  )}
                </div>
                {profile.isVerified && (
                  <span className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full border border-velora-gold/30 bg-black text-velora-gold">
                    <Shield size={8} fill="currentColor" />
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="truncate font-[family-name:var(--font-display)] text-sm font-semibold text-velora-text">
                    {profile.fullName || "Contact"}
                  </h3>
                  {profile.isPremium && <Star size={11} className="text-velora-gold shrink-0" fill="currentColor" />}
                </div>
                <p className="text-[10px] text-velora-text-muted truncate leading-tight mt-0.5">
                  {profile.title || "Professionnel"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/5 bg-white/[0.03] text-velora-text-muted hover:text-velora-text hover:bg-white/[0.08] transition"
              aria-label="Fermer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messaging List */}
          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4 bg-[radial-gradient(circle_at_50%_0%,rgba(180,140,80,0.02),transparent_60%)]">
            {loading && messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="animate-spin text-velora-gold" size={24} />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center p-6">
                <span className="text-3xl">💬</span>
                <h4 className="mt-3 text-xs font-semibold text-velora-text-secondary uppercase tracking-[0.1em]">
                  Début de la conversation
                </h4>
                <p className="mt-1 text-[11px] text-velora-text-muted max-w-[200px] leading-relaxed">
                  Envoyez un message pour démarrer votre échange professionnel sécurisé.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, index) => {
                  const isMe = msg.senderId === connection.userId;
                  return (
                    <div
                      key={msg.id || index}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div className="max-w-[80%] flex flex-col">
                        <div
                          className={`rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed shadow-sm ${
                            isMe
                              ? "text-velora-black"
                              : "border border-white/5 bg-white/[0.04] text-velora-text"
                          }`}
                          style={
                            isMe
                              ? {
                                  background: `linear-gradient(135deg, ${theme.accent}, #ffffff)`,
                                }
                              : undefined
                          }
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                        </div>
                        <span
                          className={`text-[9px] text-velora-text-muted mt-1 ${
                            isMe ? "text-right" : "text-left"
                          }`}
                        >
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Message Input Box */}
          <form
            onSubmit={handleSend}
            className="shrink-0 border-t border-white/5 bg-velora-dark/90 px-5 py-4 safe-bottom"
          >
            <div className="flex items-center gap-3">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Votre message..."
                rows={1}
                className="flex-1 max-h-24 min-h-[44px] resize-none rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-velora-text outline-none placeholder:text-velora-text-muted/65 focus:border-velora-gold/30 transition scrollbar-hide"
              />
              <motion.button
                type="submit"
                disabled={!inputText.trim()}
                whileTap={{ scale: 0.95 }}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-velora-gold text-velora-black disabled:opacity-40 disabled:scale-100 transition-colors shadow-lg"
                style={{
                  background: inputText.trim()
                    ? `linear-gradient(135deg, ${theme.accent}, #ffffff)`
                    : undefined,
                }}
              >
                <Send size={15} />
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </ModalPortal>
  );
}
