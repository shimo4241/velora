# VELORA — Premium Professional Identity Ecosystem

A digital business card and professional networking app for the MENA market,
built with Next.js, Firebase, and Capacitor for iOS/Android.

## Features
- Digital business card with NFC, QR, WhatsApp sharing
- Professional profiles: entrepreneur, dentist, creative, corporate, VIP...
- Real-time networking radar with geolocation
- Event agenda and check-in system
- 4 languages: French, Arabic, English, Spanish (RTL support)
- 6 visual themes with dark mode

## Tech Stack
- **Framework**: Next.js 16 + React 19 + TypeScript
- **Backend**: Firebase Firestore + Firebase Auth (Google)
- **Storage**: Cloudinary (images)
- **Mobile**: Capacitor 7 (iOS + Android)
- **Styling**: Tailwind CSS v4

## Getting Started

1. Clone the repo
2. Copy `.env.example` to `.env.local` and fill in all values
3. Run `npm install`
4. Run `npm run dev`

## Environment Variables
See `.env.example` for all required variables:
- Firebase project config (`NEXT_PUBLIC_FIREBASE_*`)
- Cloudinary config (`NEXT_PUBLIC_CLOUDINARY_*`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`)
- Sentry DSN (`NEXT_PUBLIC_SENTRY_DSN`)
- Cron secret (`CRON_SECRET`)

## Mobile Build
```bash
npm run cap:sync       # Build and sync to native
npm run cap:android    # Open Android Studio
npm run cap:ios        # Open Xcode
```
