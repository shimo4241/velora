export interface VisualTheme {
  id: string;
  name: string;
  description: string;
  accentColor: string;
  bgPreview: string;
  isLight?: boolean;
}

export const VISUAL_THEMES: VisualTheme[] = [
  {
    id: "gold",
    name: "Velora Gold",
    description: "Ambiance noire et or cinématique, prestige tranquille",
    accentColor: "#C4A265",
    bgPreview: "#070705",
  },
  {
    id: "executive",
    name: "Midnight Executive",
    description: "Graphite et argent, style corporate exécutif haut de gamme",
    accentColor: "#A5B4FC",
    bgPreview: "#0E0F12",
  },
  {
    id: "neon",
    name: "Creative Neon",
    description: "Futuriste créatif, violet magnétique et éclats de cyan",
    accentColor: "#D946EF",
    bgPreview: "#06020B",
  },
  {
    id: "terra",
    name: "Terra Elite",
    description: "Tons sable et bronze, luxe naturel et organique",
    accentColor: "#D97706",
    bgPreview: "#0C0B0A",
  },
  {
    id: "medical",
    name: "Medical Precision",
    description: "Blanc stérile et bleu glacier, pureté médicale prestigieuse",
    accentColor: "#0F766E",
    bgPreview: "#F1F5F9",
    isLight: true,
  },
  {
    id: "noir",
    name: "Noir Phantom",
    description: "Furtif et minimaliste, noir absolu et anthracite",
    accentColor: "#737373",
    bgPreview: "#000000",
  },
];

export function applyVisualTheme(themeId: string, persist = true) {
  if (typeof window === "undefined") return;

  // Temporarily enable transitions for smooth switches
  document.documentElement.style.setProperty("--theme-transition-duration", "0.3s");

  // Apply theme attribute
  document.documentElement.setAttribute("data-theme", themeId);

  if (persist) {
    // Save to localStorage
    localStorage.setItem("velora_visual_theme", themeId);

    // Handle light-mode toggle for medical theme compatibility
    if (themeId === "medical") {
      document.documentElement.classList.add("light");
      localStorage.setItem("velora_theme", "light");
    } else {
      document.documentElement.classList.remove("light");
      localStorage.setItem("velora_theme", "dark");
    }
  } else {
    if (themeId === "medical") {
      document.documentElement.classList.add("light");
    } else {
      // Restore light/dark based on what's in local storage
      const savedTheme = localStorage.getItem("velora_theme") || "dark";
      if (savedTheme === "light") {
        document.documentElement.classList.add("light");
      } else {
        document.documentElement.classList.remove("light");
      }
    }
  }
}

/**
 * Recommends a theme based on professional mode or category.
 */
export function getRecommendedTheme(professionalMode?: string): string {
  if (!professionalMode) return "gold";
  
  const mode = professionalMode.toLowerCase();
  if (mode === "dentist" || mode === "medical") {
    return "medical";
  }
  if (mode === "creative" || mode === "artist" || mode === "creator") {
    return "neon";
  }
  if (mode === "corporate" || mode === "business" || mode === "vip") {
    return "executive";
  }
  if (mode === "luxury" || mode === "nightlife") {
    return "noir";
  }
  return "gold";
}
