"use client";
import { logger } from "@/lib/logger";


import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { EventAttendee } from "@/types";
import { useTranslation } from "@/lib/i18n";

interface AttendeesPreviewProps {
  attendees: EventAttendee[];
  maxCount?: number;
  onViewAll?: () => void;
  className?: string;
}

export const AttendeesPreview: React.FC<AttendeesPreviewProps> = ({
  attendees,
  maxCount = 5,
  onViewAll,
  className = "",
}) => {
  const router = useRouter();
  const { t } = useTranslation();

  if (!attendees || attendees.length === 0) return null;

  const displayAttendees = attendees.slice(0, maxCount);
  const remainingCount = attendees.length - maxCount;

  const handleAttendeeClick = (attendee: EventAttendee, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering parent event card click
    if (attendee.userUsername) {
      router.push(`/u/${attendee.userUsername}`);
    } else {
      logger.warn(`[AttendeesPreview] Username missing for attendee ${attendee.userId}`);
    }
  };

  const handleRemainingClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewAll) {
      onViewAll();
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex -space-x-2.5 overflow-hidden">
        {displayAttendees.map((attendee) => {
          // If avatar is empty or placeholder, generate initials on gold bg
          const hasAvatar = attendee.userAvatarUrl && attendee.userAvatarUrl.startsWith("http");
          const initials = attendee.userName
            ? attendee.userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
            : "V";

          return (
            <button
              key={attendee.id}
              onClick={(e) => handleAttendeeClick(attendee, e)}
              className="relative inline-block h-8 w-8 overflow-hidden rounded-full border border-black bg-velora-black focus:outline-none focus:ring-1 focus:ring-velora-gold transition-transform hover:scale-110 hover:z-10"
              title={attendee.userName}
            >
              {hasAvatar ? (
                <Image
                  src={attendee.userAvatarUrl}
                  alt={attendee.userName}
                  fill
                  sizes="32px"
                  className="object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center rounded-full bg-velora-gold/15 text-[10px] font-bold text-velora-gold">
                  {initials}
                </span>
              )}
            </button>
          );
        })}

        {remainingCount > 0 && (
          <button
            onClick={handleRemainingClick}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-black bg-white/5 text-[9px] font-bold text-velora-gold backdrop-blur-md transition-transform hover:scale-110"
          >
            +{remainingCount}
          </button>
        )}
      </div>

      {attendees.length > 0 && (
        <span className="text-[11px] text-velora-text-muted">
          {attendees.length} {attendees.length > 1 ? t("event_attendees").toLowerCase() : t("event_attendees").toLowerCase().replace(/s$/, "")}
        </span>
      )}
    </div>
  );
};
