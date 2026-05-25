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
import { useTranslation } from "@/lib/i18n";

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
  const { t } = useTranslation();

  const dentistFieldsList = [
    { key: "orderNumber", labelKey: "field_order_number", placeholderKey: "placeholder_order_number", icon: FileText },
    { key: "clinicName", labelKey: "field_clinic_name", placeholderKey: "placeholder_clinic_name", icon: Briefcase },
    { key: "specialty", labelKey: "field_specialty", placeholderKey: "placeholder_specialty", icon: Briefcase },
    { key: "fixedPhone", labelKey: "field_fixed_phone", placeholderKey: "placeholder_fixed_phone", icon: Phone, type: "tel" },
    { key: "whatsapp", labelKey: "field_whatsapp", placeholderKey: "placeholder_whatsapp_pro", icon: Phone, type: "tel" },
    { key: "clinicAddress", labelKey: "field_address", placeholderKey: "placeholder_clinic_address", icon: MapPin },
    { key: "googleMapsLink", labelKey: "field_google_maps", placeholderKey: "placeholder_google_maps", icon: MapPin },
    { key: "googleReviewsLink", labelKey: "field_google_reviews", placeholderKey: "placeholder_google_reviews", icon: Star },
    { key: "website", labelKey: "field_website", placeholderKey: "placeholder_clinic_website", icon: Globe },
    { key: "appointmentLink", labelKey: "field_booking_link", placeholderKey: "placeholder_appointment_link", icon: Globe },
    { key: "emergencyContact", labelKey: "field_emergency_contact", placeholderKey: "placeholder_emergency_contact", icon: AlertTriangle, type: "tel" },
    { key: "workHours", labelKey: "field_work_hours", placeholderKey: "placeholder_work_hours", icon: FileText },
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
        const fieldType = "type" in field ? (field.type as string) : "text";

        // Mobile-friendly virtual keyboard attributes
        let inputMode: React.HTMLAttributes<HTMLInputElement>["inputMode"] = undefined;
        let autoCapitalize: string | undefined = undefined;
        let autoComplete: string | undefined = undefined;
        let autoCorrect: string | undefined = undefined;

        if (fieldType === "tel") {
          inputMode = "tel";
          autoComplete = "tel";
        } else if (
          fieldType === "url" ||
          field.key === "website" ||
          field.key === "googleMapsLink" ||
          field.key === "googleReviewsLink" ||
          field.key === "appointmentLink"
        ) {
          inputMode = "url";
          autoCapitalize = "none";
          autoCorrect = "off";
          autoComplete = "off";
        }

        return (
          <GlassCard key={field.key} className="p-3" hover={false}>
            <div className="flex items-center gap-2 mb-2">
              <Icon size={12} className="text-velora-gold/60" />
              <label className="text-[10px] text-velora-text-muted uppercase tracking-wider font-semibold">
                {t(field.labelKey)}
              </label>
            </div>
            <input
              type={fieldType}
              value={value}
              onChange={(e) => onChange(field.key, e.target.value)}
              placeholder={t(field.placeholderKey)}
              inputMode={inputMode}
              autoCapitalize={autoCapitalize}
              autoComplete={autoComplete}
              autoCorrect={autoCorrect}
              className="w-full bg-transparent text-sm text-velora-text placeholder:text-velora-text-muted/30 outline-none"
            />
          </GlassCard>
        );
      })}
    </motion.div>
  );
}
