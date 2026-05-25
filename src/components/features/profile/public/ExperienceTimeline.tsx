"use client";

import type { ExperienceEntry } from "@/types";
import { Reveal } from "./publicShared";

interface ExperienceTimelineProps {
  experience: ExperienceEntry[];
  presentLabel: string;
}

export default function ExperienceTimeline({
  experience,
  presentLabel,
}: ExperienceTimelineProps) {
  return (
    <div className="relative">
      <span className="absolute bottom-4 left-[14px] top-4 w-px bg-gradient-to-b from-[rgba(var(--identity-accent-rgb),0.45)] via-white/10 to-transparent" />
      <div className="space-y-4">
        {experience.map((item, index) => (
          <Reveal key={item.id} delay={index * 0.06}>
            <article className="relative grid grid-cols-[28px_1fr] gap-4">
              <span className="relative z-10 mt-3 flex h-7 w-7 items-center justify-center rounded-full border border-[rgba(var(--identity-accent-rgb),0.28)] bg-black shadow-[0_0_24px_rgba(var(--identity-accent-rgb),0.16)]">
                <span className="h-2 w-2 rounded-full bg-[var(--identity-accent)]" />
              </span>
              <div className="identity-glass-card identity-reflective rounded-[22px] p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.17em] text-[var(--identity-accent)]">
                  {item.isCurrent
                    ? `${item.startYear} - ${presentLabel}`
                    : `${item.startYear} - ${item.endYear || ""}`}
                </div>
                <h3 className="mt-2 font-[family-name:var(--font-display)] text-base font-semibold text-velora-text">
                  {item.role}
                </h3>
                <p className="mt-1 text-sm text-velora-text-secondary">{item.company}</p>
                {item.description && (
                  <p className="mt-3 text-sm leading-6 text-velora-text-muted">
                    {item.description}
                  </p>
                )}
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
