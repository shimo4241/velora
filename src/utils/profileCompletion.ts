import type { VeloraProfile } from "@/types";

export interface ProfileCompletionItem {
  id: string;
  labelKey: string;
  complete: boolean;
  weight: number; // weight out of 100
  section: "header" | "bio" | "skills" | "portfolio" | "experience" | "contact" | "social" | "services" | "theme" | "availability" | "share";
}

export interface ProfileCompletionResult {
  score: number;
  items: ProfileCompletionItem[];
}

export function calculateProfileCompletion(profile: VeloraProfile | null): ProfileCompletionResult {
  if (!profile) {
    return { score: 0, items: [] };
  }

  const items: ProfileCompletionItem[] = [
    {
      id: "avatar",
      labelKey: "completion_avatar",
      complete: Boolean(profile.avatarUrl && profile.avatarUrl.trim()),
      weight: 15,
      section: "header",
    },
    {
      id: "bio",
      labelKey: "completion_bio",
      complete: Boolean(profile.bio && profile.bio.trim().length >= 20),
      weight: 15,
      section: "bio",
    },
    {
      id: "title",
      labelKey: "completion_title",
      complete: Boolean(profile.title && profile.title.trim()),
      weight: 10,
      section: "header",
    },
    {
      id: "whatsapp",
      labelKey: "completion_whatsapp",
      complete: Boolean(profile.whatsapp && profile.whatsapp.trim()),
      weight: 10,
      section: "contact",
    },
    {
      id: "social",
      labelKey: "completion_social",
      complete: Boolean(profile.socialLinks && profile.socialLinks.length >= 1),
      weight: 10,
      section: "social",
    },
    {
      id: "services",
      labelKey: "completion_services",
      complete: Boolean(profile.services && profile.services.length >= 1),
      weight: 10,
      section: "services",
    },
    {
      id: "cover",
      labelKey: "completion_cover",
      complete: Boolean(profile.coverUrl && profile.coverUrl.trim()),
      weight: 10,
      section: "header",
    },
    {
      id: "location",
      labelKey: "completion_location",
      complete: Boolean(profile.location && profile.location.trim()),
      weight: 10,
      section: "header",
    },
    {
      id: "share",
      labelKey: "completion_share_once",
      complete: Boolean(profile.hasShared),
      weight: 10,
      section: "share",
    },
  ];

  // Calculate score based on weights of completed items
  let score = 0;
  items.forEach((item) => {
    if (item.complete) {
      score += item.weight;
    }
  });

  return { score, items };
}
