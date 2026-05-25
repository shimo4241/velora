
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";

const MOROCCO_EVENTS = [
  {
    id: "maroc-dental-expo-2026",
    title: "Maroc Dental Expo 2026",
    date: "2026-10-15",
    location: "Office des Changes, Casablanca, Morocco",
    description: "The premier international exhibition for dental equipment and oral medicine in North Africa, bringing together dental surgeons, technicians, and digital dentistry innovators.",
    website: "https://www.marocdentalexpo.ma",
  },
  {
    id: "morocco-dental-summit-2027",
    title: "Morocco Dental Summit 2027",
    date: "2027-04-22",
    location: "Palais des Congrès, Marrakech, Morocco",
    description: "Gathering of dental professionals, implantology experts, and orthodontic leaders across the EMEA region for premium medical education and networking.",
    website: "https://www.moroccodentalsummit.com",
  },
  {
    id: "casablanca-tech-week-2026",
    title: "Casablanca Tech Week 2026",
    date: "2026-11-12",
    location: "Technopark, Casablanca, Morocco",
    description: "Connecting Moroccan and international tech innovators, startups, investors, and digital leaders to foster tech ecosystems in North Africa.",
    website: "https://www.casablancatechweek.ma",
  },
  {
    id: "gitex-africa-2026",
    title: "Gitex Africa 2026",
    date: "2026-05-27",
    location: "Bab Jdid exhibition space, Marrakech, Morocco",
    description: "The largest tech and startup event in Africa, showcasing advanced AI, cloud infrastructure, fintech, and digital health innovations across the continent.",
    website: "https://www.gitexafrica.com",
  },
  {
    id: "dentistry-tomorrow-marrakech-2027",
    title: "Dentistry Tomorrow Marrakech 2027",
    date: "2027-02-18",
    location: "Movenpick Mansour Eddahbi, Marrakech, Morocco",
    description: "High-tech dentistry seminar focused on artificial intelligence diagnostics, 3D dental printing, and modern clinical workflows.",
    website: "https://www.dentistrytomorrow.ma",
  }
];

export async function GET(req: Request) {
  try {
    // Basic verification for local testing or CRON triggers
    const authHeader = req.headers.get("Authorization");
    const url = new URL(req.url);
    if (url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
      const cronSecret = process.env.CRON_SECRET;
      if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const results = [];
    if (!isFirebaseConfigured) {
      logger.warn("Firebase config is missing or dummy. Simulating event aggregation in database.");
      for (const event of MOROCCO_EVENTS) {
        results.push(event.id);
      }
      return NextResponse.json({
        success: true,
        message: `Morocco events aggregated successfully (SIMULATED - config missing).`,
        count: results.length,
        events: results,
      });
    }

    for (const event of MOROCCO_EVENTS) {
      const docRef = doc(db, "events", event.id);
      await setDoc(
        docRef,
        {
          ...event,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      results.push(event.id);
    }

    return NextResponse.json({
      success: true,
      message: `Morocco events aggregated successfully.`,
      count: results.length,
      events: results,
    });
  } catch (error) {
    logger.error("[Cron Events Error]", error);
    const message = error instanceof Error ? error.message : "Failed to update events";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  return GET(req);
}
