/* ═══════════════════════════════════════════════════
   VELORA — Authentication
   Phone OTP (Morocco +212) · Persistent sessions
   ═══════════════════════════════════════════════════ */

import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
  type ConfirmationResult,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

/* ── Phone formatter (+212) ── */
export function formatMoroccanPhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  // Already has country code
  if (digits.startsWith("212")) return `+${digits}`;
  // Starts with 0 — replace with +212
  if (digits.startsWith("0")) return `+212${digits.slice(1)}`;
  // Raw number
  return `+212${digits}`;
}

/* ── reCAPTCHA setup ── */
let recaptchaVerifier: RecaptchaVerifier | null = null;

export function setupRecaptcha(containerId: string): RecaptchaVerifier {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
  }
  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
    callback: () => {
      // reCAPTCHA solved
    },
  });
  return recaptchaVerifier;
}

/* ── Send OTP ── */
let confirmationResult: ConfirmationResult | null = null;

export async function sendOTP(phoneNumber: string): Promise<void> {
  const formatted = formatMoroccanPhone(phoneNumber);
  if (!recaptchaVerifier) throw new Error("reCAPTCHA not initialized");
  confirmationResult = await signInWithPhoneNumber(auth, formatted, recaptchaVerifier);
}

/* ── Verify OTP ── */
export async function verifyOTP(code: string): Promise<User> {
  if (!confirmationResult) throw new Error("No OTP sent");
  const result = await confirmationResult.confirm(code);
  const user = result.user;

  // Create profile if first login
  const profileRef = doc(db, "users", user.uid);
  const profileSnap = await getDoc(profileRef);

  if (!profileSnap.exists()) {
    await setDoc(profileRef, {
      fullName: "",
      username: user.uid.slice(0, 8).toLowerCase(),
      title: "",
      company: "",
      location: "Casablanca, Morocco",
      bio: "",
      phone: user.phoneNumber || "",
      email: "",
      website: "",
      avatarUrl: "",
      coverUrl: "",
      socialLinks: [],
      professionalMode: "entrepreneur",
      locale: "fr",
      isVerified: false,
      isPremium: false,
      isNoir: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  return user;
}

/* ── Sign out ── */
export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

/* ── Auth state listener ── */
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
