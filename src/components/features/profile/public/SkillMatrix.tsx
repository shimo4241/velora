"use client";

import { motion } from "framer-motion";
import { LUXURY_EASE, Reveal } from "./publicShared";

interface SkillMatrixProps {
  skills: string[];
}

export default function SkillMatrix({ skills }: SkillMatrixProps) {
  return (
    <Reveal delay={0.06}>
      <div className="flex flex-wrap gap-2.5">
        {skills.map((skill, index) => (
          <motion.span
            key={skill}
            className="identity-reflective rounded-full border border-[rgba(var(--identity-accent-rgb),0.2)] bg-[var(--theme-bg)] px-4 py-2 text-xs font-medium text-velora-text-secondary"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.45, delay: index * 0.035, ease: LUXURY_EASE }}
          >
            {skill}
          </motion.span>
        ))}
      </div>
    </Reveal>
  );
}
