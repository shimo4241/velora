"use client";

import { useState } from "react";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { Eye, Play, X, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { useScrollLock } from "@/utils/scrollLock";
import { isVideoAsset } from "@/components/features/profile";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import type { PortfolioItem } from "@/types";
import {
  IdentityTheme,
  LUXURY_EASE,
  PROJECT_FALLBACKS,
  Reveal,
  normalizeExternalHref,
} from "./publicShared";

interface PortfolioShowcaseProps {
  portfolio: PortfolioItem[];
  theme: IdentityTheme;
}

export default function PortfolioShowcase({ portfolio, theme }: PortfolioShowcaseProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activeProject = activeIndex === null ? null : portfolio[activeIndex];

  useScrollLock(activeIndex !== null);

  const move = (direction: -1 | 1) => {
    if (activeIndex === null) return;
    setActiveIndex((activeIndex + direction + portfolio.length) % portfolio.length);
  };

  return (
    <>
      <div className="grid gap-3 md:grid-cols-2">
        {portfolio.map((project, index) => (
          <Reveal key={project.id} delay={index * 0.05}>
            <motion.article
              className={`identity-glass-card identity-reflective group relative cursor-pointer overflow-hidden rounded-[28px] ${
                index === 0 ? "md:col-span-2" : ""
              }`}
              onClick={() => setActiveIndex(index)}
              whileHover={{ y: -5, scale: 1.006 }}
              whileTap={{ scale: 0.985 }}
              transition={{ duration: 0.32, ease: LUXURY_EASE }}
            >
              <div
                className={`relative overflow-hidden ${
                  index === 0 ? "aspect-[16/11] md:aspect-[21/9]" : "aspect-[4/4.5]"
                }`}
              >
                <ProjectMedia project={project} index={index} priority={index === 0} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/86 via-black/16 to-transparent" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_12%,rgba(var(--identity-accent-rgb),0.18),transparent_28%)] opacity-80" />
                {isVideoAsset(project.imageUrl) && (
                  <span className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/85 text-[var(--identity-accent)]">
                    <Play size={15} fill="currentColor" />
                  </span>
                )}
              </div>
              <div className="absolute inset-x-0 bottom-0 p-5">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--identity-accent)]">
                    {project.category || "Project"}
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/12 bg-[var(--theme-bg)] text-velora-text">
                    <Eye size={13} />
                  </span>
                </div>
                <h3 className="max-w-[560px] font-[family-name:var(--font-display)] text-2xl font-semibold leading-tight text-velora-text">
                  {project.title}
                </h3>
                {project.description && index === 0 && (
                  <p className="mt-2 max-w-[560px] text-sm leading-6 text-velora-text-secondary">
                    {project.description}
                  </p>
                )}
              </div>
            </motion.article>
          </Reveal>
        ))}
      </div>

      <AnimatePresence>
        {activeProject && (
          <PortfolioModal
            project={activeProject}
            index={activeIndex || 0}
            total={portfolio.length}
            theme={theme}
            onClose={() => setActiveIndex(null)}
            onMove={move}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function PortfolioModal({
  project,
  index,
  total,
  theme,
  onClose,
  onMove,
}: {
  project: PortfolioItem;
  index: number;
  total: number;
  theme: IdentityTheme;
  onClose: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const projectIdOrIndex = project.id || String(index);
  const [prevId, setPrevId] = useState(projectIdOrIndex);
  const [scale, setScale] = useState(1);
  const [dragEnabled, setDragEnabled] = useState(false);

  if (projectIdOrIndex !== prevId) {
    setPrevId(projectIdOrIndex);
    setScale(1);
    setDragEnabled(false);
  }

  const [isEdgeSwipe, setIsEdgeSwipe] = useState(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    const edgeThreshold = 25; // px from screen edge
    const clientX = e.clientX;
    if (clientX < edgeThreshold || clientX > window.innerWidth - edgeThreshold) {
      setIsEdgeSwipe(true);
    } else {
      setIsEdgeSwipe(false);
    }
  };

  const toggleZoom = () => {
    if (scale === 1) {
      setScale(2.2);
      setDragEnabled(true);
    } else {
      setScale(1);
      setDragEnabled(false);
    }
  };

  const handleDoubleTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleZoom();
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (scale > 1) return;
    const swipeThreshold = 50;
    if (info.offset.x < -swipeThreshold) {
      onMove(1);
    } else if (info.offset.x > swipeThreshold) {
      onMove(-1);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[260] bg-black/95"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="relative flex h-full flex-col">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-30 flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-black/75 text-velora-text"
          aria-label="Close portfolio preview"
        >
          <X size={18} />
        </button>

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => onMove(-1)}
              className="absolute left-4 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/12 bg-black/75 text-velora-text"
              aria-label="Previous project"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => onMove(1)}
              className="absolute right-4 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/12 bg-black/75 text-velora-text"
              aria-label="Next project"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        <motion.div
          className="relative min-h-0 flex-1 overflow-hidden flex items-center justify-center"
          initial={{ scale: 1.04, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.02, opacity: 0 }}
          transition={{ duration: 0.45, ease: LUXURY_EASE }}
          drag={scale === 1 && !isEdgeSwipe ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.3}
          onDragEnd={handleDragEnd}
          onPointerDown={handlePointerDown}
        >
          {isVideoAsset(project.imageUrl) ? (
            <ProjectMedia project={project} index={index} priority modal />
          ) : (
            <motion.div
              className="w-full h-full cursor-zoom-in flex items-center justify-center select-none"
              onClick={handleDoubleTap}
              drag={dragEnabled}
              dragConstraints={{ left: -200, right: 200, top: -200, bottom: 200 }}
              dragElastic={0.1}
              animate={{ scale }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              <ProjectMedia project={project} index={index} priority modal />
            </motion.div>
          )}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.18)_0%,rgba(0,0,0,0.18)_45%,#000_100%)] pointer-events-none" />
          <div
            className="glow-layer absolute inset-x-0 top-0 h-1/2 opacity-60 blur-xl pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 0%, rgba(${theme.accentRgb},0.22), transparent 48%)`,
            }}
          />
        </motion.div>

        <motion.div
          className="absolute inset-x-0 bottom-0 z-20 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-24"
          initial={{ y: 26, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 16, opacity: 0 }}
          transition={{ duration: 0.4, ease: LUXURY_EASE }}
        >
          <div className="mx-auto max-w-[760px]">
            <div className="mb-3 flex items-center justify-between gap-4">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--identity-accent)]">
                {project.category || "Project"}
              </span>
              <span className="font-mono text-[10px] text-velora-text-muted">
                {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
              </span>
            </div>
            <h3 className="font-[family-name:var(--font-display)] text-[2.35rem] font-semibold leading-none text-velora-text">
              {project.title}
            </h3>
            {project.description && (
              <p className="mt-4 max-w-[560px] text-sm leading-6 text-velora-text-secondary">
                {project.description}
              </p>
            )}
            {project.link && (
              <a
                href={normalizeExternalHref(project.link)}
                target="_blank"
                rel="noopener noreferrer"
                className="identity-reflective mt-5 inline-flex items-center gap-2 rounded-full border border-[rgba(var(--identity-accent-rgb),0.28)] bg-[rgba(var(--identity-accent-rgb),0.2)] px-4 py-2.5 text-xs font-semibold text-[var(--identity-accent)]"
              >
                View project
                <ExternalLink size={13} />
              </a>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function ProjectMedia({
  project,
  index,
  modal = false,
}: {
  project: PortfolioItem;
  index: number;
  priority?: boolean;
  modal?: boolean;
}) {
  const src = project.imageUrl || PROJECT_FALLBACKS[index % PROJECT_FALLBACKS.length];
  const className = modal
    ? "h-full w-full object-contain pointer-events-none"
    : "h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.045]";

  if (isVideoAsset(src)) {
    const videoClassName = modal ? "h-full w-full object-contain" : "h-full w-full object-cover";
    return (
      <video
        src={src}
        className={videoClassName}
        autoPlay
        muted
        loop
        playsInline
        controls={modal}
        preload="metadata"
      />
    );
  }

  return (
    <OptimizedImage
      src={src}
      type={modal ? "raw" : "portfolio"}
      className={className}
      alt={project.title}
    />
  );
}
