"use client";

import { useState } from "react";
import { getOptimizedCloudinaryUrl } from "@/lib/cloudinary";

interface OptimizedImageProps {
  src?: string | null;
  type: "avatar" | "cover" | "portfolio" | "raw";
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function OptimizedImage({
  src,
  type,
  alt = "",
  className = "",
  style,
}: OptimizedImageProps) {
  const [prevSrc, setPrevSrc] = useState(src);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (src !== prevSrc) {
    setPrevSrc(src);
    setLoaded(false);
    setError(false);
  }

  if (!src) {
    return (
      <div
        className={`bg-velora-surface/40 flex items-center justify-center text-velora-text-muted ${className}`}
        style={style}
      >
        <span className="text-[10px] uppercase tracking-wider font-semibold">No Image</span>
      </div>
    );
  }

  // Optimize URLs using Cloudinary delivery features
  const optimizedUrl = getOptimizedCloudinaryUrl(src, type);
  const placeholderUrl = getOptimizedCloudinaryUrl(src, "placeholder");

  return (
    <div className={`relative overflow-hidden ${className}`} style={style}>
      {/* 1. Blurred Tiny Placeholder */}
      {!loaded && !error && (
        <div
          className="absolute inset-0 bg-cover bg-center blur-md scale-105 transition-opacity duration-500 ease-out"
          style={{ backgroundImage: `url(${placeholderUrl})` }}
        />
      )}

      {/* 2. Premium Shimmer Skeleton Loader */}
      {!loaded && !error && (
        <div className="premium-skeleton absolute inset-0 w-full h-full pointer-events-none" />
      )}

      {/* 3. Main Image with elegant fade-in */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={optimizedUrl}
        alt={alt}
        className={`h-full w-full object-cover transition-all duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
          loaded ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-[1.03] blur-[4px]"
        }`}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setError(true);
          setLoaded(true);
        }}
        loading="lazy"
      />

      {/* Error State Fallback */}
      {error && (
        <div className="absolute inset-0 bg-velora-surface/60 flex items-center justify-center text-velora-text-muted text-xs">
          <span>Failed to load</span>
        </div>
      )}
    </div>
  );
}
