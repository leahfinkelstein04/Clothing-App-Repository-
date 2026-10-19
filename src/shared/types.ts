/**
 * Occasion Scout — Shared Types
 */

export type ClothingFocus =
  | 'any'
  | 'outfit'
  | 'dress'
  | 'suit'
  | 'separates'
  | 'shoes'
  | 'accessories';

export type StyleVibe =
  | 'any'
  | 'classic'
  | 'trendy'
  | 'minimalist'
  | 'bold'
  | 'romantic'
  | 'vintage'
  | 'surprise';

export type BudgetTier =
  | 'any'
  | 'budget' // $
  | 'moderate' // $$
  | 'contemporary' // $$$
  | 'luxury'; // $$$$

export type RetailCategoryPreference =
  | 'any'
  | 'boutique'
  | 'department_store'
  | 'formalwear'
  | 'vintage_resale'
  | 'shoes_accessories';

export interface SearchCoordinates {
  lat: number;
  lng: number;
  label?: string;
  source: 'gps' | 'manual' | 'preset';
}

export interface ScoutSearchRequest {
  occasion: string;
  lat: number;
  lng: number;
  radiusMiles: 1 | 3 | 5 | 10 | 25;
  locationLabel?: string;
  clothingFocus?: ClothingFocus;
  style?: StyleVibe;
  dressCode?: string;
  budget?: BudgetTier;
  categoryPreference?: RetailCategoryPreference;
}

export interface DiscoveredPlace {
  id: string; // Google Place ID
  name: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  distanceMiles: number;
  types: string[];
  primaryType?: string;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: 'PRICE_LEVEL_FREE' | 'PRICE_LEVEL_INEXPENSIVE' | 'PRICE_LEVEL_MODERATE' | 'PRICE_LEVEL_EXPENSIVE' | 'PRICE_LEVEL_VERY_EXPENSIVE';
  websiteUri?: string;
  nationalPhoneNumber?: string;
  openNow?: boolean;
}

export interface RankedStoreRecommendation {
  placeId: string;
  storeName: string;
  address: string;
  distanceMiles: number;
  suitabilityScore: number; // 1-100
  editorialMatchTitle: string; // e.g. "Prime Evening Cocktail Candidate"
  whyItFits: string; // Concrete sentence
  whatToLookFor: string; // Specific item recommendations
  retailCategory: string; // e.g. "Independent Designer Boutique", "Department Store"
  priceLevelDisplay: string; // "$$", "$$$", or "Pricing not verified"
  websiteUri?: string;
  nationalPhoneNumber?: string;
  rating?: number;
  userRatingCount?: number;
  lat: number;
  lng: number;
  associatePrompt?: string; // What to ask the store sales associate
  estimatedTravel?: {
    walkingMinutes?: number;
    drivingMinutes: number;
  };
}

export interface ColorSwatch {
  name: string;
  hex: string;
}

export interface OccasionAnalysis {
  interpretedOccasion: string;
  formalityLevel: string;
  seasonalContext?: string;
  recommendedStoreTypes: string[];
  styleKeywords: string[];
  searchTerms: string[];
  colorPalette?: ColorSwatch[];
  keySilhouettes?: string[];
  relatedOccasions?: string[];
}

export interface ScoutSearchResponse {
  analysis: OccasionAnalysis;
  recommendations: RankedStoreRecommendation[];
  totalCandidatesFound: number;
  searchCenter: {
    lat: number;
    lng: number;
    label: string;
  };
  radiusMiles: number;
  disclaimer: string;
}

export interface GeocodeResponse {
  lat: number;
  lng: number;
  formattedAddress: string;
  city?: string;
  state?: string;
}
