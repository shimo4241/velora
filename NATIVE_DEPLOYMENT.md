# Velora Native Deployment

Velora uses Capacitor as a native shell around the production Next.js runtime at `https://velora-navy.vercel.app`.
This preserves App Router dynamic routes such as `/u/[username]`, Firebase Auth, Firestore, Cloudinary uploads, and SEO.

## Android

Prerequisites:

- Android Studio with Android SDK 35.
- JDK 17 or newer with `JAVA_HOME` set.
- Firebase Android app registered as `com.velora.app`.
- `android/app/google-services.json` added before enabling FCM.

Build commands:

```powershell
npm run build
npx cap sync android
cd android
.\gradlew.bat assembleDebug
.\gradlew.bat bundleRelease
```

Release signing is ready for Gradle properties:

```properties
VELORA_UPLOAD_STORE_FILE=path/to/upload-keystore.jks
VELORA_UPLOAD_STORE_PASSWORD=...
VELORA_UPLOAD_KEY_ALIAS=...
VELORA_UPLOAD_KEY_PASSWORD=...
```

Output paths:

- Debug APK: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release AAB: `android/app/build/outputs/bundle/release/app-release.aab`

## iOS

Prerequisites:

- macOS with Xcode.
- CocoaPods.
- Apple Developer team and bundle id `com.velora.app`.
- Firebase iOS app registered as `com.velora.app`.
- `ios/App/App/GoogleService-Info.plist` added before enabling FCM.

Build commands on macOS:

```bash
npm run build
npx cap sync ios
cd ios/App
pod install
open App.xcworkspace
```

## Native Capabilities

- Auth: Firebase Google Auth uses redirect fallback inside Capacitor WebView and consumes redirect results during auth hydration.
- Deep links: Android supports `https://velora-navy.vercel.app`, `https://velora.app`, and `velora://` intents; iOS URL schemes are configured.
- Geolocation: approximate public location remains coarse; exact GPS remains owner-only in Firestore.
- NFC: Web NFC remains browser-dependent. Unsupported native WebViews fall back to the premium QR flow.
- Haptics/status bar/splash/keyboard: Capacitor plugins are configured and initialized at app startup.
- Push notifications: permission and token registration scaffolding exists in `src/lib/nativeNotifications.ts` and `src/hooks/useNativeNotifications.ts`; native FCM plugin integration is intentionally not enabled yet.
