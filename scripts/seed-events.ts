import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import * as fs from "fs";
import * as path from "path";

// Helper to read and parse .env.local
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error("❌ Missing .env.local file in current directory.");
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, "utf-8");
  const env: Record<string, string> = {};
  content.split("\n").forEach((line) => {
    const cleanLine = line.trim();
    if (!cleanLine || cleanLine.startsWith("#")) return;
    const match = cleanLine.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let val = match[2].trim();
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1);
      }
      env[key] = val;
    }
  });
  return env;
}

const env = loadEnv();

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error("❌ Missing required Firebase config variables in .env.local");
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Base coordinates for Moroccan cities
const CITIES_COORDS = {
  casablanca: { lat: 33.5731, lng: -7.5898 },
  rabat: { lat: 34.0209, lng: -6.8416 },
  marrakech: { lat: 31.6295, lng: -7.9811 },
  fes: { lat: 34.0181, lng: -5.0078 },
  tangier: { lat: 35.7595, lng: -5.8340 },
  agadir: { lat: 30.4278, lng: -9.5981 },
  meknes: { lat: 33.8935, lng: -5.5473 }
};

// Generate relative dates
const now = new Date();

function getDateOffset(days: number, hours = 0): string {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  d.setHours(d.getHours() + hours);
  return d.toISOString();
}

