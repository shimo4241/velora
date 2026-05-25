"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import { useToast } from "@/components/providers/ToastProvider";
import { useEventDetail } from "@/hooks/useEventDetail";
import { CategoryBadge } from "./CategoryBadge";
import { EventStatusBadge } from "./EventStatusBadge";
import { downloadIcsFile } from "./EventCard";
import { CheckInButton } from "./CheckInButton";
import {
  Calendar as CalendarIcon,
  MapPin,
  Heart,
  Share2,
  ExternalLink,
  Users,
  ArrowLeft,
} from "lucide-react";
import { motion } from "framer-motion";

interface EventDetailPanelProps {
  eventId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const EventDetailPanel: React.FC<EventDetailPanelProps> = ({
  eventId,
  isOpen,
  onClose
}) => {
  const router = useRouter();
  const { t, locale, isRtl } = useTranslation();
  const { showToast } = useToast();
  
  const {
    event,
    attendees,
    networkingSuggestions,
    loading,
    error,
    isInterested,
    isCheckedIn,
    actionLoading,
    toggleInterest,
    checkIn
  } = useEventDetail(eventId);

  // Scanner state encapsulated in CheckInButton

  if (!isOpen) return null;

  const handleShareClick = () => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/events/${eventId}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url)
        .then(() => {
          showToast({
            title: "Velora",
            message: t("event_link_copied"),
            tone: "success"
          });
        })
        .catch(() => {
          showToast({
            title: "Velora",
            message: t("event_link_copy_error"),
            tone: "error"
          });
        });
    }
  };

  // Scan success handled inside CheckInButton

  const handleMapsClick = () => {
    if (!event) return;
    const queryStr = event.mapsUrl || (event.lat && event.lng 
      ? `https://www.google.com/maps/search/?api=1&query=${event.lat},${event.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.title + ", " + event.venue + ", " + event.city)}`);
    window.open(queryStr, "_blank");
  };

  const formatEventDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const options: Intl.DateTimeFormatOptions = {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      };
      return d.toLocaleDateString(locale === "ar" ? "ar-MA" : locale === "fr" ? "fr-FR" : locale === "es" ? "es-ES" : "en-US", options);
    } catch {
      return dateStr;
    }
  };

  const formatEventTime = (startStr: string, endStr?: string) => {
    try {
      const start = new Date(startStr);
      const timeOptions: Intl.DateTimeFormatOptions = {
        hour: "2-digit",
        minute: "2-digit"
      };
      const startTime = start.toLocaleTimeString(locale === "ar" ? "ar-MA" : "fr-FR", timeOptions);
      if (!endStr) return startTime;
      
      const end = new Date(endStr);
      const endTime = end.toLocaleTimeString(locale === "ar" ? "ar-MA" : "fr-FR", timeOptions);
      return `${startTime} - ${endTime}`;
    } catch {
      return "";
    }
  };

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
      style={{ willChange: "transform" }}
      className="event-detail-panel fixed inset-0 z-[var(--z-modal)] bg-velora-black text-velora-text flex flex-col"
    >
      {/* Header Bar */}
      <div className="absolute top-0 inset-x-0 h-16 z-20 flex items-center justify-between px-5 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <button
          onClick={onClose}
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-md transition-all active:scale-95"
          aria-label={t("settings_back")}
        >
          <ArrowLeft size={18} className={isRtl ? "rotate-180" : ""} />
        </button>

        <div className="pointer-events-auto flex gap-2">
          <button
            onClick={handleShareClick}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-md transition-all active:scale-95"
            title="Share"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-velora-black">
          <div className="w-10 h-10 border-2 border-velora-gold border-t-transparent rounded-full animate-spin" />
          <span className="mt-4 text-sm text-velora-text-muted">{t("event_loading")}</span>
        </div>
      ) : error || !event ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-velora-black px-6 text-center">
          <p className="text-sm font-semibold text-velora-rose mb-3">
            {error ? t("event_error") : t("event_not_found")}
          </p>
          <button
            onClick={onClose}
            className="h-11 px-6 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold"
          >
            {t("event_back_agenda")}
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pb-32">
          {/* Hero Banner */}
          <div className="event-detail-hero relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            
            {/* Dark gradient overlay is applied via globals.css .event-detail-hero::after */}

            {/* Overlaid Badges */}
            <div className={`absolute bottom-6 ${isRtl ? "right-5" : "left-5"} flex flex-col gap-2.5 items-start z-10`}>
              <CategoryBadge category={event.category} locale={locale} />
              <EventStatusBadge status={event.status} date={event.date} />
            </div>
          </div>

          {/* Body Content */}
          <div className="px-5 pt-6">
            {/* Organizer */}
            <div className="flex items-center gap-2.5 mb-3.5">
              {event.organizerAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={event.organizerAvatarUrl}
                  alt={event.organizer}
                  className="w-7 h-7 rounded-full object-cover border border-white/10"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs text-velora-gold font-bold">
                  {event.organizer.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-wider text-velora-text-muted">
                  {t("event_organizer")}
                </span>
                <span className="text-xs font-semibold text-velora-text">
                  {event.organizer}
                </span>
              </div>
            </div>

            {/* Title */}
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold leading-tight text-white mb-4">
              {event.title}
            </h2>

            {/* Info Cards Grid */}
            <div className="grid grid-cols-1 gap-3 mb-6">
              {/* Date & Time */}
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-velora-gold/10 text-velora-gold">
                  <CalendarIcon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-velora-text">{formatEventDate(event.date)}</div>
                  <div className="text-[11px] text-velora-text-muted mt-0.5">
                    {formatEventTime(event.date, event.endDate)}
                  </div>
                </div>
              </div>

              {/* Location/Venue */}
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-velora-gold/10 text-velora-gold">
                  <MapPin size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-velora-text">{event.venue}</div>
                  <div className="text-[11px] text-velora-text-muted mt-0.5">{event.city}, {t("event_country")}</div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-velora-gold mb-3">
                {t("event_about")}
              </h3>
              <p className="text-sm leading-relaxed text-velora-text-secondary whitespace-pre-line">
                {event.description}
              </p>
            </div>

            {/* Speakers / Program */}
            {event.speakers && event.speakers.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-velora-gold mb-4">
                  {t("event_speakers")}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {event.speakers.map((speaker, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/[0.02] border border-white/5"
                    >
                      {speaker.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={speaker.avatarUrl}
                          alt={speaker.name}
                          className="w-10 h-10 rounded-full object-cover shrink-0 border border-white/10"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs text-velora-gold shrink-0 font-bold">
                          {speaker.name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-velora-text truncate">{speaker.name}</div>
                        <div className="text-[10px] text-velora-text-muted truncate mt-0.5">{speaker.title}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Photo Gallery */}
            {event.galleryUrls && event.galleryUrls.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-velora-gold mb-4">
                  {t("event_gallery")}
                </h3>
                <div className="w-full overflow-x-auto scrollbar-none -mx-5 px-5">
                  <div className="flex gap-3 min-w-max pb-1">
                    {event.galleryUrls.map((url, index) => (
                      <div
                        key={index}
                        className="w-48 aspect-video rounded-2xl overflow-hidden border border-white/5 bg-white/5"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`Gallery image ${index + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Static Map & Map Trigger */}
            <div className="mb-8">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-velora-gold mb-4">
                {t("event_location")}
              </h3>
              <div
                onClick={handleMapsClick}
                className="relative w-full aspect-video rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden cursor-pointer group flex flex-col items-center justify-center p-4 text-center"
              >
                {/* Fallback stylized static preview */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,color-mix(in srgb, var(--color-velora-gold) 6%, transparent)_0%,transparent_100%)] pointer-events-none" />
                
                <div className="relative z-10 flex flex-col items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-velora-gold/15 text-velora-gold border border-velora-gold/25 group-hover:scale-110 transition-transform duration-350">
                    <MapPin size={22} className="animate-bounce" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-velora-text">{event.venue}</div>
                    <div className="text-xs text-velora-text-muted mt-1">{event.city}, {t("event_country")}</div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-velora-gold hover:underline mt-1 bg-velora-gold/10 px-3 py-1.5 rounded-full border border-velora-gold/20">
                    {t("event_open_maps")} <ExternalLink size={11} />
                  </span>
                </div>
              </div>
            </div>

            {/* Attendees list (All tap through to `/u/${username}`) */}
            <div className="mb-8">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-velora-gold mb-4 flex items-center justify-between">
                <span>{t("event_attendees")} ({attendees.length})</span>
              </h3>

              {attendees.length === 0 ? (
                <div className="p-5 rounded-2xl border border-dashed border-white/10 text-center text-xs text-velora-text-muted bg-white/[0.01]">
                  {t("event_no_attendees")}
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-3.5">
                  {attendees.map((attendee) => {
                    const initials = attendee.userName
                      ? attendee.userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
                      : "V";
                    const hasAvatar = attendee.userAvatarUrl && attendee.userAvatarUrl.startsWith("http");

                    return (
                      <button
                        key={attendee.id}
                        onClick={() => {
                          if (attendee.userUsername) {
                            router.push(`/u/${attendee.userUsername}`);
                          }
                        }}
                        className="flex flex-col items-center gap-1.5 group cursor-pointer focus:outline-none"
                        title={attendee.userName}
                      >
                        <div className="relative h-11 w-11 rounded-full border border-white/10 overflow-hidden bg-velora-black transition-transform group-hover:scale-105 group-active:scale-95">
                          {hasAvatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={attendee.userAvatarUrl}
                              alt={attendee.userName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center bg-velora-gold/15 text-xs font-bold text-velora-gold">
                              {initials}
                            </span>
                          )}

                          {attendee.checkedIn && (
                            <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-velora-emerald border-2 border-velora-black flex items-center justify-center text-[7px] text-white">
                              ✓
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-velora-text-muted truncate w-full text-center group-hover:text-velora-text">
                          {attendee.userName.split(" ")[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Smart Networking Suggestions "People you may want to meet" */}
            {networkingSuggestions && networkingSuggestions.length > 0 && (
              <div className="mb-8 pt-6 border-t border-white/5">
                <div className="flex items-center gap-2 mb-4">
                  <Users size={16} className="text-velora-gold" />
                  <h3 className="text-sm font-medium text-velora-gold">
                    {t("event_networking_title")}
                  </h3>
                </div>

                <div className="flex flex-col gap-3">
                  {networkingSuggestions.map((suggestion) => {
                    const initials = suggestion.fullName
                      ? suggestion.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
                      : "V";
                    const hasAvatar = suggestion.avatarUrl && suggestion.avatarUrl.startsWith("http");

                    return (
                      <div
                        key={suggestion.id}
                        onClick={() => router.push(`/u/${suggestion.username}`)}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-white/[0.03] to-white/[0.01] border border-white/5 hover:border-velora-gold/20 hover:from-white/[0.05] hover:to-white/[0.02] cursor-pointer transition-all duration-300 group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Avatar */}
                          <div className="relative h-11 w-11 rounded-full border border-white/10 overflow-hidden bg-velora-black shrink-0">
                            {hasAvatar ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={suggestion.avatarUrl}
                                alt={suggestion.fullName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center bg-velora-gold/10 text-xs font-bold text-velora-gold">
                                {initials}
                              </span>
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-velora-text group-hover:text-velora-gold transition-colors duration-300">
                              {suggestion.fullName}
                            </div>
                            <div className="text-[10px] text-velora-text-muted truncate mt-0.5">
                              {suggestion.title}
                            </div>
                            {/* Professional Mode Tag */}
                            <div className="inline-block px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[8px] font-medium tracking-wider uppercase text-velora-gold/80 mt-1">
                              {suggestion.professionalMode}
                            </div>
                          </div>
                        </div>

                        {/* View Profile */}
                        <span className="text-[10px] font-semibold text-velora-gold group-hover:underline shrink-0 pl-3">
                          {t("event_view_profile")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Action Dock */}
      {event && (
        <div className="absolute bottom-0 inset-x-0 p-5 bg-gradient-to-t from-black via-black/95 to-transparent border-t border-white/5 backdrop-blur-md flex flex-col gap-3">
          {/* Main Action row */}
          <div className="flex gap-3">
            {/* Interested Button */}
            <motion.button
              onClick={toggleInterest}
              disabled={actionLoading}
              whileTap={{ scale: 0.95 }}
              className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-xl text-xs font-semibold border backdrop-blur-md transition-all duration-300 ${
                isInterested
                  ? "bg-velora-gold/15 border-velora-gold/30 text-velora-gold"
                  : "bg-white/5 border-white/10 text-velora-text-secondary hover:border-white/20 hover:text-white"
              }`}
            >
              <Heart className={`w-4.5 h-4.5 ${isInterested ? "fill-velora-gold text-velora-gold" : ""}`} />
              <span>{t("event_interested")}</span>
            </motion.button>

            {/* Check In Button */}
            <CheckInButton
              eventId={eventId}
              isCheckedIn={isCheckedIn}
              actionLoading={actionLoading}
              onCheckIn={checkIn}
            />
          </div>

          {/* Sub actions row */}
          <div className="flex gap-3 mt-1">
            {/* Add Calendar */}
            <button
              onClick={() => downloadIcsFile(event)}
              className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-white/5 border border-white/10 text-xs font-medium text-velora-text-secondary hover:text-white transition-all active:scale-95"
            >
              <CalendarIcon size={14} />
              <span>{t("event_add_calendar")}</span>
            </button>

            {/* Open Maps */}
            <button
              onClick={handleMapsClick}
              className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-white/5 border border-white/10 text-xs font-medium text-velora-text-secondary hover:text-white transition-all active:scale-95"
            >
              <ExternalLink size={14} />
              <span>{t("event_open_maps")}</span>
            </button>
          </div>
        </div>
      )}

      {/* QR Code Scanner is now inside CheckInButton */}
    </motion.div>
  );
};
