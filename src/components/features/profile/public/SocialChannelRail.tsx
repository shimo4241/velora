"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import type { SocialLink } from "@/types";
import { Reveal, normalizeExternalHref } from "./publicShared";

interface SocialChannelRailProps {
  links: SocialLink[];
}

export default function SocialChannelRail({ links }: SocialChannelRailProps) {
  return (
    <Reveal delay={0.05}>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {links.map((link, index) => (
          <motion.a
            key={`${link.platform}-${index}`}
            href={normalizeExternalHref(link.url)}
            target="_blank"
            rel="noopener noreferrer"
            className="identity-glass-card identity-reflective flex shrink-0 items-center gap-3 rounded-full px-4 py-3"
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.96 }}
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full border text-[10px] font-semibold"
              style={{
                color: link.color || "var(--identity-accent)",
                borderColor: `${link.color || "#d8b56d"}44`,
                backgroundColor: `${link.color || "#d8b56d"}16`,
              }}
            >
              {link.icon || link.platform.slice(0, 2)}
            </span>
            <span className="text-sm font-medium text-velora-text-secondary">
              {link.platform}
            </span>
            <ArrowUpRight size={13} className="text-[var(--identity-accent)]" />
          </motion.a>
        ))}
      </div>
    </Reveal>
  );
}
