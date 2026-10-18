/**
 * Server-Side Gemini AI Engine for Occasion Scout
 * Uses @google/genai SDK with gemini-3.8-flash
 */

import { GoogleGenAI, Type } from '@google/genai';
import type {
  BudgetTier,
  ClothingFocus,
  DiscoveredPlace,
  OccasionAnalysis,
  RankedStoreRecommendation,
  RetailCategoryPreference,
  StyleVibe,
} from '../shared/types.ts';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function formatPriceLevel(
  priceLevel?:
    | 'PRICE_LEVEL_FREE'
    | 'PRICE_LEVEL_INEXPENSIVE'
    | 'PRICE_LEVEL_MODERATE'
    | 'PRICE_LEVEL_EXPENSIVE'
    | 'PRICE_LEVEL_VERY_EXPENSIVE'
): string {
  switch (priceLevel) {
    case 'PRICE_LEVEL_INEXPENSIVE':
      return '$ (Accessible)';
    case 'PRICE_LEVEL_MODERATE':
      return '$$ (Moderate)';
    case 'PRICE_LEVEL_EXPENSIVE':
      return '$$$ (Contemporary / Premium)';
    case 'PRICE_LEVEL_VERY_EXPENSIVE':
      return '$$$$ (Luxury / Designer)';
    default:
      return 'Pricing not verified';
  }
}

/**
 * Step 1: Interpret occasion, style, formality, and generate store-search queries
 */
