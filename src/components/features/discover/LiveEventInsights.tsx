"use client";

import { motion } from "framer-motion";
import { MOTION } from "@/constants";
import { PREMIUM_EASE } from "@/components/features/motion/animations";
import {
  Activity,
  Calendar,
  CheckCircle,
  MessageCircle,
  TrendingUp,
  Users,
  Wifi,
} from "lucide-react";

/* ═══════════════════════════════════════════════════
   VELORA — Live Event Insights Panel
   
   Provides contextual event/location information:
   - Attendee statistics
   - Active conversation groups
   - Event agenda snippet
   - Digital check-in confirmation
   ═══════════════════════════════════════════════════ */

interface ConversationGroup {
  id: string;
  name: string;
  members: number;
  active: boolean;
}

const CONVERSATION_GROUPS: ConversationGroup[] = [
  { id: "1", name: "FinTech Innovators", members: 12, active: true },
  { id: "2", name: "NFC & Contactless", members: 8, active: true },
  { id: "3", name: "Startup Founders", members: 15, active: false },
];

const AGENDA_ITEMS = [
  { time: "14:00", title: "Keynote: Future of Digital Identity" },
  { time: "15:30", title: "Panel: NFC in Professional Networking" },
  { time: "16:45", title: "Networking Break — Lobby" },
];

export function LiveEventInsights() {
  return (
    <motion.section
      className="relative px-5 pt-6 pb-2"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: MOTION.duration.entrance, ease: PREMIUM_EASE }}
    >
      {/* Section header */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className="flex items-center justify-center w-7 h-7 rounded-lg"
          style={{
            background: "color-mix(in srgb, var(--color-velora-gold) 12%, transparent)",
            border: "1px solid color-mix(in srgb, var(--color-velora-gold) 18%, transparent)",
          }}
        >
          <Activity size={13} style={{ color: "var(--color-velora-gold)" }} />
        </div>
        <h2
          className="text-sm font-semibold tracking-wide font-[family-name:var(--font-display)]"
          style={{ color: "var(--color-velora-text)" }}
        >
          Live Event Insights
        </h2>
        <div
          className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{
            background: "rgba(107, 191, 138, 0.12)",
            border: "1px solid rgba(107, 191, 138, 0.2)",
          }}
        >
          <Wifi size={9} style={{ color: "var(--color-velora-emerald)" }} />
          <span
            className="text-[9px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: "var(--color-velora-emerald)" }}
          >
            Live
          </span>
        </div>
      </div>

      {/* Attendee stats grid */}
      <div
        className="grid grid-cols-3 gap-2 mb-4 rounded-2xl p-3"
        style={{
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Users size={11} style={{ color: "var(--color-velora-gold)" }} />
          </div>
          <div
            className="text-lg font-semibold font-mono"
            style={{ color: "var(--color-velora-text)" }}
          >
            127
          </div>
          <div
            className="text-[9px] font-medium uppercase tracking-[0.12em]"
            style={{ color: "var(--color-velora-text-muted)" }}
          >
            Attendees
          </div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp size={11} style={{ color: "var(--color-velora-emerald)" }} />
          </div>
          <div
            className="text-lg font-semibold font-mono"
            style={{ color: "var(--color-velora-text)" }}
          >
            34
          </div>
          <div
            className="text-[9px] font-medium uppercase tracking-[0.12em]"
            style={{ color: "var(--color-velora-text-muted)" }}
          >
            Connections
          </div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <MessageCircle size={11} style={{ color: "var(--color-velora-blue)" }} />
          </div>
          <div
            className="text-lg font-semibold font-mono"
            style={{ color: "var(--color-velora-text)" }}
          >
            5
          </div>
          <div
            className="text-[9px] font-medium uppercase tracking-[0.12em]"
            style={{ color: "var(--color-velora-text-muted)" }}
          >
            Groups
          </div>
        </div>
      </div>

      {/* Active conversation groups */}
      <div className="mb-4">
        <div
          className="text-[10px] font-semibold uppercase tracking-[0.14em] mb-2 px-1"
          style={{ color: "var(--color-velora-text-muted)" }}
        >
          Active Groups
        </div>
        <div className="space-y-1.5">
          {CONVERSATION_GROUPS.map((group) => (
            <div
              key={group.id}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl"
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: group.active
                      ? "var(--color-velora-emerald)"
                      : "var(--color-velora-text-muted)",
                    boxShadow: group.active
                      ? "0 0 6px rgba(107, 191, 138, 0.4)"
                      : "none",
                  }}
                />
                <span
                  className="text-xs font-medium"
                  style={{
                    color: group.active
                      ? "var(--color-velora-text)"
                      : "var(--color-velora-text-secondary)",
                  }}
                >
                  {group.name}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Users size={10} style={{ color: "var(--color-velora-text-muted)" }} />
                <span
                  className="text-[10px] font-medium"
                  style={{ color: "var(--color-velora-text-muted)" }}
                >
                  {group.members}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Event agenda snippet */}
      <div className="mb-4">
        <div
          className="text-[10px] font-semibold uppercase tracking-[0.14em] mb-2 px-1"
          style={{ color: "var(--color-velora-text-muted)" }}
        >
          Event Agenda
        </div>
        <div
          className="rounded-xl overflow-hidden"
          style={{
            border: "1px solid rgba(255, 255, 255, 0.06)",
          }}
        >
          {AGENDA_ITEMS.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-3 py-2.5"
              style={{
                background: i === 0 ? "color-mix(in srgb, var(--color-velora-gold) 6%, transparent)" : "rgba(255, 255, 255, 0.02)",
                borderBottom: i < AGENDA_ITEMS.length - 1 ? "1px solid rgba(255, 255, 255, 0.04)" : "none",
              }}
            >
              <Calendar size={11} style={{ color: i === 0 ? "var(--color-velora-gold)" : "var(--color-velora-text-muted)" }} />
              <span
                className="text-[11px] font-mono font-medium shrink-0"
                style={{
                  color: i === 0 ? "var(--color-velora-gold)" : "var(--color-velora-text-muted)",
                  width: 38,
                }}
              >
                {item.time}
              </span>
              <span
                className="text-xs font-medium truncate"
                style={{
                  color: i === 0 ? "var(--color-velora-text)" : "var(--color-velora-text-secondary)",
                }}
              >
                {item.title}
              </span>
              {i === 0 && (
                <span
                  className="ml-auto shrink-0 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                  style={{
                    background: "color-mix(in srgb, var(--color-velora-gold) 15%, transparent)",
                    color: "var(--color-velora-gold)",
                  }}
                >
                  Now
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Digital check-in confirmation */}
      <motion.div
        className="flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{
          background: "rgba(107, 191, 138, 0.06)",
          border: "1px solid rgba(107, 191, 138, 0.15)",
        }}
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <CheckCircle size={16} style={{ color: "var(--color-velora-emerald)" }} />
        <div>
          <div
            className="text-xs font-semibold"
            style={{ color: "var(--color-velora-text)" }}
          >
            Digital Check-in Confirmed
          </div>
          <div
            className="text-[10px]"
            style={{ color: "var(--color-velora-text-muted)" }}
          >
            You&apos;re checked in at VeloraTech Summit 2025
          </div>
        </div>
      </motion.div>
    </motion.section>
  );
}
