"use client";

import React, { useState, useMemo } from "react";
import { useTranslation } from "@/lib/i18n";
import { useEvents } from "@/hooks/useEvents";
import { AgendaFilter, EventCategory } from "@/types";
import { AgendaHeader } from "@/components/agenda/AgendaHeader";
import { EventCard } from "@/components/agenda/EventCard";
import { EventSkeleton } from "@/components/agenda/EventSkeleton";
import { AgendaEmptyState } from "@/components/agenda/AgendaEmptyState";
import { EventDetailPanel } from "@/components/agenda/EventDetailPanel";
import { FadeUp, StaggerChildren } from "@/components/motion/animations";
import { AnimatePresence } from "framer-motion";
import { Star, Sparkles } from "lucide-react";

export function AgendaScreen() {
  const { t } = useTranslation();

  // State Management
  const [activeFilter, setActiveFilter] = useState<AgendaFilter>("today");
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Fetch events using hook
  const { events, loading, error } = useEvents(activeFilter, selectedCategory, selectedCity);

  // Client-side search filtering
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const search = searchQuery.toLowerCase().trim();
      if (!search) return true;
      return (
        event.title.toLowerCase().includes(search) ||
        event.description.toLowerCase().includes(search) ||
        event.organizer.toLowerCase().includes(search) ||
        event.venue.toLowerCase().includes(search) ||
        event.city.toLowerCase().includes(search) ||
        event.tags.some((tag) => tag.toLowerCase().includes(search))
      );
    });
  }, [events, searchQuery]);

  // Separate featured/sponsored events for highlight carousel
  const { featuredEvents, standardEvents } = useMemo(() => {
    const featured = filteredEvents.filter((e) => e.isFeatured || e.isSponsored);
    const standard = filteredEvents.filter((e) => !e.isFeatured && !e.isSponsored);
    return { featuredEvents: featured, standardEvents: standard };
  }, [filteredEvents]);

  const handleCardTap = (eventId: string) => {
    setSelectedEventId(eventId);
  };

  const handleCloseDetail = () => {
    setSelectedEventId(null);
  };

  return (
    <div className="agenda-screen min-h-screen pb-28 text-velora-text relative">
      {/* Ambient gold glow at top */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 h-[420px] z-0"
        style={{
          background: `
            radial-gradient(circle at 50% -8%, color-mix(in srgb, var(--color-velora-gold) 14%, transparent), transparent 52%),
            radial-gradient(circle at 20% 10%, color-mix(in srgb, var(--color-velora-gold) 6%, transparent), transparent 36%),
            radial-gradient(circle at 80% 10%, color-mix(in srgb, var(--color-velora-gold) 6%, transparent), transparent 36%)
          `,
        }}
      />

      {/* Screen Header */}
      <AgendaHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCity={selectedCity}
        onCityChange={setSelectedCity}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Content Body */}
      <main className="relative px-5 pt-4 z-10">
        {loading ? (
          // Shimmer loading state
          <div className="grid grid-cols-1 gap-6">
            <EventSkeleton />
            <EventSkeleton />
            <EventSkeleton />
          </div>
        ) : error ? (
          // Error state
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-semibold text-velora-rose mb-2">
              {t("event_load_error")}
            </p>
            <p className="text-xs text-velora-text-muted">
              {error.message || t("event_load_error_msg")}
            </p>
          </div>
        ) : filteredEvents.length === 0 ? (
          // Empty State
          <FadeUp>
            <AgendaEmptyState />
          </FadeUp>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Featured Events Carousel Section */}
            {featuredEvents.length > 0 && (
              <div className="w-full">
                <div className="flex items-center gap-2 mb-3.5 px-0.5">
                  <Star size={14} className="text-velora-gold fill-velora-gold" />
                  <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-velora-gold">
                    {t("event_featured")}
                  </h2>
                </div>

                <div className="w-full overflow-x-auto scrollbar-none -mx-5 px-5">
                  <div className="flex gap-4 min-w-max pb-2">
                    {featuredEvents.map((event) => (
                      <div key={event.id} className="w-[300px] sm:w-[320px]">
                        <EventCard
                          event={event}
                          onTap={() => handleCardTap(event.id)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Standard/All Events Grid */}
            <div className="w-full">
              {featuredEvents.length > 0 && standardEvents.length > 0 && (
                <div className="flex items-center gap-2 mb-4 px-0.5">
                  <Sparkles size={14} className="text-velora-text-muted" />
                  <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-velora-text-muted">
                    {t("event_all")}
                  </h2>
                </div>
              )}

              <StaggerChildren className="grid grid-cols-1 gap-6">
                {(featuredEvents.length > 0 ? standardEvents : filteredEvents).map((event) => (
                  <FadeUp key={event.id}>
                    <EventCard
                      event={event}
                      onTap={() => handleCardTap(event.id)}
                    />
                  </FadeUp>
                ))}
              </StaggerChildren>
            </div>
          </div>
        )}
      </main>

      {/* Event Detail Panel slide-up */}
      <AnimatePresence>
        {selectedEventId && (
          <EventDetailPanel
            eventId={selectedEventId}
            isOpen={!!selectedEventId}
            onClose={handleCloseDetail}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
