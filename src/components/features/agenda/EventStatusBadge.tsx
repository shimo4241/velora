"use client";

import React, { useState, useEffect } from "react";
import { EventStatus } from "@/types";
import { useTranslation } from "@/lib/i18n";
import { Hourglass, ShieldAlert } from "lucide-react";

interface EventStatusBadgeProps {
  status: EventStatus;
  date: string; // ISO date-time of event start
  className?: string;
}

export const EventStatusBadge: React.FC<EventStatusBadgeProps> = ({
  status,
  date,
  className = "",
}) => {
  const { t, locale } = useTranslation();
  const [timeLeftStr, setTimeLeftStr] = useState<string>("");

  useEffect(() => {
    if (status !== "starting-soon") return;

    const calculateTimeLeft = () => {
      const difference = new Date(date).getTime() - new Date().getTime();
      if (difference <= 0) {
        setTimeLeftStr("");
        return;
      }

      const totalMinutes = Math.floor(difference / 1000 / 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      if (hours > 0) {
        if (locale === "fr") setTimeLeftStr(`dans ${hours}h ${minutes}m`);
        else if (locale === "ar") setTimeLeftStr(`خلال ${hours} س ${minutes} د`);
        else if (locale === "es") setTimeLeftStr(`en ${hours}h ${minutes}m`);
        else setTimeLeftStr(`in ${hours}h ${minutes}m`);
      } else {
        if (locale === "fr") setTimeLeftStr(`dans ${minutes}m`);
        else if (locale === "ar") setTimeLeftStr(`خلال ${minutes} د`);
        else if (locale === "es") setTimeLeftStr(`en ${minutes}m`);
        else setTimeLeftStr(`in ${minutes}m`);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [status, date, locale]);

  if (status === "upcoming") return null;

  switch (status) {
    case "live":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 event-status-live" />
          {t("event_live")}
        </span>
      );

    case "starting-soon":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-500/10 border border-amber-500/20 text-amber-400 ${className}`}
        >
          <Hourglass className="w-3 h-3 text-amber-400 animate-spin-slow" />
          <span>
            {t("event_starting_soon")} {timeLeftStr ? `(${timeLeftStr})` : ""}
          </span>
        </span>
      );

    case "sold-out":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-rose-500/10 border border-rose-500/20 text-rose-400 ${className}`}
        >
          <ShieldAlert className="w-3 h-3 text-rose-400" />
          {t("event_sold_out")}
        </span>
      );

    case "ended":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-white/5 border border-white/10 text-white/40 ${className}`}
        >
          {t("event_ended")}
        </span>
      );

    default:
      return null;
  }
};
