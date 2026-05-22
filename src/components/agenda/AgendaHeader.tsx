"use client";

import React from "react";
import { useTranslation } from "@/lib/i18n";
import { AgendaFilter, EventCategory } from "@/types";
import { Sparkles, Search, X, MapPin } from "lucide-react";
import { motion } from "framer-motion";

interface AgendaHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCity: string;
  onCityChange: (city: string) => void;
  activeFilter: AgendaFilter;
  onFilterChange: (filter: AgendaFilter) => void;
  selectedCategory: EventCategory | null;
  onCategoryChange: (category: EventCategory | null) => void;
}

const cities = ["All", "Casablanca", "Rabat", "Marrakech", "Fès", "Tangier", "Agadir"];

const cityTranslations: Record<string, Record<string, string>> = {
  fr: { All: "Toutes les villes", Casablanca: "Casablanca", Rabat: "Rabat", Marrakech: "Marrakech", Fès: "Fès", Tangier: "Tanger", Agadir: "Agadir" },
  en: { All: "All Cities", Casablanca: "Casablanca", Rabat: "Rabat", Marrakech: "Marrakech", Fès: "Fez", Tangier: "Tangier", Agadir: "Agadir" },
  es: { All: "Todas las ciudades", Casablanca: "Casablanca", Rabat: "Rabat", Marrakech: "Marrakech", Fès: "Fez", Tangier: "Tánger", Agadir: "Agadir" },
  ar: { All: "كل المدن", Casablanca: "الدار البيضاء", Rabat: "الرباط", Marrakech: "مراكش", Fès: "فاس", Tangier: "طنجة", Agadir: "أكادير" }
};

const filterTranslationKeys: Record<AgendaFilter, string> = {
  today: "filter_today",
  "this-week": "filter_this_week",
  "this-month": "filter_this_month",
  nearby: "filter_nearby",
  trending: "filter_trending"
};

const categoryLabels: Record<string, Record<string, string>> = {
  fr: {
    all: "Tous",
    festival: "Festivals",
    congress: "Congrès",
    exposition: "Expositions",
    networking: "Networking",
    startup: "Startups",
    "portes-ouvertes": "Portes Ouvertes",
    concert: "Concerts",
    "business-summit": "Business",
    "tech-conference": "Tech",
    "art-fashion": "Art & Mode",
    "medical-dental": "Médical",
    "nightlife-vip": "Soirée & VIP",
  },
  en: {
    all: "All",
    festival: "Festivals",
    congress: "Congresses",
    exposition: "Expositions",
    networking: "Networking",
    startup: "Startups",
    "portes-ouvertes": "Open House",
    concert: "Concerts",
    "business-summit": "Business",
    "tech-conference": "Tech",
    "art-fashion": "Art & Fashion",
    "medical-dental": "Medical",
    "nightlife-vip": "Nightlife & VIP",
  },
  es: {
    all: "Todos",
    festival: "Festivales",
    congress: "Congresos",
    exposition: "Exposiciones",
    networking: "Networking",
    startup: "Startups",
    "portes-ouvertes": "Puertas Abiertas",
    concert: "Conciertos",
    "business-summit": "Negocios",
    "tech-conference": "Tech",
    "art-fashion": "Arte y Moda",
    "medical-dental": "Médico",
    "nightlife-vip": "Vida Nocturna & VIP",
  },
  ar: {
    all: "الكل",
    festival: "مهرجانات",
    congress: "مؤتمرات",
    exposition: "معارض",
    networking: "تواصل مهني",
    startup: "شركات ناشئة",
    "portes-ouvertes": "أبواب مفتوحة",
    concert: "حفلات",
    "business-summit": "أعمال",
    "tech-conference": "تكنولوجيا",
    "art-fashion": "فن وموضة",
    "medical-dental": "طبي",
    "nightlife-vip": "سهرات & VIP",
  }
};

const categoriesList: EventCategory[] = [
  "festival",
  "congress",
  "exposition",
  "networking",
  "startup",
  "portes-ouvertes",
  "concert",
  "business-summit",
  "tech-conference",
  "art-fashion",
  "medical-dental",
  "nightlife-vip"
];

