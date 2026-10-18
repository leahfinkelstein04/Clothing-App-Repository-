/**
 * Google Places API (New) & Geocoding Service for Occasion Scout
 * Retrieves authentic physical clothing stores and geocodes locations.
 */

import { calculateDistanceMiles, milesToMeters } from '../shared/geo.ts';
import type { DiscoveredPlace, GeocodeResponse, RetailCategoryPreference } from '../shared/types.ts';

const SOLUTION_ID = 'gmp_mcp_codeassist_v1_aistudio';

function getMapsApiKey(): string {
  const key = process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    throw new Error('Google Maps API key is not configured in server environment.');
  }
  return key;
}

// Banned place types or keywords to prevent dry cleaners, storage, alteration shops, or grocery stores
const EXCLUDED_NAME_KEYWORDS = [
  'dry cleaner',
  'cleaners',
  'laundromat',
  'laundry',
  'tailoring only',
  'alterations only',
  'shoe repair',
  'convenience store',
  'gas station',
  'pharmacy',
  'hardware',
  'storage',
  'post office',
  'costume rental',
];

/**
 * Geocode a human address, ZIP code, or city string into coordinates
 */
export async function geocodeAddress(addressQuery: string): Promise<GeocodeResponse> {
  const key = getMapsApiKey();
  const trimmed = addressQuery.trim();
  if (!trimmed) {
    throw new Error('Address query cannot be empty.');
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    trimmed
  )}&key=${key}`;

  const res = await fetch(url, {
    headers: {
      'X-Goog-Maps-Solution-ID': SOLUTION_ID,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Geocoding HTTP error (${res.status}): ${errorText}`);
  }

  const data = (await res.json()) as {
    status: string;
    results?: Array<{
      formatted_address: string;
      geometry: { location: { lat: number; lng: number } };
      address_components?: Array<{ long_name: string; short_name: string; types: string[] }>;
    }>;
    error_message?: string;
  };

  if (data.status === 'OVER_QUERY_LIMIT' || data.status === 'RESOURCE_EXHAUSTED') {
    const err = new Error('Google Maps Platform quota reached.');
    (err as unknown as { isQuotaError: boolean }).isQuotaError = true;
    throw err;
  }

  if (data.status === 'ZERO_RESULTS' || !data.results || data.results.length === 0) {
    throw new Error(`Location not found for "${trimmed}". Please try a more specific city, neighborhood, or ZIP code.`);
  }

  const first = data.results[0];
  let city: string | undefined;
  let state: string | undefined;

  for (const comp of first.address_components || []) {
    if (comp.types.includes('locality')) {
      city = comp.long_name;
    }
    if (comp.types.includes('administrative_area_level_1')) {
      state = comp.short_name;
    }
  }

  return {
    lat: first.geometry.location.lat,
    lng: first.geometry.location.lng,
    formattedAddress: first.formatted_address,
    city,
    state,
  };
}

/**
 * Reverse geocode latitude and longitude into a clean location name
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const key = getMapsApiKey();
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}`;
    const res = await fetch(url, {
      headers: { 'X-Goog-Maps-Solution-ID': SOLUTION_ID },
    });
    if (!res.ok) return `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
    const data = (await res.json()) as {
      results?: Array<{ formatted_address: string }>;
    };
    if (data.results && data.results[0]) {
      return data.results[0].formatted_address;
    }
    return `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
  } catch {
    return `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
  }
}

interface PlacesSearchApiItem {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  priceLevel?: 'PRICE_LEVEL_FREE' | 'PRICE_LEVEL_INEXPENSIVE' | 'PRICE_LEVEL_MODERATE' | 'PRICE_LEVEL_EXPENSIVE' | 'PRICE_LEVEL_VERY_EXPENSIVE';
  websiteUri?: string;
  regularOpeningHours?: { openNow?: boolean };
  types?: string[];
  primaryType?: string;
  nationalPhoneNumber?: string;
}

/**
 * Execute single Places API (New) Text Search
 */
