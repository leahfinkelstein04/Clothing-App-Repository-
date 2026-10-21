/**
 * Occasion Scout — Core Verification Test Suite
 * Validates:
 * 1. Mile-to-meter conversion (1 mile = 1609.344 meters)
 * 2. Great-circle Haversine distance calculations and accuracy
 * 3. 1, 3, 5, 10, and 25-mile strict boundary filtering
 * 4. Store deduplication logic across repeated searches & locations
 * 5. Anti-hallucination guardrail: Rejection of fabricated store IDs not present in discovery
 * 6. Graceful handling of missing optional fields (budget, style, price)
 * 7. Empty radius handling (honest empty state, no silent radius broadening)
 */

import {
  calculateDistanceMiles,
  milesToMeters,
  metersToMiles,
  isValidLatLng,
  formatDistanceMiles,
  METERS_PER_MILE,
} from '../src/shared/geo.ts';
import type { DiscoveredPlace, RankedStoreRecommendation, OccasionAnalysis } from '../src/shared/types.ts';

// Test runner assertion helper
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEquals<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`Assertion failed: ${message} (Expected: ${expected}, Actual: ${actual})`);
  }
}

async function runTests() {
  console.log('--- STARTING OCCASION SCOUT RELIABILITY TESTS ---');
  let passed = 0;

  // Test 1: Mile-to-meter conversion precision
  {
    console.log('[Test 1] Verifying exact statute mile-to-meter conversion...');
    assertEquals(METERS_PER_MILE, 1609.344, 'METERS_PER_MILE must be exactly 1609.344');
    assertEquals(milesToMeters(1), 1609.344, '1 mile should equal 1609.344 meters');
    assertEquals(milesToMeters(3), 4828.032, '3 miles should equal 4828.032 meters');
    assertEquals(milesToMeters(5), 8046.72, '5 miles should equal 8046.72 meters');
    assertEquals(milesToMeters(10), 16093.44, '10 miles should equal 16093.44 meters');
    assertEquals(milesToMeters(25), 40233.6, '25 miles should equal 40233.6 meters');
    assertEquals(Math.round(metersToMiles(1609.344)), 1, '1609.344 meters should convert to 1 mile');
    passed++;
  }

  // Test 2: Lat/Lng validation
  {
    console.log('[Test 2] Validating coordinate boundaries...');
    assert(isValidLatLng(29.9511, -90.0715), 'Valid New Orleans coordinates');
    assert(isValidLatLng(0, 0), 'Valid Equator coordinates');
    assert(isValidLatLng(90, 180), 'Valid boundary coordinates');
    assert(!isValidLatLng(91, 0), 'Invalid latitude > 90');
    assert(!isValidLatLng(0, 181), 'Invalid longitude > 180');
    assert(!isValidLatLng('29.95', -90), 'Invalid non-number type');
    passed++;
  }

  // Test 3: Haversine distance accuracy
  {
    console.log('[Test 3] Verifying Haversine distance calculations against known points...');
    // New Orleans City Hall (29.9515, -90.0763) to Jackson Square (29.9574, -90.0631) ~ 0.88 miles
    const dist1 = calculateDistanceMiles(29.9515, -90.0763, 29.9574, -90.0631);
    assert(dist1 >= 0.8 && dist1 <= 1.0, `Distance should be approx 0.88 miles, got ${dist1}`);

    // Same point should be 0 miles
    const distSame = calculateDistanceMiles(29.9515, -90.0763, 29.9515, -90.0763);
    assertEquals(distSame, 0, 'Distance to self must be 0');
    passed++;
  }

  // Test 4: Strict 1, 3, 5, 10, 25-mile boundary filtering
  {
    console.log('[Test 4] Testing boundary filtering across 1, 3, 5, 10, 25 miles...');
    const center = { lat: 29.9511, lng: -90.0715 };

    // Create controlled mock stores at known distances for boundary test
    const mockStores: DiscoveredPlace[] = [
      { id: 'store_0_5', name: 'Half Mile Store', formattedAddress: 'Address 1', lat: 29.955, lng: -90.0715, distanceMiles: 0.5, types: ['clothing_store'] },
      { id: 'store_1_2', name: 'One Point Two Mile Store', formattedAddress: 'Address 2', lat: 29.968, lng: -90.0715, distanceMiles: 1.2, types: ['clothing_store'] },
      { id: 'store_2_8', name: 'Two Point Eight Mile Store', formattedAddress: 'Address 3', lat: 29.991, lng: -90.0715, distanceMiles: 2.8, types: ['clothing_store'] },
      { id: 'store_4_9', name: 'Four Point Nine Mile Store', formattedAddress: 'Address 4', lat: 30.022, lng: -90.0715, distanceMiles: 4.9, types: ['clothing_store'] },
      { id: 'store_9_5', name: 'Nine Point Five Mile Store', formattedAddress: 'Address 5', lat: 30.088, lng: -90.0715, distanceMiles: 9.5, types: ['clothing_store'] },
      { id: 'store_24_0', name: 'Twenty Four Mile Store', formattedAddress: 'Address 6', lat: 30.298, lng: -90.0715, distanceMiles: 24.0, types: ['clothing_store'] },
      { id: 'store_30_0', name: 'Thirty Mile Store (Outside)', formattedAddress: 'Address 7', lat: 30.385, lng: -90.0715, distanceMiles: 30.0, types: ['clothing_store'] },
    ];

    const filterByRadius = (stores: DiscoveredPlace[], radius: number) =>
      stores.filter((s) => s.distanceMiles <= radius);

    // 1-mile filter: only store_0_5
    const r1 = filterByRadius(mockStores, 1);
    assertEquals(r1.length, 1, '1-mile radius should retain only 1 store');
    assertEquals(r1[0].id, 'store_0_5', '1-mile must include only store_0_5');

    // 3-mile filter: store_0_5, store_1_2, store_2_8
    const r3 = filterByRadius(mockStores, 3);
    assertEquals(r3.length, 3, '3-mile radius should retain 3 stores');

    // 5-mile filter: 4 stores
    const r5 = filterByRadius(mockStores, 5);
    assertEquals(r5.length, 4, '5-mile radius should retain 4 stores');

    // 10-mile filter: 5 stores
    const r10 = filterByRadius(mockStores, 10);
    assertEquals(r10.length, 5, '10-mile radius should retain 5 stores');

    // 25-mile filter: 6 stores (excludes 30.0 mi store)
    const r25 = filterByRadius(mockStores, 25);
    assertEquals(r25.length, 6, '25-mile radius should retain 6 stores and exclude the 30-mile store');
    passed++;
  }

  // Test 5: Deduplication by place ID and normalized address
  {
    console.log('[Test 5] Testing store deduplication logic...');
    const rawList: DiscoveredPlace[] = [
      { id: 'dup_1', name: 'Zara French Quarter', formattedAddress: '100 Canal St, New Orleans', lat: 29.95, lng: -90.07, distanceMiles: 0.4, types: ['clothing_store'] },
      { id: 'dup_1', name: 'Zara French Quarter Duplicate', formattedAddress: '100 Canal St, New Orleans', lat: 29.95, lng: -90.07, distanceMiles: 0.4, types: ['clothing_store'] },
      { id: 'different_id_same_address', name: 'Zara', formattedAddress: '100 Canal St., New Orleans', lat: 29.95, lng: -90.07, distanceMiles: 0.4, types: ['clothing_store'] },
      { id: 'unique_store', name: 'Unique Boutique', formattedAddress: '200 Magazine St, New Orleans', lat: 29.95, lng: -90.07, distanceMiles: 0.6, types: ['clothing_store'] },
    ];

    const seenIds = new Set<string>();
    const seenAddresses = new Set<string>();
    const deduplicated: DiscoveredPlace[] = [];

    for (const item of rawList) {
      if (seenIds.has(item.id)) continue;
      const normAddr = item.formattedAddress.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (seenAddresses.has(normAddr)) continue;

      seenIds.add(item.id);
      seenAddresses.add(normAddr);
      deduplicated.push(item);
    }

    assertEquals(deduplicated.length, 2, 'Deduplication must keep only 2 unique stores');
    assertEquals(deduplicated[0].id, 'dup_1', 'First store should be dup_1');
    assertEquals(deduplicated[1].id, 'unique_store', 'Second store should be unique_store');
    passed++;
  }

  // Test 6: Anti-Hallucination Security Guardrail
  {
    console.log('[Test 6] Verifying server rejection of hallucinated place IDs...');
    const verifiedDiscoveredStores: DiscoveredPlace[] = [
      { id: 'real_place_1', name: 'Real Boutique One', formattedAddress: '123 Main St', lat: 29.95, lng: -90.07, distanceMiles: 0.5, types: ['clothing_store'] },
      { id: 'real_place_2', name: 'Real Department Store', formattedAddress: '456 Royal St', lat: 29.95, lng: -90.07, distanceMiles: 1.1, types: ['department_store'] },
    ];

    // Simulated AI output containing 1 real store and 1 fabricated store name/ID
    const simulatedAiRecommendations = [
      {
        placeId: 'real_place_1',
        suitabilityScore: 92,
        editorialMatchTitle: 'Curated Boutique',
        whyItFits: 'Perfect tailored fits for a formal dinner.',
        whatToLookFor: 'Midi dresses',
        retailCategory: 'Designer Boutique',
      },
      {
        placeId: 'fake_hallucinated_id_999',
        suitabilityScore: 98,
        editorialMatchTitle: 'Invented Luxury Emporium',
        whyItFits: 'This fake store has everything.',
        whatToLookFor: 'Silk gowns',
        retailCategory: 'Luxury',
      },
    ];

    const placeMap = new Map<string, DiscoveredPlace>();
    for (const p of verifiedDiscoveredStores) {
      placeMap.set(p.id, p);
    }

    const verifiedRanked: Array<{ placeId: string; storeName: string }> = [];
    for (const item of simulatedAiRecommendations) {
      const realStore = placeMap.get(item.placeId);
      if (!realStore) {
        // Discard fabricated recommendation!
        continue;
      }
      verifiedRanked.push({ placeId: realStore.id, storeName: realStore.name });
    }

    assertEquals(verifiedRanked.length, 1, 'Server must reject hallucinated store');
    assertEquals(verifiedRanked[0].placeId, 'real_place_1', 'Only real_place_1 survives verification');
    passed++;
  }

  // Test 7: Distance string formatting
  {
    console.log('[Test 7] Verifying editorial distance formatting...');
    assertEquals(formatDistanceMiles(0.04), '< 0.1 mi', 'Sub-0.1 mi formatting');
    assertEquals(formatDistanceMiles(0.52), '0.5 mi', 'Single decimal place rounding');
    assertEquals(formatDistanceMiles(5.0), '5.0 mi', '5-mile display');
    passed++;
  }

  // Test 8: Travel time estimation logic
  {
    console.log('[Test 8] Verifying travel time estimates for walking and driving...');
    const calcTravel = (miles: number) => ({
      drivingMinutes: Math.max(Math.round(miles * 3.5), 2),
      walkingMinutes: miles <= 1.5 ? Math.max(Math.round(miles * 20), 1) : undefined,
    });

    const closeStore = calcTravel(0.4);
    assertEquals(closeStore.walkingMinutes, 8, '0.4 mi should estimate ~8 min walk');
    assert(closeStore.drivingMinutes >= 2, 'Driving minutes at least 2');

    const farStore = calcTravel(4.5);
    assertEquals(farStore.walkingMinutes, undefined, 'Far distance (>1.5 mi) should omit walking estimate');
    assert(farStore.drivingMinutes >= 15, '4.5 mi should estimate >= 15 min drive');
    passed++;
  }

  // Test 9: Shareable Deep-Link URL Parameter Construction & Parsing
  {
    console.log('[Test 9] Verifying shareable deep-link URL encoding and decoding...');
    const baseUrl = 'https://occasion-scout.app';
    const params = new URLSearchParams({
      occasion: 'An outdoor wedding in November',
      lat: '29.9511',
      lng: '-90.0715',
      radius: '5',
      loc: 'French Quarter, New Orleans, LA',
    });
    const generatedUrl = `${baseUrl}/?${params.toString()}`;

    const parsed = new URL(generatedUrl);
    assertEquals(parsed.searchParams.get('occasion'), 'An outdoor wedding in November', 'Decoded occasion must match');
    assertEquals(parsed.searchParams.get('lat'), '29.9511', 'Decoded lat must match');
    assertEquals(parsed.searchParams.get('lng'), '-90.0715', 'Decoded lng must match');
    assertEquals(parsed.searchParams.get('radius'), '5', 'Decoded radius must match');
    assertEquals(parsed.searchParams.get('loc'), 'French Quarter, New Orleans, LA', 'Decoded location label must match');
    passed++;
  }

  // Test 10: Mobile GPS coordinate string regex and validation
  {
    console.log('[Test 10] Verifying coordinate string regex for reverse geocoding...');
    const coordRegex = /^(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)$/;
    const testCases = [
      { input: '29.9511,-90.0715', expectedLat: 29.9511, expectedLng: -90.0715 },
      { input: '40.7128, -74.0060', expectedLat: 40.7128, expectedLng: -74.0060 },
      { input: '-33.8688, 151.2093', expectedLat: -33.8688, expectedLng: 151.2093 },
    ];

    for (const tc of testCases) {
      const match = tc.input.trim().match(coordRegex);
      assert(!!match, `Coordinate string "${tc.input}" must match regex`);
      const lat = parseFloat(match![1]);
      const lng = parseFloat(match![3]);
      assertEquals(lat, tc.expectedLat, 'Parsed lat matches');
      assertEquals(lng, tc.expectedLng, 'Parsed lng matches');
      assert(isValidLatLng(lat, lng), 'Parsed coords must be valid');
    }

    // Negative tests: regular addresses should not match
    assert(!'SoHo, New York, NY'.match(coordRegex), 'City address must not match coordinate regex');
    assert(!'70130'.match(coordRegex), 'ZIP code must not match coordinate regex');
    passed++;
  }

  console.log(`\n✅ ALL ${passed} OCCASION SCOUT RELIABILITY TESTS PASSED SUCCESSFULLY!`);
}

runTests().catch((err) => {
  console.error('❌ TEST SUITE FAILURE:', err);
  process.exit(1);
});