export const AgendaHeader: React.FC<AgendaHeaderProps> = ({
  searchQuery,
  onSearchChange,
  selectedCity,
  onCityChange,
  activeFilter,
  onFilterChange,
  selectedCategory,
  onCategoryChange
}) => {
  const { t, locale, isRtl } = useTranslation();

  const getCityLabel = (city: string) => {
    return cityTranslations[locale]?.[city] || city;
  };

  const getCategoryLabel = (cat: string) => {
    return categoryLabels[locale]?.[cat] || cat;
  };

  return (
    <header className="relative w-full z-10 pt-14 px-5">
      {/* Title block */}
      <div className="flex items-end justify-between gap-4 mb-4">
        <div>
          <div
            className="mb-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{
              border: "1px solid rgba(196, 162, 101, 0.2)",
              background: "rgba(196, 162, 101, 0.1)",
              color: "var(--color-velora-gold)",
            }}
          >
            <Sparkles size={12} />
            {t("agenda_subtitle")}
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold leading-none">
            {t("agenda_title")}
          </h1>
        </div>

        {/* City Selector */}
        <div className="relative">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/[0.045] border border-white/10 text-xs font-semibold backdrop-blur-xl">
            <MapPin size={13} className="text-velora-gold" />
            <select
              value={selectedCity}
              onChange={(e) => onCityChange(e.target.value)}
              className="bg-transparent border-none outline-none text-velora-text cursor-pointer pr-1"
              style={{ WebkitAppearance: "none", MozAppearance: "none" }}
            >
              {cities.map((city) => (
                <option key={city} value={city} className="bg-velora-black text-velora-text">
                  {getCityLabel(city)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-5">
        <Search size={16} className={`absolute ${isRtl ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 text-velora-text-muted`} />
        <input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={locale === "ar" ? "ابحث عن فعاليات..." : "Rechercher des événements..."}
          className={`h-12 w-full rounded-2xl border border-white/10 bg-white/[0.045] ${isRtl ? "pr-11 pl-10" : "pl-11 pr-10"} text-sm text-velora-text outline-none backdrop-blur-xl placeholder:text-velora-text-muted/60 focus:border-velora-gold/30`}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className={`absolute ${isRtl ? "left-3" : "right-3"} top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/8 text-velora-text-muted`}
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Time Filters Scroll Container */}
      <div className="w-full overflow-x-auto scrollbar-none mb-4 -mx-5 px-5">
        <div className="flex gap-2 min-w-max pb-1">
          {(["today", "this-week", "this-month", "nearby", "trending"] as AgendaFilter[]).map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <motion.button
                key={filter}
                onClick={() => onFilterChange(filter)}
                className={`relative px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all duration-300 ${
                  isActive
                    ? "bg-velora-gold text-velora-black border-velora-gold"
                    : "bg-white/[0.03] text-velora-text-secondary border-white/5 hover:border-white/10"
                }`}
                whileTap={{ scale: 0.96 }}
              >
                {t(filterTranslationKeys[filter])}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Categories Horizontal Scroll */}
      <div className="w-full overflow-x-auto scrollbar-none -mx-5 px-5 mb-2">
        <div className="flex gap-1.5 min-w-max pb-2">
          {/* "All" Category Badge */}
          <button
            onClick={() => onCategoryChange(null)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-semibold tracking-wider uppercase border transition-all duration-200 ${
              selectedCategory === null
                ? "bg-white text-velora-black border-white"
                : "bg-white/5 text-velora-text-muted border-white/5 hover:border-white/10"
            }`}
          >
            {getCategoryLabel("all")}
          </button>

          {categoriesList.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => onCategoryChange(cat)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-semibold tracking-wider uppercase border transition-all duration-200 category-${cat} ${
                  isActive
                    ? "bg-white text-velora-black border-white"
                    : "bg-white/5 text-velora-text-secondary border-white/5 hover:border-white/10"
                }`}
                style={{
                  color: isActive ? "var(--color-velora-black)" : "var(--cat-color, var(--color-velora-text-secondary))",
                  borderColor: isActive ? "white" : "rgba(255, 255, 255, 0.05)"
                }}
              >
                {getCategoryLabel(cat)}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
