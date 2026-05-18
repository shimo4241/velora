/* ═══════════════════════════════════════════════════
   VELORA — Authentication
   Anonymous / Frictionless Identity
   ═══════════════════════════════════════════════════ */

import {
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth } from "./firebase";

/* ── Sign out ── */
export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

/* ── Auth state listener ── */
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
