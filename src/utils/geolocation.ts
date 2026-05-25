/* ═══════════════════════════════════════════════════
   VELORA — Geolocation & Proximity Library
   ═══════════════════════════════════════════════════ */

/**
 * Calculates the great-circle distance between two points on the Earth's surface
 * using the Haversine formula.
 * @returns distance in meters
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Radius of the Earth in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // distance in meters
}

/**
 * Rounds coordinate values to 3 decimal places.
 * This provides coarse precision of ~110m, preserving public privacy.
 */
export function getCoarseCoordinates(lat: number, lng: number): { lat: number; lng: number } {
  return {
    lat: Math.round(lat * 1000) / 1000,
    lng: Math.round(lng * 1000) / 1000,
  };
}

/**
 * Formats a distance in meters to a premium, luxurious distance tag label.
 * Supports French (default) and English translations.
 */
export function getDistanceLabel(meters: number, locale: "fr" | "en" | string = "fr"): string {
  const isEn = locale.startsWith("en");

  if (meters <= 100) {
    return isEn ? "nearby" : "à proximité";
  }
  if (meters <= 300) {
    return isEn ? "close to you" : "près de vous";
  }
  if (meters < 1000) {
    // Round to nearest 10 meters
    const roundedMeters = Math.round(meters / 10) * 10;
    return isEn ? `${roundedMeters}m away` : `à ${roundedMeters}m`;
  }
  // Convert to kilometers with 1 decimal place
  const km = (meters / 1000).toFixed(1);
  // Remove .0 suffix if not needed (e.g. 2.0km -> 2km)
  const displayKm = km.endsWith(".0") ? km.substring(0, km.length - 2) : km;
  return isEn ? `${displayKm}km away` : `à ${displayKm}km`;
}
