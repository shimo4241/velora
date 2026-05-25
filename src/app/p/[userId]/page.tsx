import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProfile, getPortfolio, getExperience } from "@/services";
import PublicProfileByIdClient from "./PublicProfileByIdClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ userId: string }>;
}): Promise<Metadata> {
  const { userId } = await params;
  const profile = await getProfile(userId);
  
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
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const profile = await getProfile(userId);
  
  if (!profile) {
    notFound();
  }

  // Fetch subcollections concurrently
  const [portfolio, experience] = await Promise.all([
    getPortfolio(profile.id),
    getExperience(profile.id),
  ]);

  return (
    <PublicProfileByIdClient
      profile={profile}
      portfolio={portfolio}
      experience={experience}
    />
  );
}
