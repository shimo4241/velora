import type { Metadata, Viewport } from "next";
import { AppProviders } from "@/providers/AppProviders";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { getAppUrl } from "@/utils/profileUrls";
import "./globals.css";

/* ═══════════════════════════════════════════════════
   VELORA — Root Layout
   Production metadata, SEO, Open Graph, PWA
   ═══════════════════════════════════════════════════ */

const APP_URL = getAppUrl();

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
  metadataBase: new URL(APP_URL),
  authors: [{ name: "VELORA", url: APP_URL }],
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
    url: APP_URL,
    siteName: "VELORA",
    title: "VELORA — Your Identity, Elevated",
    description:
      "The luxury professional identity ecosystem. Share your identity via NFC, QR, and WhatsApp.",
    images: [
      {
        url: `${APP_URL}/og-image.png`,
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
    images: [`${APP_URL}/og-image.png`],
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
        {/* Preconnect for hosted font styles */}
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          rel="preconnect"
          href="https://cdn.fontshare.com"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var visualTheme = localStorage.getItem('velora_visual_theme') || 'gold';
                  document.documentElement.setAttribute('data-theme', visualTheme);
                  if (visualTheme === 'medical') {
                    document.documentElement.classList.add('light');
                  } else {
                    var theme = localStorage.getItem('velora_theme') || 'dark';
                    if (theme === 'light') {
                      document.documentElement.classList.add('light');
                    } else {
                      document.documentElement.classList.remove('light');
                    }
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="noise-overlay zellige-overlay antialiased">
        <AppProviders>
          <OfflineBanner />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