export async function analyzeOccasionIntent(params: {
  occasion: string;
  clothingFocus?: ClothingFocus;
  style?: StyleVibe;
  dressCode?: string;
  budget?: BudgetTier;
  categoryPreference?: RetailCategoryPreference;
}): Promise<OccasionAnalysis> {
  const ai = getGeminiClient();

  const prompt = `
You are a senior fashion director and wardrobe consultant for Occasion Scout.
Analyze the user's event description and parameters:
- Event description: "${params.occasion}"
- Clothing focus: "${params.clothingFocus || 'any'}"
- Style vibe: "${params.style || 'any'}"
- Explicit dress code: "${params.dressCode || 'none specified'}"
- Budget preference: "${params.budget || 'any'}"
- Retail category preference: "${params.categoryPreference || 'any'}"

Instructions:
1. Accurately interpret the event even with typos (e.g. "semi formel weddng", "job intervew", "festivl").
2. Determine the formality level (e.g., Casual, Smart Casual, Business Formal, Cocktail, Black Tie Optional, Resort Chic).
3. If seasonal or weather context is mentioned (e.g., "in November", "hot summer evening in Miami"), note it; if not mentioned, leave seasonalContext empty or neutral.
4. Provide 3-5 authentic physical store categories (e.g. "Contemporary Boutiques", "Tailored Suit Specialists", "Luxury Department Stores", "Curated Vintage").
5. Provide 3-5 concise style keywords.
6. Provide 2-4 search queries for Google Places discovery (e.g., "women's cocktail dress boutique", "men's tailored suits", "designer clothing store").

Output must be strict JSON matching the schema.
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt,
    config: {
      temperature: 0.2,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          interpretedOccasion: {
            type: Type.STRING,
            description: 'Clear, polished interpretation of the event',
          },
          formalityLevel: {
            type: Type.STRING,
            description: 'E.g., Cocktail / Semi-Formal, Casual Elevated, Black Tie',
          },
          seasonalContext: {
            type: Type.STRING,
            description: 'Seasonal or climate nuances if specified, or empty string',
          },
          recommendedStoreTypes: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Types of retail stores suitable for this occasion',
          },
          styleKeywords: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Key aesthetic descriptors',
          },
          searchTerms: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Keywords for Places API store discovery',
          },
        },
        required: [
          'interpretedOccasion',
          'formalityLevel',
          'recommendedStoreTypes',
          'styleKeywords',
          'searchTerms',
        ],
      },
    },
  });

  const text = response.text?.trim() || '{}';
  try {
    const parsed = JSON.parse(text) as OccasionAnalysis;
    return parsed;
  } catch (err) {
    console.error('Failed to parse occasion analysis JSON:', text, err);
    return {
      interpretedOccasion: params.occasion,
      formalityLevel: 'Smart Casual / Versatile',
      recommendedStoreTypes: ['Clothing Boutiques', 'Department Stores', 'Apparel Retailers'],
      styleKeywords: ['Versatile', 'Tailored', 'Contemporary'],
      searchTerms: ['clothing store', 'fashion boutique'],
    };
  }
}

/**
 * Step 2: Rank actual discovered physical stores for occasion suitability
 * ANTI-HALLUCINATION GUARANTEE:
 * Gemini only scores and explains stores provided in discoveredStores.
 * Server strictly verifies every placeId returned.
 */
export async function rankDiscoveredStores(params: {
  analysis: OccasionAnalysis;
  discoveredStores: DiscoveredPlace[];
  occasion: string;
  clothingFocus?: ClothingFocus;
  style?: StyleVibe;
  budget?: BudgetTier;
}): Promise<RankedStoreRecommendation[]> {
  const { analysis, discoveredStores, occasion, clothingFocus, style, budget } = params;

  if (!discoveredStores || discoveredStores.length === 0) {
    return [];
  }

  const ai = getGeminiClient();

  // Create candidate records for Gemini prompt
  const storeCandidates = discoveredStores.map((s, idx) => ({
    placeId: s.id,
    index: idx + 1,
    name: s.name,
    address: s.formattedAddress,
    distanceMiles: s.distanceMiles,
    types: s.types.slice(0, 5),
    priceLevel: s.priceLevel || 'PRICE_LEVEL_UNSPECIFIED',
    rating: s.rating,
  }));

  const prompt = `
You are a senior fashion stylist and retail editor evaluating real physical stores for an occasion.

Occasion: "${occasion}"
Analysis:
- Formality: ${analysis.formalityLevel}
- Interpreted Occasion: ${analysis.interpretedOccasion}
- Desired Style: ${style || 'flexible'}
- Clothing Focus: ${clothingFocus || 'complete look'}
- Target Budget: ${budget || 'flexible'}

Here are the ${storeCandidates.length} real physical stores discovered nearby:
${JSON.stringify(storeCandidates, null, 2)}

STRICT RULES:
1. You may ONLY rank and comment on the stores provided in the list above. DO NOT invent store names or addresses.
2. For each store, return the exact 'placeId' from the input list.
3. Provide:
   - 'editorialMatchTitle': A sophisticated, short title describing its retail persona (e.g., "Curated Evening Boutique", "Classic Tailoring Destination", "High-End Department Store").
   - 'whyItFits': Exactly ONE concrete, articulate sentence explaining why this store fits the shopper's occasion, considering style, dress code, and retail type.
   - 'whatToLookFor': Concise list of 2-3 specific garment/item types to shop for (e.g., "Cocktail midi dresses, sculptural earrings, block heels").
   - 'suitabilityScore': Integer from 40 to 98 based on how well the store matches the formality and style.
   - 'retailCategory': A clean retail categorization (e.g., "Designer Boutique", "Men's Tailoring", "Contemporary Department Store", "Vintage Consignment").
4. Label uncertainty: NEVER claim a specific product, brand, color, size, or price is currently in stock. Frame your advice around what the store typically carries.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              placeId: { type: Type.STRING },
              suitabilityScore: { type: Type.INTEGER },
              editorialMatchTitle: { type: Type.STRING },
              whyItFits: { type: Type.STRING },
              whatToLookFor: { type: Type.STRING },
              retailCategory: { type: Type.STRING },
            },
            required: [
              'placeId',
              'suitabilityScore',
              'editorialMatchTitle',
              'whyItFits',
              'whatToLookFor',
              'retailCategory',
            ],
          },
        },
      },
    });

    const text = response.text?.trim() || '[]';
    const rankedRaw = JSON.parse(text) as Array<{
      placeId: string;
      suitabilityScore: number;
      editorialMatchTitle: string;
      whyItFits: string;
      whatToLookFor: string;
      retailCategory: string;
    }>;

    // Build map of authentic discovered places
    const placeMap = new Map<string, DiscoveredPlace>();
    for (const place of discoveredStores) {
      placeMap.set(place.id, place);
    }

    const verifiedRanked: RankedStoreRecommendation[] = [];
    const usedPlaceIds = new Set<string>();

    for (const r of rankedRaw) {
      const realStore = placeMap.get(r.placeId);
      // REJECT any AI recommendation that does not match an actual discovered store ID
      if (!realStore) {
        console.warn(`[Security Check] Discarding hallucinated/unmatched placeId from AI: ${r.placeId}`);
        continue;
      }

      if (usedPlaceIds.has(r.placeId)) continue;
      usedPlaceIds.add(r.placeId);

      verifiedRanked.push({
        placeId: realStore.id,
        storeName: realStore.name,
        address: realStore.formattedAddress,
        distanceMiles: realStore.distanceMiles,
        suitabilityScore: Math.min(Math.max(r.suitabilityScore, 40), 99),
        editorialMatchTitle: r.editorialMatchTitle,
        whyItFits: r.whyItFits,
        whatToLookFor: r.whatToLookFor,
        retailCategory: r.retailCategory,
        priceLevelDisplay: formatPriceLevel(realStore.priceLevel),
        websiteUri: realStore.websiteUri,
        nationalPhoneNumber: realStore.nationalPhoneNumber,
        rating: realStore.rating,
        userRatingCount: realStore.userRatingCount,
        lat: realStore.lat,
        lng: realStore.lng,
      });
    }

    // Append any discovered stores that Gemini missed
    for (const place of discoveredStores) {
      if (!usedPlaceIds.has(place.id)) {
        verifiedRanked.push({
          placeId: place.id,
          storeName: place.name,
          address: place.formattedAddress,
          distanceMiles: place.distanceMiles,
          suitabilityScore: 65,
          editorialMatchTitle: 'Local Fashion Retailer',
          whyItFits: `Established local apparel store offering options adaptable to ${analysis.interpretedOccasion}.`,
          whatToLookFor: 'Seasonal pieces and wardrobe essentials suited for the event.',
          retailCategory: 'Apparel & Accessories',
          priceLevelDisplay: formatPriceLevel(place.priceLevel),
          websiteUri: place.websiteUri,
          nationalPhoneNumber: place.nationalPhoneNumber,
          rating: place.rating,
          userRatingCount: place.userRatingCount,
          lat: place.lat,
          lng: place.lng,
        });
      }
    }

    // Sort primarily by suitabilityScore descending, then distance ascending
    verifiedRanked.sort((a, b) => {
      if (b.suitabilityScore !== a.suitabilityScore) {
        return b.suitabilityScore - a.suitabilityScore;
      }
      return a.distanceMiles - b.distanceMiles;
    });

    return verifiedRanked;
  } catch (err) {
    console.error('Error during Gemini store ranking, falling back to heuristic ranking:', err);

    // Graceful fallback to verified stores
    return discoveredStores.map((s, idx) => ({
      placeId: s.id,
      storeName: s.name,
      address: s.formattedAddress,
      distanceMiles: s.distanceMiles,
      suitabilityScore: Math.max(90 - idx * 4, 55),
      editorialMatchTitle: 'Local Fashion Retailer',
      whyItFits: `Verified local retailer carrying fashion selections appropriate for ${analysis.interpretedOccasion}.`,
      whatToLookFor: 'Occasion-appropriate garments and complementary accessories.',
      retailCategory: 'Apparel Boutique',
      priceLevelDisplay: formatPriceLevel(s.priceLevel),
      websiteUri: s.websiteUri,
      nationalPhoneNumber: s.nationalPhoneNumber,
      rating: s.rating,
      userRatingCount: s.userRatingCount,
      lat: s.lat,
      lng: s.lng,
    }));
  }
}
