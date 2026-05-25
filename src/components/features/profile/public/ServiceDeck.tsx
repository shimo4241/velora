"use client";

import { Sparkles } from "lucide-react";
import type { VeloraProfile } from "@/types";
import { Reveal } from "./publicShared";

interface ServiceDeckProps {
  services: VeloraProfile["services"];
}

export default function ServiceDeck({ services }: ServiceDeckProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {services.map((service, index) => (
        <Reveal key={service.id} delay={index * 0.05}>
          <article className="identity-glass-card identity-reflective min-h-[136px] rounded-[24px] p-5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(var(--identity-accent-rgb),0.2)] bg-black/20 text-[var(--identity-accent)]">
                <Sparkles size={16} />
              </span>
              {service.price && (
                <span className="rounded-full bg-[rgba(var(--identity-accent-rgb),0.1)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--identity-accent)]">
                  {service.price}
                </span>
              )}
            </div>
            <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-velora-text">
              {service.title}
            </h3>
            {service.description && (
              <p className="mt-2 text-sm leading-6 text-velora-text-muted">
                {service.description}
              </p>
            )}
          </article>
        </Reveal>
      ))}
    </div>
  );
}
