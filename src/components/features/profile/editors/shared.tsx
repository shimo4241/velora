"use client";

import type { ReactNode } from "react";

export const inputClass =
  "w-full bg-transparent text-sm text-velora-text placeholder:text-velora-text-muted/35 outline-none";

export const textAreaClass = `${inputClass} resize-none leading-relaxed`;

export const panelClass = "glass rounded-[var(--radius-card)] border border-white/10";

export function createLocalId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 10000)}`;
}

export function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed) || /^tel:/i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block rounded-[var(--radius-md)] border border-white/8 bg-white/[0.03] p-3">
      <span className="mb-2 block text-[10px] font-medium uppercase tracking-[0.16em] text-velora-text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}
