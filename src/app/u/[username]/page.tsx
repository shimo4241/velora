import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  getProfileByUsername,
  getPortfolio,
  getExperience,
} from "@/lib/firestore";
import { getProfileUrl } from "@/lib/profileUrls";
import { normalizeUsernameInput, validateUsername } from "@/lib/usernames";
import PublicProfileClient from "./PublicProfileClient";

// Revalidate every 60 seconds (ISR)
export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const canonicalUsername = normalizeUsernameInput(username);
  const profile = validateUsername(canonicalUsername).ok
    ? await getProfileByUsername(canonicalUsername)
    : null;
  
  if (!profile) {
    return {
      title: "Profile Not Found | VELORA",
    };
  }

  const title = `${profile.fullName} | VELORA`;
  const description = profile.title 
    ? `${profile.title}${profile.company ? ` at ${profile.company}` : ''}`
    : "Connect with me on VELORA, the exclusive networking platform.";
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: profile.avatarUrl ? [profile.avatarUrl] : [],
      url: getProfileUrl(profile.username),
      siteName: "VELORA",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: profile.avatarUrl ? [profile.avatarUrl] : [],
    },
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const canonicalUsername = normalizeUsernameInput(username);

  if (username !== canonicalUsername) {
    redirect(`/u/${canonicalUsername}`);
  }

  if (!validateUsername(canonicalUsername).ok) {
    notFound();
  }

  const profile = await getProfileByUsername(canonicalUsername);
  
  if (!profile) {
    notFound();
  }

  // Fetch subcollections concurrently
  const [portfolio, experience] = await Promise.all([
    getPortfolio(profile.id),
    getExperience(profile.id),
  ]);

  return (
    <PublicProfileClient
      profile={profile}
      portfolio={portfolio}
      experience={experience}
    />
  );
}
