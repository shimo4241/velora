"use client";

import Image from "next/image";
import { useState } from "react";
import { getOptimizedCloudinaryUrl } from "@/lib/cloudinary";

interface OptimizedImageProps {
  src?: string | null;
  type: "avatar" | "cover" | "portfolio" | "raw";
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
}

function getInitials(name: string): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getSizes(type: OptimizedImageProps["type"]) {
  if (type === "avatar") return "96px";
  if (type === "cover") return "100vw";
  return "(max-width: 768px) 100vw, 50vw";
}

function shouldBypassOptimization(src: string) {
  return src.startsWith("blob:") || src.startsWith("data:");
}

function FallbackImage({
  type,
  alt,
  className,
  style,
}: Required<Pick<OptimizedImageProps, "type" | "alt" | "className">> &
  Pick<OptimizedImageProps, "style">) {
  if (type === "avatar") {
    const initials = getInitials(alt || "U");
    return (
      <div
        className={`flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_50%_20%,var(--color-velora-gold-dim),transparent_48%),var(--color-velora-dark)] font-[family-name:var(--font-display)] font-semibold text-[var(--identity-accent,var(--color-velora-gold))] text-3xl ${className}`}
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
}

function OptimizedImageFrame({
  optimizedUrl,
  placeholderUrl,
  type,
  alt,
  className,
  style,
}: {
  optimizedUrl: string;
  placeholderUrl: string;
  type: OptimizedImageProps["type"];
  alt: string;
  className: string;
  style?: React.CSSProperties;
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={`relative overflow-hidden ${className}`} style={style}>
      {!loaded && !error && (
        <div
          className="absolute inset-0 bg-cover bg-center blur-md scale-105 transition-opacity duration-500 ease-out"
          style={{ backgroundImage: `url(${placeholderUrl})` }}
        />
      )}

      {!loaded && !error && (
        <div className="premium-skeleton absolute inset-0 w-full h-full pointer-events-none" />
      )}

      <Image
        src={optimizedUrl}
        alt={alt}
        fill
        sizes={getSizes(type)}
        unoptimized={shouldBypassOptimization(optimizedUrl)}
        className={`object-cover transition-all duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
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
      />

      {error && (
        <div className="absolute inset-0 h-full w-full">
          <FallbackImage type={type} alt={alt} className={className} style={style} />
        </div>
      )}
    </div>
  );
}

export function OptimizedImage({
  src,
  type,
  alt = "",
  className = "",
  style,
}: OptimizedImageProps) {
  if (!src) {
    return <FallbackImage type={type} alt={alt} className={className} style={style} />;
  }

  const optimizedUrl = getOptimizedCloudinaryUrl(src, type);
  const placeholderUrl = getOptimizedCloudinaryUrl(src, "placeholder");

  return (
    <OptimizedImageFrame
      key={optimizedUrl}
      optimizedUrl={optimizedUrl}
      placeholderUrl={placeholderUrl}
      type={type}
      alt={alt}
      className={className}
      style={style}
    />
  );
}
