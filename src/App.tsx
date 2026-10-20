import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header.tsx';
import { QuotaBanner } from './components/QuotaBanner.tsx';
import { HeroSearch } from './components/HeroSearch.tsx';
import { LocationControl, PRESET_LOCATIONS } from './components/LocationControl.tsx';
import { PreferencesPanel } from './components/PreferencesPanel.tsx';
import { ResultsView } from './components/ResultsView.tsx';
import { SavedStoresModal } from './components/SavedStoresModal.tsx';
import { EditorialGuideModal } from './components/EditorialGuideModal.tsx';
import { Footer } from './components/Footer.tsx';
import type {
  BudgetTier,
  ClothingFocus,
  RankedStoreRecommendation,
  RetailCategoryPreference,
  ScoutSearchRequest,
  ScoutSearchResponse,
  SearchCoordinates,
  StyleVibe,
} from './shared/types.ts';
import { AlertCircle, Loader2 } from 'lucide-react';

const LOCAL_STORAGE_SAVED_KEY = 'occasion_scout_saved_stores_v1';

export default function App() {
  // Search parameters state
  const [occasion, setOccasion] = useState('An outdoor wedding in November');
  const [location, setLocation] = useState<SearchCoordinates>(PRESET_LOCATIONS[0]);
  const [radiusMiles, setRadiusMiles] = useState<1 | 3 | 5 | 10 | 25>(5);

  // Preference filters state
  const [clothingFocus, setClothingFocus] = useState<ClothingFocus>('any');
  const [style, setStyle] = useState<StyleVibe>('any');
  const [dressCode, setDressCode] = useState('');
  const [budget, setBudget] = useState<BudgetTier>('any');
  const [categoryPreference, setCategoryPreference] = useState<RetailCategoryPreference>('any');
  const [showPreferences, setShowPreferences] = useState(false);

  // Search execution & results state
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resultsData, setResultsData] = useState<ScoutSearchResponse | null>(null);

  // Modals state
  const [isSavedOpen, setIsSavedOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [savedStores, setSavedStores] = useState<RankedStoreRecommendation[]>([]);

  const resultsRef = useRef<HTMLDivElement>(null);
  const searchSectionRef = useRef<HTMLDivElement>(null);

  // Load saved stores from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_SAVED_KEY);
      if (stored) {
        setSavedStores(JSON.parse(stored));
      }
    } catch {
      // Fallback gracefully
    }
  }, []);

  // Save stores to local storage on update
  const persistSavedStores = (updated: RankedStoreRecommendation[]) => {
    setSavedStores(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_SAVED_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
  };

  const handleToggleSave = (store: RankedStoreRecommendation) => {
    const exists = savedStores.some((s) => s.placeId === store.placeId);
    let updated: RankedStoreRecommendation[];
    if (exists) {
      updated = savedStores.filter((s) => s.placeId !== store.placeId);
    } else {
      updated = [...savedStores, store];
    }
    persistSavedStores(updated);
  };

  const handleRemoveSaved = (placeId: string) => {
    const updated = savedStores.filter((s) => s.placeId !== placeId);
    persistSavedStores(updated);
  };

  const handleClearAllSaved = () => {
    persistSavedStores([]);
  };

  const handleResetPreferences = () => {
    setClothingFocus('any');
    setStyle('any');
    setDressCode('');
    setBudget('any');
    setCategoryPreference('any');
  };

  // Generalized search executor
  const executeSearch = async (override?: {
    occasion?: string;
    location?: SearchCoordinates;
    radius?: 1 | 3 | 5 | 10 | 25;
    clothing?: ClothingFocus;
    style?: StyleVibe;
    dressCode?: string;
    budget?: BudgetTier;
    category?: RetailCategoryPreference;
  }) => {
    const activeOccasion = (override?.occasion ?? occasion).trim();
    if (!activeOccasion) return;

    const activeLoc = override?.location ?? location;
    const activeRadius = override?.radius ?? radiusMiles;
    const activeClothing = override?.clothing ?? clothingFocus;
    const activeStyle = override?.style ?? style;
    const activeDressCode = override?.dressCode ?? dressCode;
    const activeBudget = override?.budget ?? budget;
    const activeCategory = override?.category ?? categoryPreference;

    setError(null);
    setIsLoading(true);
    setLoadingStep('Locating authentic physical stores in your radius...');

    try {
      const payload: ScoutSearchRequest = {
        occasion: activeOccasion,
        lat: activeLoc.lat,
        lng: activeLoc.lng,
        radiusMiles: activeRadius,
        locationLabel: activeLoc.label,
        clothingFocus: activeClothing,
        style: activeStyle,
        dressCode: activeDressCode.trim() || undefined,
        budget: activeBudget,
        categoryPreference: activeCategory,
      };

      // Progress step timer simulation for smooth UX
      const timer = setTimeout(() => {
        setLoadingStep('Matching and styling stores with Gemini AI...');
      }, 1400);

      const response = await fetch('/api/scout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      clearTimeout(timer);

      const data = await response.json();

      if (!response.ok) {
        if (data.isQuotaError) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        throw new Error(data.error || 'Failed to scout stores.');
      }

      setResultsData(data as ScoutSearchResponse);

      // Update URL query parameters for instant shareability/refresh
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('occasion', activeOccasion);
        url.searchParams.set('lat', activeLoc.lat.toString());
        url.searchParams.set('lng', activeLoc.lng.toString());
        url.searchParams.set('radius', activeRadius.toString());
        if (activeLoc.label) {
          url.searchParams.set('loc', activeLoc.label);
        }
        window.history.replaceState({}, '', url.toString());
      } catch {
        // Ignore URL replace errors in hermetic environments
      }

      // Smooth scroll down to results
      setTimeout(() => {
        // Check if there was a specific store in the URL to target
        const params = new URLSearchParams(window.location.search);
        const storeTargetId = params.get('store');
        if (storeTargetId) {
          const storeElement = document.getElementById(`store-card-${storeTargetId}`);
          if (storeElement) {
            storeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
          }
        }
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } catch (err: unknown) {
      setError((err as Error).message || 'An unexpected error occurred while scouting.');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  // Main search scout handler from form
  const handleScoutSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    executeSearch();
  };

  // Parse deep-link URL parameters on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const params = new URLSearchParams(window.location.search);
      const occasionParam = params.get('occasion');
      const latParam = params.get('lat');
      const lngParam = params.get('lng');
      const radiusParam = params.get('radius');
      const locParam = params.get('loc');
      const clothingParam = params.get('clothing') as ClothingFocus | null;
      const styleParam = params.get('style') as StyleVibe | null;
      const budgetParam = params.get('budget') as BudgetTier | null;
      const categoryParam = params.get('category') as RetailCategoryPreference | null;
      const dressCodeParam = params.get('dressCode');

      if (occasionParam) {
        setOccasion(occasionParam);

        let parsedLoc = location;
        if (latParam && lngParam && !isNaN(Number(latParam)) && !isNaN(Number(lngParam))) {
          parsedLoc = {
            lat: Number(latParam),
            lng: Number(lngParam),
            label: locParam || `${Number(latParam).toFixed(3)}, ${Number(lngParam).toFixed(3)}`,
            source: 'manual',
          };
          setLocation(parsedLoc);
        }

        let parsedRadius = radiusMiles;
        if (radiusParam && [1, 3, 5, 10, 25].includes(Number(radiusParam))) {
          parsedRadius = Number(radiusParam) as 1 | 3 | 5 | 10 | 25;
          setRadiusMiles(parsedRadius);
        }

        if (clothingParam) setClothingFocus(clothingParam);
        if (styleParam) setStyle(styleParam);
        if (budgetParam) setBudget(budgetParam);
        if (categoryParam) setCategoryPreference(categoryParam);
        if (dressCodeParam) setDressCode(dressCodeParam);

        // Auto-execute search from deep-link
        executeSearch({
          occasion: occasionParam,
          location: parsedLoc,
          radius: parsedRadius,
          clothing: clothingParam || 'any',
          style: styleParam || 'any',
          budget: budgetParam || 'any',
          category: categoryParam || 'any',
          dressCode: dressCodeParam || '',
        });
      }
    } catch (err) {
      console.warn('Error reading deep-link search parameters:', err);
    }
  }, []);

  const handleExpandRadius = (newRadius: 1 | 3 | 5 | 10 | 25) => {
    setRadiusMiles(newRadius);
    setTimeout(() => {
      executeSearch({ radius: newRadius });
    }, 50);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F6F3] text-[#161616]">
      {/* Tier 1 / Tier 2 Demo Key Quota Defense Banner */}
      <QuotaBanner />

      {/* Top Navigation Bar */}
      <Header
        savedCount={savedStores.length}
        onOpenSaved={() => setIsSavedOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        onScrollToSearch={() => searchSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
      />

      <main className="flex-1">
        {/* Hero & Search Form Section */}
        <div ref={searchSectionRef}>
          <HeroSearch
            occasion={occasion}
            onOccasionChange={setOccasion}
            onSubmit={handleScoutSubmit}
            isLoading={isLoading}
            loadingStep={loadingStep}
            showPreferences={showPreferences}
            onTogglePreferences={() => setShowPreferences((prev) => !prev)}
          />
        </div>

        {/* Location & Optional Filters Container */}
        <div className="max-w-4xl mx-auto px-4 space-y-4 mb-8">
          {/* Real GPS & Radius Control */}
          <LocationControl
            location={location}
            radiusMiles={radiusMiles}
            onLocationChange={setLocation}
            onRadiusChange={(r) => {
              setRadiusMiles(r);
              // If results already exist, user expects radius change to update discovery
              if (resultsData) {
                setTimeout(() => executeSearch({ radius: r }), 50);
              }
            }}
          />

          {/* Preferences Panel (Collapsible) */}
          {showPreferences && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <PreferencesPanel
                clothingFocus={clothingFocus}
                style={style}
                dressCode={dressCode}
                budget={budget}
                categoryPreference={categoryPreference}
                onClothingFocusChange={setClothingFocus}
                onStyleChange={setStyle}
                onDressCodeChange={setDressCode}
                onBudgetChange={setBudget}
                onCategoryPreferenceChange={setCategoryPreference}
                onReset={handleResetPreferences}
              />
            </div>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="max-w-4xl mx-auto px-4 mb-8">
            <div className="p-4 sm:p-5 bg-white border border-red-300 text-red-950 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">{error}</p>
                <button
                  type="button"
                  onClick={() => executeSearch()}
                  className="text-xs font-semibold text-red-800 underline hover:text-red-950"
                >
                  Retry Search
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading Progress State */}
        {isLoading && (
          <div className="py-16 text-center max-w-md mx-auto px-4 space-y-4">
            <div className="w-8 h-8 mx-auto border-2 border-[#161616] border-t-transparent rounded-full animate-spin" />
            <div className="space-y-1">
              <p className="font-serif text-xl text-[#161616]">
                {loadingStep || 'Scouting Fashion Retailers...'}
              </p>
              <p className="text-xs font-mono text-[#777777]">
                Querying Google Places & Ranking with Gemini AI
              </p>
            </div>
          </div>
        )}

        {/* Results Section */}
        {resultsData && !isLoading && (
          <div ref={resultsRef}>
            <ResultsView
              data={resultsData}
              savedStoreIds={new Set(savedStores.map((s) => s.placeId))}
              onToggleSave={handleToggleSave}
              onExpandRadius={handleExpandRadius}
              onRetry={() => executeSearch()}
              onSwitchOccasion={(newOccasion) => {
                setOccasion(newOccasion);
                setTimeout(() => {
                  executeSearch({ occasion: newOccasion });
                }, 50);
              }}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenSaved={() => setIsSavedOpen(true)}
      />

      {/* Saved Stores Modal */}
      <SavedStoresModal
        isOpen={isSavedOpen}
        onClose={() => setIsSavedOpen(false)}
        savedStores={savedStores}
        onRemove={handleRemoveSaved}
        onClearAll={handleClearAllSaved}
      />

      {/* Editorial Guide Modal */}
      <EditorialGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
