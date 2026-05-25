"use client";

import { type ReactNode } from "react";
import { Reveal } from "./publicShared";

interface IdentitySectionProps {
  eyebrow: string;
  title: string;
  children: ReactNode;
}

export default function IdentitySection({
  eyebrow,
  title,
  children,
}: IdentitySectionProps) {
  return (
    <section className="py-8">
      <Reveal>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--identity-accent)]">
              {eyebrow}
            </div>
            <h2 className="mt-1 font-[family-name:var(--font-display)] text-[1.7rem] font-semibold leading-tight text-velora-text">
              {title}
            </h2>
          </div>
          <span className="h-px flex-1 bg-gradient-to-r from-[rgba(var(--identity-accent-rgb),0.36)] to-transparent" />
        </div>
      </Reveal>
      {children}
    </section>
  );
}
