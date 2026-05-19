import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.velora.mobile",
  appName: "VELORA",
  webDir: "out",  // Next.js static export output

  /* ── Server ── */
  server: {
    androidScheme: "https",
    iosScheme: "https",
  },

  /* ── Plugins ── */
  plugins: {
    SplashScreen: {
      launchShowDuration: 2800,
      launchAutoHide: true,
      backgroundColor: "#070705",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#070705",
      overlaysWebView: true,
    },
    Keyboard: {
      resize: "body" as const,
      resizeOnFullScreen: true,
    },
    Haptics: {},
    App: {
      // Deep links — Phase 2
      // url: "velora.app",
    },
  },

  /* ── Android ── */
  android: {
    backgroundColor: "#070705",
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    buildOptions: {
      releaseType: "AAB",
    },
  },

  /* ── iOS ── */
  ios: {
    backgroundColor: "#070705",
    contentInset: "always",
    allowsLinkPreview: false,
    scrollEnabled: true,
    preferredContentMode: "mobile",
    scheme: "VELORA",
  },
};

export default config;
