"use client";

import { useState, useEffect, useRef } from "react";
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
  const imgRef = useRef<HTMLImageElement>(null);

  if (src !== prevSrc) {
    setPrevSrc(src);
    setLoaded(false);
    setError(false);
  }

  // 1. Sync checks for cached images on mount or src change
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    if (img.complete) {
      if (img.naturalWidth === 0) {
        setError(true);
      } else {
        setLoaded(true);
      }
    }
  }, [src]);

  // 2. Loading Timeout Fallback: force loaded state if stuck > 3.5s to bypass skeletons
  useEffect(() => {
    if (!src || loaded || error) return;

    const timer = setTimeout(() => {
      console.warn(`[OptimizedImage] Loading timeout triggered for: ${src}`);
      setLoaded(true);
    }, 3500);

    return () => clearTimeout(timer);
  }, [src, loaded, error]);

  const getInitials = (name: string): string => {
    if (!name) return "";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const renderFallback = () => {
    if (type === "avatar") {
      const initials = getInitials(alt || "U");
      return (
        <div
          className={`flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_50%_20%,rgba(var(--identity-accent-rgb,196,162,101),0.22),transparent_48%),#111] font-[family-name:var(--font-display)] font-semibold text-[var(--identity-accent,#c4a265)] text-3xl ${className}`}
          style={style}
        >
          {initials}
        </div>
      );
    }

    return (
      <div
        className={`bg-velora-surface/40 flex items-center justify-center text-velora-text-muted ${className}`}
        style={style}
      >
        <span className="text-[10px] uppercase tracking-wider font-semibold">No Image</span>
      </div>
    );
  };

  if (!src) {
    return renderFallback();
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
        ref={imgRef}
        src={optimizedUrl}
        alt={alt}
        className={`h-full w-full object-cover transition-all duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
          loaded && !error ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-[1.03] blur-[4px]"
        }`}
        onLoad={() => {
          setLoaded(true);
          setError(false);
        }}
        onError={() => {
          setError(true);
          setLoaded(true);
        }}
        loading="lazy"
      />

      {/* 4. Error State Fallback */}
      {error && (
        <div className="absolute inset-0 h-full w-full">
          {renderFallback()}
        </div>
      )}
    </div>
  );
}
