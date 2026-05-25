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

export const dynamic = "force-dynamic";

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
  
  const isPrivate = profile.settings?.privacy?.allowIndexing === false;

  return {
    title,
    description,
    robots: isPrivate ? "noindex, nofollow" : "index, follow",
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

  const isPrivate = profile.settings?.privacy?.allowIndexing === false;

  return (
    <>
      {!isPrivate && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              "name": profile.fullName,
              "jobTitle": profile.title || undefined,
              "worksFor": profile.company
                ? {
                    "@type": "Organization",
                    "name": profile.company,
                  }
                : undefined,
              "image": profile.avatarUrl || undefined,
              "description": profile.bio || undefined,
              "url": getProfileUrl(profile.username),
              "sameAs": profile.socialLinks?.map((link) => link.url) || [],
            }),
          }}
        />
      )}
      <PublicProfileClient
        profile={profile}
        portfolio={portfolio}
        experience={experience}
      />
    </>
  );
}
