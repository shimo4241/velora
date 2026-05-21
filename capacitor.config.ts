import type { CapacitorConfig } from "@capacitor/cli";

const nativeServerUrl =
  process.env.CAPACITOR_SERVER_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://velora-navy.vercel.app";

const config: CapacitorConfig = {
  appId: "com.velora.app",
  appName: "Velora",
  webDir: "native-shell",

  server: {
    url: nativeServerUrl,
    androidScheme: "https",
    iosScheme: "https",
    cleartext: false,
    allowNavigation: [
      "velora-navy.vercel.app",
      "*.vercel.app",
      "*.firebaseapp.com",
      "*.googleapis.com",
      "*.gstatic.com",
      "*.google.com",
      "res.cloudinary.com",
    ],
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 1800,
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
      url: "velora.app",
    },
  },

  android: {
    backgroundColor: "#070705",
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    buildOptions: {
      releaseType: "AAB",
    },
  },

  ios: {
    backgroundColor: "#070705",
    contentInset: "always",
    allowsLinkPreview: false,
    scrollEnabled: true,
    preferredContentMode: "mobile",
    scheme: "Velora",
  },
};

export default config;
