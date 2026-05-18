import type { NextConfig } from "next";

const isCapacitor = process.env.BUILD_TARGET === "capacitor";

const nextConfig: NextConfig = {
  /* ── Output ── */
  ...(isCapacitor && {
    output: "export",       // Static export for Capacitor only
    trailingSlash: true,
  }),

  /* ── Performance ── */
  reactStrictMode: true,
  poweredByHeader: false,

  /* ── Images ── */
  images: {
    unoptimized: isCapacitor, // Vercel optimizes; Capacitor needs raw
  },

  /* ── Security Headers (Vercel only) ── */
  ...(!isCapacitor && {
    async headers() {
      return [
        {
          source: "/(.*)",
          headers: [
            { key: "X-Content-Type-Options", value: "nosniff" },
            { key: "X-Frame-Options", value: "DENY" },
            { key: "X-XSS-Protection", value: "1; mode=block" },
            { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          ],
        },
      ];
    },
  }),
};

export default nextConfig;