async function executePlacesTextSearch(
  query: string,
  centerLat: number,
  centerLng: number,
  radiusMeters: number
): Promise<PlacesSearchApiItem[]> {
  const key = getMapsApiKey();
  const url = 'https://places.googleapis.com/v1/places:searchText';

  const body = {
    textQuery: query,
    locationBias: {
      circle: {
        center: {
          latitude: centerLat,
          longitude: centerLng,
        },
        radius: Math.min(radiusMeters, 50000), // Max allowed by Places API
      },
    },
    maxResultCount: 15,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.websiteUri,places.regularOpeningHours,places.types,places.primaryType,places.nationalPhoneNumber',
      'X-Goog-Maps-Solution-ID': SOLUTION_ID,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(9000),
  });

  if (response.status === 429) {
    const err = new Error('Google Maps Platform quota reached.');
    (err as unknown as { isQuotaError: boolean }).isQuotaError = true;
    throw err;
  }

  if (!response.ok) {
    const errorBody = await response.text();
    if (errorBody.includes('RESOURCE_EXHAUSTED')) {
      const err = new Error('Google Maps Platform quota reached.');
      (err as unknown as { isQuotaError: boolean }).isQuotaError = true;
      throw err;
    }
    throw new Error(`Places API search failed (${response.status}): ${errorBody}`);
  }

  const data = (await response.json()) as { places?: PlacesSearchApiItem[] };
  return data.places || [];
}

/**
 * Discover authentic nearby clothing stores with deduplication and strict distance enforcement
 */
export async function discoverStoresNearCoordinates(params: {
  lat: number;
  lng: number;
  radiusMiles: number;
  categoryPreference?: RetailCategoryPreference;
  searchQueries?: string[];
}): Promise<DiscoveredPlace[]> {
  const { lat, lng, radiusMiles, categoryPreference, searchQueries } = params;
  const radiusMeters = milesToMeters(radiusMiles);

  // Build targeted queries to find authentic stores
  const queryList: string[] = [];

  // Tailored queries based on category preference or AI suggestions
  if (categoryPreference === 'boutique') {
    queryList.push('clothing boutique', 'designer boutique');
  } else if (categoryPreference === 'department_store') {
    queryList.push('department store apparel', 'luxury department store');
  } else if (categoryPreference === 'formalwear') {
    queryList.push('formal wear dresses suits', 'eveningwear boutique');
  } else if (categoryPreference === 'vintage_resale') {
    queryList.push('vintage clothing store', 'designer consignment');
  } else if (categoryPreference === 'shoes_accessories') {
    queryList.push('fashion footwear shoes', 'designer accessories boutique');
  } else {
    // General fashion queries
    queryList.push('clothing store', 'clothing boutique');
    if (searchQueries && searchQueries.length > 0) {
      // Add first 1-2 AI search queries if available
      queryList.push(...searchQueries.slice(0, 2));
    } else {
      queryList.push('fashion retailer');
    }
  }

  // Deduplicate query list and keep top 2 for low-latency performance
  const uniqueQueries = Array.from(new Set(queryList)).slice(0, 2);

  // Fetch candidate stores across queries in parallel
  const searchPromises = uniqueQueries.map((q) =>
    executePlacesTextSearch(q, lat, lng, radiusMeters).catch((err) => {
      console.warn(`Search failed for query "${q}":`, err.message);
      return [] as PlacesSearchApiItem[];
    })
  );

  const rawResults = await Promise.all(searchPromises);
  const flattened = rawResults.flat();

  // Deduplicate and filter candidates
  const seenIds = new Set<string>();
  const seenAddresses = new Set<string>();
  const candidates: DiscoveredPlace[] = [];

  for (const item of flattened) {
    if (!item.id || !item.displayName?.text || !item.location) continue;
    if (seenIds.has(item.id)) continue;

    const name = item.displayName.text.trim();
    const address = (item.formattedAddress || '').trim();

    // Avoid duplicate address/location
    const normAddress = address.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normAddress && seenAddresses.has(normAddress)) continue;

    // Filter out obvious non-clothing keywords
    const lowerName = name.toLowerCase();
    const hasExcludedKeyword = EXCLUDED_NAME_KEYWORDS.some((kw) => lowerName.includes(kw));
    if (hasExcludedKeyword) continue;

    // Strict Haversine distance verification
    const distanceMiles = calculateDistanceMiles(lat, lng, item.location.latitude, item.location.longitude);

    // CRITICAL: Strictly filter out places outside the chosen radius
    if (distanceMiles > radiusMiles) {
      continue;
    }

    seenIds.add(item.id);
    if (normAddress) seenAddresses.add(normAddress);

    candidates.push({
      id: item.id,
      name,
      formattedAddress: address,
      lat: item.location.latitude,
      lng: item.location.longitude,
      distanceMiles,
      types: item.types || [],
      primaryType: item.primaryType,
      rating: item.rating,
      userRatingCount: item.userRatingCount,
      priceLevel: item.priceLevel,
      websiteUri: item.websiteUri,
      nationalPhoneNumber: item.nationalPhoneNumber,
      openNow: item.regularOpeningHours?.openNow,
    });
  }

  // Sort initially by distance
  candidates.sort((a, b) => a.distanceMiles - b.distanceMiles);

  // Return authentic candidates (target 5-10) for Gemini to rank
  return candidates.slice(0, 10);
}
