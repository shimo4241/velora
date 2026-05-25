export const RESERVED_USERNAMES = [
  "admin",
  "api",
  "app",
  "account",
  "accounts",
  "about",
  "billing",
  "business",
  "contact",
  "dashboard",
  "discover",
  "help",
  "home",
  "legal",
  "login",
  "logout",
  "mail",
  "network",
  "nfc",
  "premium",
  "privacy",
  "profile",
  "profiles",
  "qr",
  "register",
  "settings",
  "share",
  "signin",
  "signup",
  "sms",
  "support",
  "terms",
  "u",
  "user",
  "users",
  "velora",
  "wallet",
  "whatsapp",
  "www",
] as const;

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;
export const USERNAME_PATTERN = /^[a-z0-9]+$/;

const RESERVED_USERNAME_SET = new Set<string>(RESERVED_USERNAMES);

export type UsernameValidation =
  | { ok: true; username: string }
  | { ok: false; username: string; error: string };

export function normalizeUsernameInput(value: string): string {
  return value.toLowerCase();
}

export function isReservedUsername(username: string): boolean {
  return RESERVED_USERNAME_SET.has(username);
}

export function validateUsername(value: string): UsernameValidation {
  const username = normalizeUsernameInput(value);

  if (!username) {
    return { ok: false, username, error: "Username is required." };
  }

  if (username !== value) {
    return { ok: false, username, error: "Use lowercase letters only." };
  }

  if (username.length < USERNAME_MIN_LENGTH || username.length > USERNAME_MAX_LENGTH) {
    return {
      ok: false,
      username,
      error: `Username must be ${USERNAME_MIN_LENGTH}-${USERNAME_MAX_LENGTH} characters.`,
    };
  }

  if (!USERNAME_PATTERN.test(username)) {
    return {
      ok: false,
      username,
      error: "Use only lowercase letters and numbers.",
    };
  }

  if (isReservedUsername(username)) {
    return { ok: false, username, error: "This username is reserved." };
  }

  return { ok: true, username };
}

export function createUsernameSeed(value: string, fallback = "user"): string {
  const seed = normalizeUsernameInput(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .slice(0, USERNAME_MAX_LENGTH);

  return seed || fallback;
}

export function usernameWithCounter(base: string, counter: number): string {
  const suffix = String(counter);
  return `${base.slice(0, USERNAME_MAX_LENGTH - suffix.length)}${suffix}`;
}
