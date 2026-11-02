/**
 * HOGANA — Operational Intelligence Engine
 * Geospatial distance calculation utilities.
 */

const EARTH_RADIUS_METERS = 6371000;

/**
 * Calculates great-circle distance between two coordinate pairs in meters using the Haversine formula.
 */
export function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

/**
 * Checks if a GPS observation is within a given radius in meters of a target landmark.
 */
export function isWithinGeofence(
  gpsLat: number,
  gpsLon: number,
  targetLat: number,
  targetLon: number,
  radiusMeters: number
): boolean {
  const distance = haversineMeters(gpsLat, gpsLon, targetLat, targetLon);
  return distance <= radiusMeters;
}
