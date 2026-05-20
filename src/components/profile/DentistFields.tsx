"use client";

import { motion } from "framer-motion";
import {
  Briefcase,
  MapPin,
  Phone,
  FileText,
  Star,
  Globe,
  AlertTriangle,
} from "lucide-react";
import { GlassCard } from "@/components/ui";

interface DentistFieldsProps {
  form: {
    specialty: string;
    clinicName: string;
    orderNumber: string;
    fixedPhone: string;
    whatsapp: string;
    clinicAddress: string;
    googleMapsLink: string;
    googleReviewsLink: string;
    website: string;
    appointmentLink: string;
    emergencyContact: string;
    workHours: string;
  };
  onChange: (field: string, value: string) => void;
}

export function DentistFields({ form, onChange }: DentistFieldsProps) {
  const dentistFieldsList = [
    { key: "orderNumber", label: "Numéro d'Ordre", icon: FileText, placeholder: "123456" },
    { key: "clinicName", label: "Nom du cabinet", icon: Briefcase, placeholder: "Cabinet Dentaire Dr. El Amrani" },
    { key: "specialty", label: "Spécialité dentaire", icon: Briefcase, placeholder: "Chirurgien-Dentiste, Orthodontiste..." },
    { key: "fixedPhone", label: "Téléphone fixe", icon: Phone, placeholder: "+212 5XX XXX XXX", type: "tel" },
    { key: "whatsapp", label: "WhatsApp professionnel", icon: Phone, placeholder: "+212 6XX XXX XXX", type: "tel" },
    { key: "clinicAddress", label: "Adresse du cabinet", icon: MapPin, placeholder: "123 Bd Anfa, Casablanca" },
    { key: "googleMapsLink", label: "Lien Google Maps / GMB", icon: MapPin, placeholder: "https://maps.google.com/?q=..." },
    { key: "googleReviewsLink", label: "Lien Avis Google", icon: Star, placeholder: "https://g.page/r/..." },
    { key: "website", label: "Site Web de la clinique", icon: Globe, placeholder: "https://www.cabinetdentaire.com" },
    { key: "appointmentLink", label: "Lien de Réservation", icon: Globe, placeholder: "https://doctolib.fr/..." },
    { key: "emergencyContact", label: "Contact d'Urgence", icon: AlertTriangle, placeholder: "+212 6XX XXX XXX", type: "tel" },
    { key: "workHours", label: "Horaires de travail", icon: FileText, placeholder: "Lun - Ven: 09h00 - 18h00 / Sam: 09h00 - 13h00" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-3 mt-3"
    >
      {dentistFieldsList.map((field) => {
        const Icon = field.icon;
        const value = form[field.key as keyof typeof form] || "";

        return (
          <GlassCard key={field.key} className="p-3" hover={false}>
            <div className="flex items-center gap-2 mb-2">
              <Icon size={12} className="text-velora-gold/60" />
              <label className="text-[10px] text-velora-text-muted uppercase tracking-wider font-semibold">
                {field.label}
              </label>
            </div>
            <input
              type={"type" in field ? (field.type as string) : "text"}
              value={value}
              onChange={(e) => onChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="w-full bg-transparent text-sm text-velora-text placeholder:text-velora-text-muted/30 outline-none"
            />
          </GlassCard>
        );
      })}
    </motion.div>
  );
}