const EVENTS_DATA = [
  // --- TODAY ---
  {
    id: "morocco-dental-congress-2026",
    title: "Morocco Dental Congress",
    description: "The premier gathering of dental professionals in North Africa. Explore cutting-edge technologies, prosthodontics breakthroughs, and network with leading practitioners.",
    category: "medical-dental",
    imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80",
    galleryUrls: [
      "https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?w=800",
      "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800"
    ],
    date: getDateOffset(0, -2), // Started 2 hours ago
    endDate: getDateOffset(0, 6), // Ends in 6 hours
    city: "Casablanca",
    venue: "Hyatt Regency Grand Ballroom",
    lat: CITIES_COORDS.casablanca.lat + 0.002,
    lng: CITIES_COORDS.casablanca.lng - 0.001,
    organizer: "National Order of Dentists Morocco",
    organizerAvatarUrl: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=100",
    speakers: [
      { name: "Dr. Tarik Alami", title: "Professor of Implantology, UM6SS", avatarUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150" },
      { name: "Dr. Sophia Benjelloun", title: "Orthodontics Researcher", avatarUrl: "https://images.unsplash.com/photo-1594824813573-246434de83fb?w=150" }
    ],
    status: "live",
    capacity: 500,
    attendeesCount: 342,
    interestedCount: 489,
    isFeatured: true,
    isSponsored: false,
    tags: ["Dentistry", "Medical Tech", "Casablanca", "Networking"],
    price: "400 MAD",
    ticketUrl: "https://example.com/tickets/dentallive",
    mapsUrl: "https://maps.google.com/?q=Hyatt+Regency+Casablanca"
  },
  {
    id: "marrakech-vip-nightlife-party",
    title: "Vanguard VIP Night & Lounge",
    description: "An exclusive evening of luxury, high-fashion networking, and modern electronic beats in the heart of Marrakech's finest lounge. Strictly guestlist.",
    category: "nightlife-vip",
    imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80",
    galleryUrls: [],
    date: getDateOffset(0, 3), // Starts in 3 hours
    endDate: getDateOffset(1, 5), // Ends tomorrow morning
    city: "Marrakech",
    venue: "The Oberoi Lounge & Garden",
    lat: CITIES_COORDS.marrakech.lat + 0.015,
    lng: CITIES_COORDS.marrakech.lng + 0.022,
    organizer: "Vanguard Luxury Group",
    organizerAvatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100",
    speakers: [
      { name: "Amine K", title: "Guest DJ / Producer", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" }
    ],
    status: "starting-soon",
    capacity: 150,
    attendeesCount: 148,
    interestedCount: 320,
    isFeatured: true,
    isSponsored: true,
    tags: ["Luxury", "VIP", "Marrakech", "Music", "Nightlife"],
    price: "1000 MAD",
    ticketUrl: "https://example.com/vip/vanguard",
    mapsUrl: "https://maps.google.com/?q=The+Oberoi+Marrakech"
  },
  {
    id: "casa-startup-pitch-night",
    title: "Casablanca Founder Pitch Night",
    description: "Watch Morocco's brightest early-stage founders pitch their products to a panel of international venture capitalists and angel investors.",
    category: "startup",
    imageUrl: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&auto=format&fit=crop&q=80",
    galleryUrls: [],
    date: getDateOffset(0, 1), // Starts in 1 hour
    endDate: getDateOffset(0, 4),
    city: "Casablanca",
    venue: "The Factory Coworking Hub",
    lat: CITIES_COORDS.casablanca.lat - 0.005,
    lng: CITIES_COORDS.casablanca.lng + 0.008,
    organizer: "Morocco Venture Network",
    organizerAvatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100",
    speakers: [
      { name: "Mehdi Meziane", title: "Managing Partner, Atlas Capital", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150" }
    ],
    status: "starting-soon",
    capacity: 80,
    attendeesCount: 80, // Sold out
    interestedCount: 195,
    isFeatured: false,
    isSponsored: false,
    tags: ["Startups", "Pitching", "Venture Capital", "Casablanca"],
    price: "Free (RSVP Required)",
    ticketUrl: "https://example.com/tickets/pitch-night",
    mapsUrl: "https://maps.google.com/?q=The+Factory+Casablanca"
  },

  // --- THIS WEEK ---
  {
    id: "rabat-networking-gala-2026",
    title: "Rabat Diplomatic & Business Gala",
    description: "An exceptional networking evening bridging the gap between foreign diplomats, corporate executives, and Moroccan scale-up founders. Black tie event.",
    category: "networking",
    imageUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80",
    galleryUrls: [],
    date: getDateOffset(2, 19), // 2 days from now
    city: "Rabat",
    venue: "Sofitel Jardin des Roses",
    lat: CITIES_COORDS.rabat.lat - 0.012,
    lng: CITIES_COORDS.rabat.lng - 0.005,
    organizer: "Rabat Business Forum",
    speakers: [
      { name: "Laila Bensouda", title: "International Trade Consultant", avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" }
    ],
    status: "upcoming",
    capacity: 250,
    attendeesCount: 185,
    interestedCount: 412,
    isFeatured: true,
    isSponsored: false,
    tags: ["Business", "Networking", "Rabat", "Gala"],
    price: "750 MAD",
    mapsUrl: "https://maps.google.com/?q=Sofitel+Rabat+Jardin+des+Roses"
  },
  {
    id: "devoxx-morocco-2026",
    title: "Devoxx Morocco 2026",
    description: "The largest developer conference in Africa. Join thousands of developers to discuss Java, Web, Mobile, Cloud, AI, and software craftsmanship.",
    category: "tech-conference",
    imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80",
    galleryUrls: [
      "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800",
      "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800"
    ],
    date: getDateOffset(1, 9), // Tomorrow morning
    endDate: getDateOffset(3, 17), // 3-day event
    city: "Casablanca",
    venue: "Studio Des Arts Vivants",
    lat: CITIES_COORDS.casablanca.lat - 0.025,
    lng: CITIES_COORDS.casablanca.lng - 0.045,
    organizer: "Devoxx Morocco Association",
    organizerAvatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100",
    speakers: [
      { name: "Anass El Moudene", title: "Principal Cloud Engineer", avatarUrl: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150" },
      { name: "Sarah Connor", title: "AI Research Lead", avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150" }
    ],
    status: "upcoming",
    capacity: 1200,
    attendeesCount: 1195,
    interestedCount: 890,
    isFeatured: true,
    isSponsored: false,
    tags: ["Developer", "Java", "Cloud", "AI", "Casablanca"],
    price: "1800 MAD",
    ticketUrl: "https://example.com/devoxx-tickets",
    mapsUrl: "https://maps.google.com/?q=Studio+Des+Arts+Vivants+Casablanca"
  },
  {
    id: "marrakech-art-fashion-show",
    title: "Marrakech Art & Fashion Runway",
    description: "An avant-garde showcase of Moroccan traditional caftans fused with contemporary streetwear designs, set in an outdoor red-clay palace.",
    category: "art-fashion",
    imageUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80",
    galleryUrls: [],
    date: getDateOffset(3, 18), // 3 days from now
    city: "Marrakech",
    venue: "Palais Selman Marrakech",
    lat: CITIES_COORDS.marrakech.lat - 0.04,
    lng: CITIES_COORDS.marrakech.lng - 0.03,
    organizer: "Moroccan Fashion Guild",
    speakers: [
      { name: "Yasmine Bennani", title: "Lead Designer", avatarUrl: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150" }
    ],
    status: "upcoming",
    capacity: 300,
    attendeesCount: 290,
    interestedCount: 520,
    isFeatured: false,
    isSponsored: true,
    tags: ["Fashion", "Art", "Runway", "Marrakech"],
    price: "1200 MAD",
    mapsUrl: "https://maps.google.com/?q=Palais+Selman+Marrakech"
  },
  {
    id: "rabat-symphony-orchestra-concert",
    title: "Moroccan National Symphony Concert",
    description: "An evening of classical Arabic Andalusian masterpieces blended with European symphonies, played by the Moroccan National Orchestra.",
    category: "concert",
    imageUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80",
    galleryUrls: [],
    date: getDateOffset(2, 20), // 2 days from now
    city: "Rabat",
    venue: "Mohammed V National Theatre",
    lat: CITIES_COORDS.rabat.lat + 0.005,
    lng: CITIES_COORDS.rabat.lng + 0.002,
    organizer: "Ministry of Culture Morocco",
    speakers: [],
    status: "upcoming",
    capacity: 800,
    attendeesCount: 790,
    interestedCount: 390,
    isFeatured: false,
    isSponsored: false,
    tags: ["Concert", "Classical", "Music", "Rabat"],
    price: "200 MAD",
    mapsUrl: "https://maps.google.com/?q=Theatre+National+Mohammed+V+Rabat"
  },
  {
    id: "tangier-tech-zone-open-house",
    title: "Tangier Tech Zone Open House",
    description: "Explore the innovation hubs in Tangier Automotive City and Tangier Tech. Perfect for entrepreneurs seeking manufacturing or logistics partnerships.",
    category: "portes-ouvertes",
    imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80",
    galleryUrls: [],
    date: getDateOffset(4, 10), // 4 days from now
    city: "Tangier",
    venue: "Tangier Med Port Center",
    lat: CITIES_COORDS.tangier.lat + 0.05,
    lng: CITIES_COORDS.tangier.lng - 0.03,
    organizer: "Tangier Med Group",
    speakers: [],
    status: "upcoming",
    capacity: 150,
    attendeesCount: 64,
    interestedCount: 112,
    isFeatured: false,
    isSponsored: false,
    tags: ["Logistics", "Tech", "Networking", "Tangier"],
    price: "Free",
    mapsUrl: "https://maps.google.com/?q=Tangier+Med+Port+Center"
  },

  // --- THIS MONTH (Rest of May 2026) ---
  {
    id: "mawazine-festival-rabat-2026",
    title: "Mawazine Festival Rhythms of the World",
    description: "One of the largest music festivals globally. Multiple stages across Rabat featuring international superstars, African icons, and Arabic musical legends.",
    category: "festival",
    imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80",
    galleryUrls: [
      "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800",
      "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800"
    ],
    date: getDateOffset(8, 17), // 8 days from now
    endDate: getDateOffset(15, 23), // 7-day festival
    city: "Rabat",
    venue: "OLM Souissi Stage",
    lat: CITIES_COORDS.rabat.lat - 0.035,
    lng: CITIES_COORDS.rabat.lng - 0.015,
    organizer: "Maroc Cultures Association",
    organizerAvatarUrl: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=100",
    speakers: [
      { name: "Sami Yusuf", title: "Arabic Headliner", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150" }
    ],
    status: "upcoming",
    capacity: 50000,
    attendeesCount: 42000,
    interestedCount: 12000,
    isFeatured: true,
    isSponsored: false,
    tags: ["Music", "Festival", "Rabat", "Celebration"],
    price: "Free (Gala space: 1200 MAD)",
    ticketUrl: "https://example.com/tickets/mawazine",
    mapsUrl: "https://maps.google.com/?q=OLM+Souissi+Rabat"
  },
  {
    id: "morocco-auto-expo-casa",
    title: "Morocco International Auto Expo",
    description: "Unveiling the latest electric models, autonomous driving software, and luxury automotive collections in Africa's automotive manufacturing powerhouse.",
    category: "exposition",
    imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80",
    galleryUrls: [],
    date: getDateOffset(9, 9), // 9 days from now
    endDate: getDateOffset(12, 18),
    city: "Casablanca",
    venue: "Foire Internationale de Casablanca",
    lat: CITIES_COORDS.casablanca.lat + 0.005,
    lng: CITIES_COORDS.casablanca.lng - 0.012,
    organizer: "Morocco Auto Manufacturers Association",
    speakers: [],
    status: "upcoming",
    capacity: 3000,
    attendeesCount: 1430,
    interestedCount: 880,
    isFeatured: false,
    isSponsored: false,
    tags: ["Automotive", "Electric Vehicles", "Casablanca", "Exhibition"],
    price: "50 MAD",
    mapsUrl: "https://maps.google.com/?q=Foire+Internationale+de+Casablanca"
  },
  {
    id: "fez-world-sacred-music-festival",
    title: "Fez Festival of World Sacred Music",
    description: "A spiritual journey through music, bringing together artists from diverse faiths to perform under the century-old Barbary oaks in Fès.",
    category: "festival",
    imageUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&auto=format&fit=crop&q=80",
    galleryUrls: [],
    date: getDateOffset(7, 16), // 7 days from now
    endDate: getDateOffset(11, 23),
    city: "Fes",
    venue: "Bab Al Makina Palace Grounds",
    lat: CITIES_COORDS.fes.lat - 0.008,
    lng: CITIES_COORDS.fes.lng - 0.002,
    organizer: "Fes Spirit Foundation",
    speakers: [],
    status: "upcoming",
    capacity: 2500,
    attendeesCount: 1800,
    interestedCount: 940,
    isFeatured: true,
    isSponsored: false,
    tags: ["Festival", "Spiritual", "Music", "Fes", "Heritage"],
    price: "350 MAD",
    mapsUrl: "https://maps.google.com/?q=Bab+Al+Makina+Fes"
  },
  {
    id: "tangier-jazz-festival-2026",
    title: "TanJAzz — Tangier Jazz Festival",
    description: "Jazz sounds reflecting across the Strait of Gibraltar. Live stages in historical palaces, street parades, and late-night jam sessions in Tangier.",
    category: "festival",
    imageUrl: "https://images.unsplash.com/photo-1486591978090-58e619d37fe7?w=800&auto=format&fit=crop&q=80",
    galleryUrls: [],
    date: getDateOffset(6, 18), // 6 days from now
    endDate: getDateOffset(9, 23),
    city: "Tangier",
    venue: "Palais des Institutions Italiennes",
    lat: CITIES_COORDS.tangier.lat - 0.005,
    lng: CITIES_COORDS.tangier.lng + 0.004,
    organizer: "TanJAzz Committee",
    speakers: [],
    status: "upcoming",
    capacity: 1000,
    attendeesCount: 650,
    interestedCount: 420,
    isFeatured: false,
    isSponsored: false,
    tags: ["Music", "Jazz", "Tangier", "Festival"],
    price: "300 MAD",
    mapsUrl: "https://maps.google.com/?q=Palais+des+Institutions+Italiennes+Tangier"
  },
  {
    id: "casablanca-smart-city-expo",
    title: "Casablanca Smart City Expo",
    description: "Focusing on smart infrastructure, waste management, traffic optimization, and digital citizen services in North Africa's largest metropolis.",
    category: "tech-conference",
    imageUrl: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&auto=format&fit=crop&q=80",
    galleryUrls: [],
    date: getDateOffset(10, 9), // 10 days from now
    city: "Casablanca",
    venue: "Casablanca International Convention Center",
    lat: CITIES_COORDS.casablanca.lat + 0.001,
    lng: CITIES_COORDS.casablanca.lng - 0.008,
    organizer: "Casablanca Events & Animation",
    speakers: [
      { name: "Tarik Bennouna", title: "Smart Cities Director", avatarUrl: "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=150" }
    ],
    status: "upcoming",
    capacity: 800,
    attendeesCount: 520,
    interestedCount: 310,
    isFeatured: false,
    isSponsored: false,
    tags: ["Smart City", "Urbanism", "Tech", "Casablanca"],
    price: "500 MAD",
    mapsUrl: "https://maps.google.com/?q=Convention+Center+Casablanca"
  },
  {
    id: "agadir-surf-music-fest",
    title: "Agadir Surf & Beats Festival",
    description: "Combining coastal waves with high-energy electronic music. Beach volleyball tournaments by day, DJ sets and beach fires by night.",
    category: "festival",
    imageUrl: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800&auto=format&fit=crop&q=80",
    galleryUrls: [],
    date: getDateOffset(5, 12), // 5 days from now
    endDate: getDateOffset(7, 23),
    city: "Agadir",
    venue: "Taghazout Beach Stage",
    lat: CITIES_COORDS.agadir.lat + 0.15, // near Taghazout
    lng: CITIES_COORDS.agadir.lng - 0.08,
    organizer: "Taghazout Surf Club",
    speakers: [],
    status: "upcoming",
    capacity: 1500,
    attendeesCount: 1200,
    interestedCount: 650,
    isFeatured: false,
    isSponsored: true,
    tags: ["Surf", "Music", "Beach", "Agadir"],
    price: "150 MAD",
    mapsUrl: "https://maps.google.com/?q=Taghazout+Beach+Agadir"
  },
  {
    id: "morocco-fashion-week-2026",
    title: "Morocco Fashion Week Marrakech",
    description: "Morocco's global showcase of modern caftans, haute couture, and traditional craftsmanship. Connecting international buyers with regional talent.",
    category: "art-fashion",
    imageUrl: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&auto=format&fit=crop&q=80",
    galleryUrls: [],
    date: getDateOffset(12, 17), // 12 days from now
    endDate: getDateOffset(15, 22),
    city: "Marrakech",
    venue: "Royal Mansour Marrakech Gardens",
    lat: CITIES_COORDS.marrakech.lat - 0.005,
    lng: CITIES_COORDS.marrakech.lng - 0.008,
    organizer: "Marrakech Fashion Association",
    speakers: [],
    status: "upcoming",
    capacity: 400,
    attendeesCount: 220,
    interestedCount: 512,
    isFeatured: true,
    isSponsored: false,
    tags: ["Couture", "Fashion", "Marrakech", "Luxury"],
    price: "Invitation Only",
    mapsUrl: "https://maps.google.com/?q=Royal+Mansour+Marrakech"
  },
  {
    id: "morocco-gaming-expo-rabat",
    title: "Morocco Gaming Expo",
    description: "The national event celebrating indie game developers, eSports tournaments, game art, and character design. Sponsored by Morocco Ministry of Youth.",
    category: "tech-conference",
    imageUrl: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&auto=format&fit=crop&q=80",
    galleryUrls: [],
    date: getDateOffset(14, 10), // 14 days from now
    city: "Rabat",
    venue: "Rabat Exhibition Center",
    lat: CITIES_COORDS.rabat.lat + 0.02,
    lng: CITIES_COORDS.rabat.lng + 0.04,
    organizer: "Morocco eSports Federation",
    speakers: [],
    status: "upcoming",
    capacity: 2000,
    attendeesCount: 890,
    interestedCount: 450,
    isFeatured: false,
    isSponsored: false,
    tags: ["Gaming", "eSports", "Rabat", "Technology"],
    price: "30 MAD",
    mapsUrl: "https://maps.google.com/?q=Rabat+Exhibition+Center"
  },
  {
    id: "north-africa-business-summit",
    title: "North Africa Business Summit",
    description: "Focusing on inter-African trade, renewable energy investment, manufacturing scalability, and venture funding across Tunisia, Algeria, Egypt, and Morocco.",
    category: "business-summit",
    imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=80",
    galleryUrls: [],
    date: getDateOffset(11, 9), // 11 days from now
    city: "Casablanca",
    venue: "Four Seasons Hotel Casablanca",
    lat: CITIES_COORDS.casablanca.lat - 0.008,
    lng: CITIES_COORDS.casablanca.lng - 0.025,
    organizer: "African Business Chamber",
    speakers: [
      { name: "Karim Benkirane", title: "VP of Clean Energy Initiatives", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" }
    ],
    status: "upcoming",
    capacity: 400,
    attendeesCount: 310,
    interestedCount: 520,
    isFeatured: true,
    isSponsored: false,
    tags: ["Trade", "Finance", "Energy", "Casablanca"],
    price: "1500 MAD",
    mapsUrl: "https://maps.google.com/?q=Four+Seasons+Casablanca"
  },
  {
    id: "morocco-medical-gala-casa",
    title: "National Medical Congress",
    description: "Annual meeting covering surgical innovations, medical device breakthroughs, pharmacology studies, and hospital automation.",
    category: "medical-dental",
    imageUrl: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800&auto=format&fit=crop&q=80",
    galleryUrls: [],
    date: getDateOffset(15, 9), // 15 days from now
    city: "Casablanca",
    venue: "Sofitel Casablanca Tour Blanche",
    lat: CITIES_COORDS.casablanca.lat + 0.003,
    lng: CITIES_COORDS.casablanca.lng - 0.005,
    organizer: "Moroccan Medical Association",
    speakers: [
      { name: "Dr. Ghita Senhaji", title: "Head of Cardiology, CHU", avatarUrl: "https://images.unsplash.com/photo-1594824813573-246434de83fb?w=150" }
    ],
    status: "upcoming",
    capacity: 350,
    attendeesCount: 220,
    interestedCount: 312,
    isFeatured: false,
    isSponsored: false,
    tags: ["Medicine", "Surgery", "Healthcare", "Casablanca"],
    price: "600 MAD",
    mapsUrl: "https://maps.google.com/?q=Sofitel+Casablanca+Tour+Blanche"
  },

  // --- UPCOMING / NEXT MONTH (June 2026) ---
  {
    id: "marrakech-biennale-2026",
    title: "Marrakech Biennale of Contemporary Art",
    description: "A month-long exhibition of installations, paintings, architecture designs, and performances by African and Middle-Eastern contemporary creators.",
    category: "art-fashion",
    imageUrl: "https://images.unsplash.com/photo-1531058020387-3be344559be6?w=800&auto=format&fit=crop&q=80",
    galleryUrls: [],
    date: getDateOffset(22, 10), // 22 days from now (June 12)
    endDate: getDateOffset(52, 18), // 30 days duration
    city: "Marrakech",
    venue: "Palais El Badi Ruins",
    lat: CITIES_COORDS.marrakech.lat - 0.015,
    lng: CITIES_COORDS.marrakech.lng - 0.002,
    organizer: "Marrakech Biennale Foundation",
    speakers: [],
    status: "upcoming",
    capacity: 5000,
    attendeesCount: 420,
    interestedCount: 2150,
    isFeatured: true,
    isSponsored: false,
    tags: ["Art", "Biennale", "Marrakech", "Exposition"],
    price: "100 MAD",
    mapsUrl: "https://maps.google.com/?q=Palais+El+Badi+Marrakech"
  },
  {
    id: "marrakech-startup-summit",
    title: "Marrakech Tech & Startup Summit",
    description: "Morocco's premier tech gathering bringing together VCs, global accelerators, founders, and engineers to forge tech-ecosystem alliances.",
    category: "startup",
    imageUrl: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&auto=format&fit=crop&q=80",
    galleryUrls: [],
    date: getDateOffset(25, 9), // June 15
    city: "Marrakech",
    venue: "Palais des Congres Marrakech",
    lat: CITIES_COORDS.marrakech.lat + 0.001,
    lng: CITIES_COORDS.marrakech.lng - 0.015,
    organizer: "Marrakech Tech Hub",
    speakers: [],
    status: "upcoming",
    capacity: 600,
    attendeesCount: 154,
    interestedCount: 432,
    isFeatured: false,
    isSponsored: false,
    tags: ["Startups", "Venture", "Technology", "Marrakech"],
    price: "800 MAD",
    mapsUrl: "https://maps.google.com/?q=Palais+des+Congres+Marrakech"
  },
  {
    id: "essaouira-gnawa-festival",
    title: "Essaouira Gnawa & World Music Festival",
    description: "The mystical rhythms of Gnawa music fusing with jazz, blues, and rock. An immersive cultural experience under the windy skies of Essaouira.",
    category: "festival",
    imageUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&auto=format&fit=crop&q=80",
    galleryUrls: [],
    date: getDateOffset(35, 17), // June 25
    endDate: getDateOffset(39, 23),
    city: "Agadir", // Categorize under Agadir as it's the closest main hub
    venue: "Essaouira Moulay Hassan Square",
    lat: 31.5085, // Essaouira coordinates
    lng: -9.7701,
    organizer: "Gnawa Festival Association",
    speakers: [],
    status: "upcoming",
    capacity: 30000,
    attendeesCount: 2200,
    interestedCount: 5900,
    isFeatured: true,
    isSponsored: false,
    tags: ["Gnawa", "Music", "Festival", "Essaouira", "Culture"],
    price: "Free",
    mapsUrl: "https://maps.google.com/?q=Place+Moulay+Hassan+Essaouira"
  },
  {
    id: "casa-contemporary-art-fair",
    title: "Casablanca Contemporary Art Fair",
    description: "Meet Morocco's leading visual artists, painters, and sculptors showing original works in an industrial loft in the Roches Noires district.",
    category: "art-fashion",
    imageUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80",
    galleryUrls: [],
    date: getDateOffset(28, 14), // June 18
    city: "Casablanca",
    venue: "Roches Noires Industrial Gallery",
    lat: CITIES_COORDS.casablanca.lat + 0.02,
    lng: CITIES_COORDS.casablanca.lng + 0.015,
    organizer: "Casablanca Art Collective",
    speakers: [],
    status: "upcoming",
    capacity: 300,
    attendeesCount: 42,
    interestedCount: 220,
    isFeatured: false,
    isSponsored: false,
    tags: ["Art", "Gallery", "Sculpture", "Casablanca"],
    price: "50 MAD",
    mapsUrl: "https://maps.google.com/?q=Roches+Noires+Casablanca"
  },
  {
    id: "siam-meknes-agriculture-show",
    title: "International Agriculture Show (SIAM)",
    description: "Africa's largest agricultural trade show. Showcasing agribusiness, agro-tech innovations, farm machinery, and livestock genetics.",
    category: "exposition",
    imageUrl: "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=800&auto=format&fit=crop&q=80",
    galleryUrls: [],
    date: getDateOffset(29, 9), // June 19
    endDate: getDateOffset(34, 18),
    city: "Meknes",
    venue: "Bassins de l'Agdal Exhibition Grounds",
    lat: CITIES_COORDS.meknes.lat - 0.02,
    lng: CITIES_COORDS.meknes.lng - 0.01,
    organizer: "SIAM Association",
    speakers: [],
    status: "upcoming",
    capacity: 10000,
    attendeesCount: 2400,
    interestedCount: 3100,
    isFeatured: true,
    isSponsored: false,
    tags: ["Agriculture", "Agribusiness", "Meknes", "Exposition"],
    price: "40 MAD",
    mapsUrl: "https://maps.google.com/?q=Bassins+de+l'Agdal+Meknes"
  },

  // --- SOLD OUT ---
  {
    id: "casa-exclusive-startup-pitch",
    title: "Velora Luxury Tech Showcase",
    description: "A private presentation of elite next-generation web technologies, decentralized networks, and luxury software services. Fully booked.",
    category: "startup",
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80",
    galleryUrls: [],
    date: getDateOffset(1, 14), // Tomorrow afternoon
    city: "Casablanca",
    venue: "The Penthouse Anfa Park",
    lat: CITIES_COORDS.casablanca.lat - 0.015,
    lng: CITIES_COORDS.casablanca.lng - 0.01,
    organizer: "Velora Technologies",
    speakers: [
      { name: "Omar Alaoui", title: "Chief Tech Architect, Velora", avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150" }
    ],
    status: "sold-out",
    capacity: 50,
    attendeesCount: 50,
    interestedCount: 384,
    isFeatured: true,
    isSponsored: true,
    tags: ["Tech", "Exclusive", "Casablanca", "Decentralized"],
    price: "1500 MAD (Sold Out)",
    mapsUrl: "https://maps.google.com/?q=Anfa+Park+Casablanca"
  },

  // --- ENDED ---
  {
    id: "casa-portes-ouvertes-tech",
    title: "Technopark Casablanca Open Doors",
    description: "Our annual open house inviting corporate clients, investors, and local graduates to interact with 120+ early-stage Moroccan startups.",
    category: "portes-ouvertes",
    imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80",
    galleryUrls: [],
    date: getDateOffset(-5, 9), // 5 days ago
    endDate: getDateOffset(-5, 17),
    city: "Casablanca",
    venue: "Technopark Main Hall",
    lat: CITIES_COORDS.casablanca.lat + 0.012,
    lng: CITIES_COORDS.casablanca.lng + 0.018,
    organizer: "Technopark Casablanca Management",
    speakers: [],
    status: "ended",
    capacity: 400,
    attendeesCount: 395,
    interestedCount: 220,
    isFeatured: false,
    isSponsored: false,
    tags: ["Startups", "Networking", "Open House", "Casablanca"],
    price: "Free",
    mapsUrl: "https://maps.google.com/?q=Technopark+Casablanca"
  }
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function seed() {
  console.log(`🚀 Seeding ${EVENTS_DATA.length} events to Firestore (Project: ${firebaseConfig.projectId})...`);
  let count = 0;

  for (const event of EVENTS_DATA) {
    const docRef = doc(db, "events", event.id);
    const eventPayload = {
      ...event,
      isApproved: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    try {
      await setDoc(docRef, eventPayload);
      console.log(`✅ Seeded event: ${event.title} [id: ${event.id}]`);
      count++;
    } catch (err) {
      console.error(`❌ Failed to seed event: ${event.title}`, err);
    }
    
    // Add 1 second delay between writes to avoid unauthenticated write rate limiting
    await delay(1000);
  }

  console.log(`\n🎉 Successfully seeded ${count}/${EVENTS_DATA.length} events!`);
  process.exit(0);
}

seed();
