/**
 * Geographic calculation utilities for Occasion Scout
 * Strictly complies with:
 * - 1 mile = 1609.344 meters
 * - Spherical Haversine distance formula
 */

export const METERS_PER_MILE = 1609.344;
export const EARTH_RADIUS_MILES = 3958.7613;

/**
 * Convert statute miles to meters
 */
export function milesToMeters(miles: number): number {
  if (typeof miles !== 'number' || isNaN(miles) || miles < 0) {
    throw new Error('Miles must be a non-negative number');
  }
  return miles * METERS_PER_MILE;
}

/**
 * Convert meters to statute miles
 */
export function metersToMiles(meters: number): number {
  if (typeof meters !== 'number' || isNaN(meters) || meters < 0) {
    throw new Error('Meters must be a non-negative number');
  }
  return meters / METERS_PER_MILE;
}

/**
 * Validates geographic coordinates
 */
export function isValidLatLng(lat: unknown, lng: unknown): boolean {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (isNaN(lat) || isNaN(lng)) return false;
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Calculate the great-circle distance between two points in miles using the Haversine formula
 */
export function calculateDistanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (!isValidLatLng(lat1, lon1) || !isValidLatLng(lat2, lon2)) {
    throw new Error('Invalid coordinates provided to calculateDistanceMiles');
  }

  const toRad = (value: number) => (value * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const lat1Rad = toRad(lat1);
  const lat2Rad = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_MILES * c;

  return Math.round(distance * 100) / 100;
}

/**
 * Format distance for clean editorial display
 */
export function formatDistanceMiles(miles: number): string {
  if (miles < 0.1) {
    return '< 0.1 mi';
  }
  return `${miles.toFixed(1)} mi`;
}
