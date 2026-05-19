import { normalizeUsernameInput } from "./usernames";

export function getAppUrl(): string {
  const configuredUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://velora-navy.vercel.app";

  return configuredUrl.replace(/\/+$/, "");
}

export function getProfileUrl(username: string): string {
  const slug = normalizeUsernameInput(username);
  return `${getAppUrl()}/u/${slug}`;
}

export function getProfileShortUrl(username: string): string {
  const slug = normalizeUsernameInput(username);

  try {
    return `${new URL(getAppUrl()).host}/u/${slug}`;
  } catch {
    return `${getAppUrl().replace(/^https?:\/\//, "")}/u/${slug}`;
  }
}
