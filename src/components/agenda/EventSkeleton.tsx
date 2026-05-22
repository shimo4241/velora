"use client";

import React from "react";

interface EventSkeletonProps {
  className?: string;
}

export const EventSkeleton: React.FC<EventSkeletonProps> = ({ className = "" }) => {
  return (
    <div
      className={`event-card overflow-hidden rounded-[24px] border border-white/5 bg-white/[0.02] backdrop-blur-md ${className}`}
    >
      {/* Banner aspect ratio 16:9 */}
      <div className="premium-skeleton aspect-ratio-banner w-full aspect-ratio-[16/9] h-48 bg-white/5" />

      {/* Info section */}
      <div className="p-5 space-y-4">
        {/* Badges row */}
        <div className="flex gap-2">
          <div className="premium-skeleton h-5 w-20 rounded-full bg-white/5" />
          <div className="premium-skeleton h-5 w-16 rounded-full bg-white/5" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <div className="premium-skeleton h-6 w-3/4 rounded-lg bg-white/5" />
          <div className="premium-skeleton h-4 w-1/2 rounded-lg bg-white/5" />
        </div>

        {/* Location / details */}
        <div className="flex justify-between items-center pt-2">
          <div className="flex items-center gap-2">
            <div className="premium-skeleton h-8 w-8 rounded-full bg-white/5" />
            <div className="premium-skeleton h-4 w-24 rounded-lg bg-white/5" />
          </div>
          <div className="premium-skeleton h-4 w-16 rounded-lg bg-white/5" />
        </div>

        {/* Divider */}
        <div className="h-px bg-white/5 w-full pt-1" />

        {/* Action row */}
        <div className="flex justify-between gap-4 pt-1">
          <div className="premium-skeleton h-10 flex-1 rounded-xl bg-white/5" />
          <div className="premium-skeleton h-10 w-12 rounded-xl bg-white/5" />
          <div className="premium-skeleton h-10 w-12 rounded-xl bg-white/5" />
        </div>
      </div>
    </div>
  );
};
