"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { MessageCircle } from "lucide-react";
import type { VeloraProfile, ContactActionSettings } from "@/types";
import EditorChrome from "./EditorChrome";
import { Field, inputClass, normalizeUrl } from "./shared";

interface ContactEditorProps {
  profile: VeloraProfile;
  onCancel: () => void;
  onSave: (data: Partial<Omit<VeloraProfile, "id" | "username">>) => Promise<void>;
}

export default function ContactEditor({ profile, onCancel, onSave }: ContactEditorProps) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    email: profile.email || "",
    phone: profile.phone || "",
    whatsapp: profile.whatsapp || "",
    website: profile.website || "",
    contactActions: profile.contactActions,
  });

  const updateAction = (data: Partial<ContactActionSettings>) => {
    setForm({ ...form, contactActions: { ...form.contactActions, ...data } });
  };

  const save = async () => {
    setSaving(true);
    try {
      await onSave({
        email: form.email,
        phone: form.phone,
        whatsapp: form.whatsapp,
        website: normalizeUrl(form.website),
        contactActions: {
          ...form.contactActions,
          bookingUrl: normalizeUrl(form.contactActions.bookingUrl || ""),
        },
      });
      onCancel();
    } finally {
      setSaving(false);
    }
  };

  return (
    <EditorChrome
      title={t("edit_profile_contact_title")}
      icon={MessageCircle}
      saving={saving}
      onCancel={onCancel}
      onSave={save}
    >
      <div className="space-y-3">
        <Field label={t("contact_whatsapp")}>
          <input
            className={inputClass}
            value={form.whatsapp}
            onChange={(event) => setForm({ ...form, whatsapp: event.target.value })}
          />
        </Field>
        <Field label={t("field_email")}>
          <input
            className={inputClass}
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />
        </Field>
        <Field label={t("field_phone")}>
          <input
            className={inputClass}
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
          />
        </Field>
        <Field label={t("field_website")}>
          <input
            className={inputClass}
            value={form.website}
            onChange={(event) => setForm({ ...form, website: event.target.value })}
          />
        </Field>
        <Field label={t("edit_profile_booking_link")}>
          <input
            className={inputClass}
            value={form.contactActions.bookingUrl || ""}
            onChange={(event) => updateAction({ bookingUrl: event.target.value })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          {(["whatsapp", "email", "phone", "website"] as const).map((key) => (
            <label
              key={key}
              className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-white/8 bg-white/[0.03] p-3 text-xs capitalize text-velora-text-secondary"
            >
              <input
                type="checkbox"
                checked={Boolean(form.contactActions[key])}
                onChange={(event) => updateAction({ [key]: event.target.checked })}
              />
              {key === "whatsapp"
                ? t("contact_whatsapp")
                : key === "email"
                  ? t("field_email")
                  : key === "phone"
                    ? t("field_phone")
                    : t("field_website")}
            </label>
          ))}
        </div>
        <Field label={t("edit_profile_primary_action")}>
          <select
            className={inputClass}
            value={form.contactActions.primary}
            onChange={(event) =>
              updateAction({
                primary: event.target.value as ContactActionSettings["primary"],
              })
            }
          >
            <option className="bg-velora-black" value="whatsapp">
              {t("contact_whatsapp")}
            </option>
            <option className="bg-velora-black" value="email">
              {t("field_email")}
            </option>
            <option className="bg-velora-black" value="phone">
              {t("field_phone")}
            </option>
            <option className="bg-velora-black" value="website">
              {t("field_website")}
            </option>
            <option className="bg-velora-black" value="booking">
              {t("edit_profile_booking")}
            </option>
          </select>
        </Field>
      </div>
    </EditorChrome>
  );
}
