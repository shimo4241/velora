"use client";

import { ExternalLink, Mail, MessageSquare, Phone, Save } from "lucide-react";
import { createVCardFile } from "@/lib/nfc";
import type { VeloraProfile } from "@/types";

export function NetworkActions({ profile }: { profile: VeloraProfile }) {
  const saveContact = () => {
    createVCardFile(profile);
  };

  return (
    <div className="flex items-center gap-2">
      {profile.phone && (
        <a className="network-icon-btn" href={`tel:${profile.phone}`} aria-label="Appeler">
          <Phone size={14} />
        </a>
      )}
      {profile.whatsapp && (
        <a
          className="network-icon-btn"
          href={`https://wa.me/${profile.whatsapp.replace(/\D/g, "")}`}
          target="_blank"
          rel="noreferrer"
          aria-label="WhatsApp"
        >
          <MessageSquare size={14} />
        </a>
      )}
      {profile.email && (
        <a className="network-icon-btn" href={`mailto:${profile.email}`} aria-label="Email">
          <Mail size={14} />
        </a>
      )}
      <button className="network-icon-btn" type="button" onClick={saveContact} aria-label="Save Contact">
        <Save size={14} />
      </button>
      {profile.username && (
        <a className="network-profile-btn" href={`/u/${profile.username}`}>
          <ExternalLink size={13} />
          Profil
        </a>
      )}
    </div>
  );
}
