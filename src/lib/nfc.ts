/* ═══════════════════════════════════════════════════
   VELORA — Web NFC Library
   ═══════════════════════════════════════════════════ */

import type { VeloraProfile } from "@/types";

/**
 * Checks if the Web NFC API is supported on the current browser/device.
 */
export function isNfcSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "NDEFReader" in window;
}

/**
 * Interface representing the result of an NFC scan.
 */
export interface NfcScanResult {
  url: string;
  serialNumber: string;
}

type NdefRecord = {
  recordType: string;
  encoding?: string;
  data?: BufferSource;
};

type NdefReadingEvent = {
  serialNumber?: string;
  message: {
    records: NdefRecord[];
  };
};

type NdefReaderInstance = {
  scan: (options?: { signal?: AbortSignal }) => Promise<void>;
  write: (message: { records: Array<{ recordType: string; data: string }> }) => Promise<void>;
  onreading: ((event: NdefReadingEvent) => void) | null;
  onreadingerror: (() => void) | null;
};

type NdefReaderConstructor = new () => NdefReaderInstance;

function getNdefReader(): NdefReaderConstructor {
  return (window as unknown as Window & { NDEFReader: NdefReaderConstructor }).NDEFReader;
}

/**
 * Starts scanning for NFC tags containing a Velora profile.
 * Returns a cancel/cleanup function.
 */
export async function startNfcScan(
  onScan: (result: NfcScanResult) => void,
  onError: (err: unknown) => void
): Promise<() => void> {
  if (!isNfcSupported()) {
    throw new Error("NFC is not supported on this device.");
  }

  try {
    const reader = new (getNdefReader())();
    const abortController = new AbortController();

    await reader.scan({ signal: abortController.signal });

    reader.onreading = (event: NdefReadingEvent) => {
      const serialNumber = event.serialNumber || "";
      const message = event.message;

      for (const record of message.records) {
        if (record.recordType === "url") {
          const textDecoder = new TextDecoder(record.encoding || "utf-8");
          const url = record.data ? textDecoder.decode(record.data) : "";
          onScan({ url, serialNumber });
          return; // Trigger for the first URL record we find
        }
      }

      onError(new Error("Aucun lien de profil Velora trouvé sur ce tag NFC."));
    };

    reader.onreadingerror = () => {
      onError(new Error("Erreur de lecture du tag NFC. Veuillez réessayer."));
    };

    // Return unsubscribe/stop function
    return () => {
      try {
        abortController.abort();
      } catch (err) {
        console.warn("[NFC] Error aborting scan:", err);
      }
    };
  } catch (err) {
    console.error("[NFC] Start scan error:", err);
    onError(err);
    return () => {};
  }
}

/**
 * Writes a Velora profile URL to a physical NFC tag.
 */
export async function writeNfcProfile(profileUrl: string): Promise<void> {
  if (!isNfcSupported()) {
    throw new Error("NFC is not supported on this device.");
  }

  const reader = new (getNdefReader())();
  
  await reader.write({
    records: [
      {
        recordType: "url",
        data: profileUrl,
      },
    ],
  });
}

function escapeVCard(value?: string): string {
  return (value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function normalizeUrl(value?: string) {
  const trimmed = (value || "").trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function createVCard(profile: VeloraProfile, profileUrl?: string): string {
  const organization = profile.clinicName || profile.company || "VELORA";
  const phones = [
    profile.phone ? `TEL;TYPE=CELL:${escapeVCard(profile.phone)}` : "",
    profile.fixedPhone ? `TEL;TYPE=WORK:${escapeVCard(profile.fixedPhone)}` : "",
    profile.whatsapp ? `TEL;TYPE=WHATSAPP:${escapeVCard(profile.whatsapp)}` : "",
  ];
  const urls = [
    profile.website ? `URL:${escapeVCard(normalizeUrl(profile.website))}` : "",
    profile.googleMapsLink ? `URL;TYPE=MAPS:${escapeVCard(normalizeUrl(profile.googleMapsLink))}` : "",
    profileUrl ? `URL;TYPE=VELORA:${escapeVCard(profileUrl)}` : "",
    ...(profile.socialLinks || []).map((link) => `URL;TYPE=${escapeVCard(link.platform)}:${escapeVCard(normalizeUrl(link.url))}`),
  ];

  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${escapeVCard(profile.fullName || "VELORA Contact")}`,
    `ORG:${escapeVCard(organization)}`,
    `TITLE:${escapeVCard(profile.title || profile.specialty)}`,
    profile.email ? `EMAIL:${escapeVCard(profile.email)}` : "",
    ...phones,
    profile.clinicAddress ? `ADR;TYPE=WORK:;;${escapeVCard(profile.clinicAddress)}` : "",
    ...urls,
    `NOTE:${escapeVCard([profile.bio, profile.orderNumber ? `Numero d'ordre: ${profile.orderNumber}` : ""].filter(Boolean).join("\n"))}`,
    "END:VCARD",
  ].filter(Boolean).join("\r\n");
}

export function createVCardFile(profile: VeloraProfile, profileUrl?: string): void {
  if (typeof window === "undefined") return;
  const vcard = createVCard(profile, profileUrl);
  const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = `${(profile.fullName || "velora-contact").replace(/[^\w-]+/g, "-").toLowerCase()}.vcf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(href);
}
