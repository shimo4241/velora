"use client";
import { logger } from "@/lib/logger";


import React, { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toggleEventInterest, subscribeToEventAttendees } from "@/services";
import { useAuth } from "@/providers/AuthProvider";
import { useProfile } from "@/hooks/useProfile";
import { useTranslation } from "@/lib/i18n";
import { VeloraEvent, EventAttendee } from "@/types";
import { CategoryBadge } from "./CategoryBadge";
import { EventStatusBadge } from "./EventStatusBadge";
import { AttendeesPreview } from "./AttendeesPreview";
import { Heart, Calendar, MapPin, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

interface EventCardProps {
  event: VeloraEvent;
  onTap: () => void;
  className?: string;
}

export const downloadIcsFile = (event: VeloraEvent) => {
  const title = event.title;
  const description = event.description.replace(/\n/g, "\\n");
  const venue = `${event.venue}, ${event.city}`;
  
  const startDateStr = new Date(event.date).toISOString().replace(/-|:|\.\d\d\d/g, "");
  const endDateStr = event.endDate 
    ? new Date(event.endDate).toISOString().replace(/-|:|\.\d\d\d/g, "")
    : new Date(new Date(event.date).getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, "");

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Velora//Morocco Events Agenda//EN",
    "BEGIN:VEVENT",
    `UID:${event.id}@velora.app`,
    `DTSTAMP:${new Date().toISOString().replace(/-|:|\.\d\d\d/g, "")}`,
    `DTSTART:${startDateStr}`,
    `DTEND:${endDateStr}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${venue}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${event.title.toLowerCase().replace(/[^a-z0-9]/g, "_")}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const EventCard: React.FC<EventCardProps> = ({ event, onTap, className = "" }) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { t, locale, isRtl } = useTranslation();

  const [isInterested, setIsInterested] = useState(false);
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [toggleLoading, setToggleLoading] = useState(false);

  const uid = user?.uid ?? null;

  // Subscribe to user interest
  useEffect(() => {
    if (!uid || !event.id) {
      setIsInterested(false);
      return;
    }
    let active = true;
    const attendeeId = `${event.id}_${uid}`;
    const docRef = doc(db, "event_attendees", attendeeId);
    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (!active) return;
        setIsInterested(snap.exists());
      },
      (err) => {
        logger.error(`[EventCard] Error subscribing to interest for user ${uid} and event ${event.id}:`, err);
      }
    );
    return () => {
      active = false;
      unsubscribe();
    };
  }, [uid, event.id]);

  // Subscribe to attendees
  useEffect(() => {
    if (!event.id) return;
    let active = true;
    const unsubscribe = subscribeToEventAttendees(
      event.id,
      (data) => {
        if (!active) return;
        setAttendees(data);
      },
      (err) => {
        logger.error(`[EventCard] Error subscribing to attendees for event ${event.id}:`, err);
      }
    );
    return () => {
      active = false;
      unsubscribe();
    };
  }, [event.id]);

  const handleInterestClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !profile) {
      // Redirect to login or show simple feedback (tapped profile works similarly)
      return;
    }
    setToggleLoading(true);
    try {
      await toggleEventInterest(event.id, user.uid, profile, !isInterested);
    } catch (err) {
      logger.error("[EventCard] Error toggling interest:", err);
    } finally {
      setToggleLoading(false);
    }
  };

  const handleCalendarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    downloadIcsFile(event);
  };

  const handleMapsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const queryStr = event.mapsUrl || (event.lat && event.lng 
      ? `https://www.google.com/maps/search/?api=1&query=${event.lat},${event.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.title + ", " + event.venue + ", " + event.city)}`);
    window.open(queryStr, "_blank");
  };

  const formatEventDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const options: Intl.DateTimeFormatOptions = {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
      };
      return d.toLocaleDateString(locale === "ar" ? "ar-MA" : locale === "fr" ? "fr-FR" : locale === "es" ? "es-ES" : "en-US", options);
    } catch {
      return dateStr;
    }
  };

  // Distance format
  const distanceLabel = event.distance !== undefined
    ? `${(event.distance / 1000).toFixed(1)} ${t("distance_km")}`
    : null;

  return (
    <div
      onClick={onTap}
      className={`event-card group cursor-pointer ${
        event.isFeatured || event.isSponsored ? "event-card-featured" : ""
      } ${className}`}
    >
      {/* Event Banner */}
      <div className="event-banner relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={event.imageUrl}
          alt={event.title}
          className="transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />

        {/* Badges Overlaid on Image */}
        <div className={`absolute top-4 ${isRtl ? "right-4 left-auto" : "left-4 right-auto"} flex flex-col gap-2 items-start z-10`}>
          <CategoryBadge category={event.category} locale={locale} />
          <EventStatusBadge status={event.status} date={event.date} />
        </div>

        {/* Sponsored Ribbon */}
        {(event.isSponsored || event.isFeatured) && (
          <div className={`absolute bottom-3 ${isRtl ? "left-3" : "right-3"} px-2 py-0.5 rounded bg-amber-500/90 text-black text-[9px] font-bold tracking-wider uppercase z-10`}>
            {event.isSponsored ? "Sponsored" : "Featured"}
          </div>
        )}
      </div>

      {/* Info Body */}
      <div className="p-5">
        {/* Organizer info */}
        <div className="flex items-center gap-2 mb-3">
          {event.organizerAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.organizerAvatarUrl}
              alt={event.organizer}
              className="w-5 h-5 rounded-full object-cover border border-white/10"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[9px] text-velora-gold font-bold">
              {event.organizer.slice(0, 1).toUpperCase()}
            </div>
          )}
          <span className="text-[11px] font-semibold text-velora-text-muted uppercase tracking-wider">
            {event.organizer}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-[family-name:var(--font-display)] text-lg font-medium text-velora-text mb-2 line-clamp-1 group-hover:text-velora-gold transition-colors duration-300">
          {event.title}
        </h3>

        {/* Date and Location */}
        <div className="flex flex-col gap-1.5 mb-4 text-xs text-velora-text-secondary">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-velora-gold">📅</span>
            <span>{formatEventDate(event.date)}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-velora-text-muted" />
              <span className="line-clamp-1">{event.venue}, {event.city}</span>
            </div>
            {distanceLabel && (
              <span className="text-[10px] bg-white/5 border border-white/10 rounded-full px-2 py-0.5 text-velora-gold">
                {distanceLabel}
              </span>
            )}
          </div>
        </div>

        {/* Networking Attendees Stack */}
        {attendees.length > 0 && (
          <div className="mb-4 pt-3 border-t border-white/5">
            <AttendeesPreview attendees={attendees} onViewAll={onTap} />
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-white/5 w-full mb-4" />

        {/* Actions Row */}
        <div className="flex gap-2.5">
          {/* Interested Button */}
          <motion.button
            onClick={handleInterestClick}
            disabled={toggleLoading}
            whileTap={{ scale: 0.95 }}
            className={`flex-1 flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-xs font-semibold border backdrop-blur-md transition-all duration-300 ${
              isInterested
                ? "bg-velora-gold/15 border-velora-gold/30 text-velora-gold"
                : "bg-white/5 border-white/10 text-velora-text-secondary hover:border-white/20 hover:text-white"
            }`}
          >
            <Heart className={`w-4 h-4 ${isInterested ? "fill-velora-gold text-velora-gold" : ""}`} />
            <span>{t("event_interested")}</span>
          </motion.button>

          {/* Add to Calendar Button */}
          <motion.button
            onClick={handleCalendarClick}
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-velora-text-secondary hover:border-white/20 hover:text-white transition-all duration-300"
            title={t("event_add_calendar")}
          >
            <Calendar className="w-4 h-4" />
          </motion.button>

          {/* Open Maps Button */}
          <motion.button
            onClick={handleMapsClick}
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-velora-text-secondary hover:border-white/20 hover:text-white transition-all duration-300"
            title={t("event_open_maps")}
          >
            <ExternalLink className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};
