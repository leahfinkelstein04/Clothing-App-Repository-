/**
 * Express API Router for Occasion Scout
 */

import express, { type Request, type Response } from 'express';
import { analyzeOccasionIntent, rankDiscoveredStores } from './gemini.ts';
import { discoverStoresNearCoordinates, geocodeAddress, reverseGeocode } from './places.ts';
import { isValidLatLng } from '../shared/geo.ts';
import type { ScoutSearchRequest, ScoutSearchResponse } from '../shared/types.ts';

export const apiRouter = express.Router();

// Health check
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Occasion Scout Backend',
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    mapsConfigured: !!(process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY),
  });
});

// Geocode address, city, or ZIP code (or reverse geocode coordinates)
apiRouter.post('/geocode', async (req: Request, res: Response): Promise<void> => {
  try {
    const { address, lat, lng } = req.body as {
      address?: string;
      lat?: number | string;
      lng?: number | string;
    };

    // If numerical or parseable lat/lng are provided, reverse geocode directly
    const numLat = Number(lat);
    const numLng = Number(lng);
    if (!isNaN(numLat) && !isNaN(numLng) && isValidLatLng(numLat, numLng)) {
      const formattedAddress = await reverseGeocode(numLat, numLng);
      res.json({
        lat: numLat,
        lng: numLng,
        formattedAddress,
      });
      return;
    }

    if (!address || typeof address !== 'string' || !address.trim()) {
      res.status(400).json({ error: 'Please enter a valid city, neighborhood, address, or ZIP code.' });
      return;
    }

    const trimmed = address.trim();

    // Check if address is a raw "lat, lng" coordinate pair
    const coordMatch = trimmed.match(/^(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)$/);
    if (coordMatch) {
      const parsedLat = parseFloat(coordMatch[1]);
      const parsedLng = parseFloat(coordMatch[3]);
      if (isValidLatLng(parsedLat, parsedLng)) {
        const formattedAddress = await reverseGeocode(parsedLat, parsedLng);
        res.json({
          lat: parsedLat,
          lng: parsedLng,
          formattedAddress,
        });
        return;
      }
    }

    const result = await geocodeAddress(trimmed);
    res.json(result);
  } catch (err: unknown) {
    const error = err as Error & { isQuotaError?: boolean };
    console.error('Geocode route error:', error);
    if (error.isQuotaError) {
      res.status(429).json({
        error: 'Google Maps Platform quota reached. Please visit the developer site.',
        isQuotaError: true,
      });
      return;
    }
    res.status(400).json({ error: error.message || 'Unable to find location.' });
  }
});

// Scout stores for an occasion
apiRouter.post('/scout', async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as ScoutSearchRequest;

    // Validate occasion
    const occasion = (body.occasion || '').trim();
    if (!occasion) {
      res.status(400).json({ error: 'Please describe your occasion.' });
      return;
    }

    // Validate coordinates
    const lat = Number(body.lat);
    const lng = Number(body.lng);
    if (!isValidLatLng(lat, lng)) {
      res.status(400).json({ error: 'Valid search coordinates (latitude and longitude) are required.' });
      return;
    }

    // Validate radius (1, 3, 5, 10, or 25 miles)
    const validRadii = [1, 3, 5, 10, 25];
    const radiusMiles = Number(body.radiusMiles) as 1 | 3 | 5 | 10 | 25;
    if (!validRadii.includes(radiusMiles)) {
      res.status(400).json({ error: 'Radius must be one of: 1, 3, 5, 10, or 25 miles.' });
      return;
    }

    // Resolve location label if missing
    let locationLabel = body.locationLabel?.trim();
    if (!locationLabel) {
      locationLabel = await reverseGeocode(lat, lng);
    }

    // Phase 1: Gemini AI analyzes the occasion and styles
    const analysis = await analyzeOccasionIntent({
      occasion,
      clothingFocus: body.clothingFocus,
      style: body.style,
      dressCode: body.dressCode,
      budget: body.budget,
      categoryPreference: body.categoryPreference,
    });

    // Phase 2: Authentic store discovery using Google Places API (New)
    const discoveredStores = await discoverStoresNearCoordinates({
      lat,
      lng,
      radiusMiles,
      categoryPreference: body.categoryPreference,
      searchQueries: analysis.searchTerms,
    });

    // Handle honest empty results state when no stores exist within exact radius
    if (discoveredStores.length === 0) {
      const emptyResponse: ScoutSearchResponse = {
        analysis,
        recommendations: [],
        totalCandidatesFound: 0,
        searchCenter: {
          lat,
          lng,
          label: locationLabel,
        },
        radiusMiles,
        disclaimer: `No authentic physical clothing stores were found within ${radiusMiles} mile${
          radiusMiles === 1 ? '' : 's'
        } of ${locationLabel}. Try extending your search radius to 5 or 10 miles.`,
      };
      res.json(emptyResponse);
      return;
    }

    // Phase 3: Rank discovered stores with Gemini
    const rankedRecommendations = await rankDiscoveredStores({
      analysis,
      discoveredStores,
      occasion,
      clothingFocus: body.clothingFocus,
      style: body.style,
      budget: body.budget,
    });

    const response: ScoutSearchResponse = {
      analysis,
      recommendations: rankedRecommendations,
      totalCandidatesFound: discoveredStores.length,
      searchCenter: {
        lat,
        lng,
        label: locationLabel,
      },
      radiusMiles,
      disclaimer:
        'Store recommendations and suitability rankings are fashion-editorial evaluations based on brand focus and occasion requirements. Occasion Scout does not claim or confirm real-time stock availability, specific sizes, or live garments.',
    };

    res.json(response);
  } catch (err: unknown) {
    const error = err as Error & { isQuotaError?: boolean };
    console.error('Scout route error:', error);
    if (error.isQuotaError) {
      res.status(429).json({
        error: 'Google Maps Platform quota reached. Please visit the developer site.',
        isQuotaError: true,
      });
      return;
    }
    res.status(500).json({
      error: error.message || 'An error occurred while scouting stores for your occasion.',
    });
  }
});
