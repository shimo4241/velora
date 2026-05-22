"use client";

import React from "react";
import { EventCategory } from "@/types";

interface CategoryBadgeProps {
  category: EventCategory;
  locale?: string;
  className?: string;
}

const categoryTranslations: Record<string, Record<string, string>> = {
  fr: {
    festival: "Festival",
    congress: "Congrès",
    exposition: "Exposition",
    networking: "Networking",
    startup: "Startup",
    "portes-ouvertes": "Portes Ouvertes",
    concert: "Concert",
    "business-summit": "Business Summit",
    "tech-conference": "Conférence Tech",
    "art-fashion": "Art & Mode",
    "medical-dental": "Médical & Dentaire",
    "nightlife-vip": "Soirée & VIP",
  },
  en: {
    festival: "Festival",
    congress: "Congress",
    exposition: "Exposition",
    networking: "Networking",
    startup: "Startup",
    "portes-ouvertes": "Open House",
    concert: "Concert",
    "business-summit": "Business Summit",
    "tech-conference": "Tech Conference",
    "art-fashion": "Art & Fashion",
    "medical-dental": "Medical & Dental",
    "nightlife-vip": "Nightlife & VIP",
  },
  es: {
    festival: "Festival",
    congress: "Congreso",
    exposition: "Exposición",
    networking: "Networking",
    startup: "Startup",
    "portes-ouvertes": "Puertas Abiertas",
    concert: "Concierto",
    "business-summit": "Cumbre de Negocios",
    "tech-conference": "Conferencia Tech",
    "art-fashion": "Arte y Moda",
    "medical-dental": "Médico y Dental",
    "nightlife-vip": "Vida Nocturna y VIP",
  },
  ar: {
    festival: "مهرجان",
    congress: "مؤتمر",
    exposition: "معرض",
    networking: "تواصل مهني",
    startup: "شركة ناشئة",
    "portes-ouvertes": "أبواب مفتوحة",
    concert: "حفل موسيقي",
    "business-summit": "قمة أعمال",
    "tech-conference": "مؤتمر تقني",
    "art-fashion": "فن وموضة",
    "medical-dental": "طبي وأسنان",
    "nightlife-vip": "سهرات و VIP",
  },
};

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  locale = "fr",
  className = "",
}) => {
  const activeLocale = categoryTranslations[locale] ? locale : "fr";
  const label = categoryTranslations[activeLocale]?.[category] ?? category;

  return (
    <span className={`category-badge category-${category} ${className}`}>
      {label}
    </span>
  );
};
