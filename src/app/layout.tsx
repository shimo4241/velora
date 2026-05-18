import type { Metadata, Viewport } from "next";
import "./globals.css";

/* ═══════════════════════════════════════════════════
   VELORA — Root Layout
   Production metadata, SEO, Open Graph, PWA
   ═══════════════════════════════════════════════════ */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://velora.app";

export const metadata: Metadata = {
  /* ── Core ── */
  title: {
    default: "VELORA — Your Identity, Elevated",
    template: "%s | VELORA",
  },
  description:
    "Premium professional identity ecosystem for Morocco, GCC, and Africa. Share your identity via NFC, QR, and WhatsApp.",
  applicationName: "VELORA",
  generator: "Next.js",
  keywords: [
    "VELORA",
    "professional identity",
    "NFC business card",
    "digital networking",
    "Morocco",
    "MENA",
    "luxury networking",
    "QR code profile",
    "WhatsApp networking",
  ],
  authors: [{ name: "VELORA", url: SITE_URL }],
  creator: "VELORA",

  /* ── Icons ── */
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },

  /* ── PWA ── */
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VELORA",
  },

  /* ── Open Graph ── */
  openGraph: {
    type: "website",
    locale: "fr_MA",
    url: SITE_URL,
    siteName: "VELORA",
    title: "VELORA — Your Identity, Elevated",
    description:
      "The luxury professional identity ecosystem. Share your identity via NFC, QR, and WhatsApp.",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "VELORA — Premium Professional Identity",
      },
    ],
  },

  /* ── Twitter ── */
  twitter: {
    card: "summary_large_image",
    title: "VELORA — Your Identity, Elevated",
    description:
      "Premium professional identity ecosystem for Morocco, GCC, and Africa.",
    images: [`${SITE_URL}/og-image.png`],
    creator: "@veloraapp",
  },

  /* ── Robots ── */
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },

  /* ── Verification (fill when available) ── */
  // verification: {
  //   google: "your-google-verification-code",
  // },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#070705" },
    { media: "(prefers-color-scheme: light)", color: "#070705" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" dir="ltr" suppressHydrationWarning>
      <head>
        {/* Preconnect for Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="noise-overlay zellige-overlay antialiased">
        {children}
      </body>
    </html>
  );
}
