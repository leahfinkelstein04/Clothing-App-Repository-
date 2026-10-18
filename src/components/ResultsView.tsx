import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  ArrowUpDown,
  Filter,
  Compass,
  AlertCircle,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import type { RankedStoreRecommendation, ScoutSearchResponse } from '../shared/types.ts';
import { StoreCard } from './StoreCard.tsx';

interface ResultsViewProps {
  data: ScoutSearchResponse;
  savedStoreIds: Set<string>;
  onToggleSave: (store: RankedStoreRecommendation) => void;
  onExpandRadius: (newRadius: 1 | 3 | 5 | 10 | 25) => void;
  onRetry: () => void;
}

type SortOption = 'match' | 'distance' | 'rating';
type CategoryFilter = 'all' | 'boutique' | 'department' | 'high_rating';

export const ResultsView: React.FC<ResultsViewProps> = ({
  data,
  savedStoreIds,
  onToggleSave,
  onExpandRadius,
  onRetry,
}) => {
  const [sortBy, setSortBy] = useState<SortOption>('match');
  const [filterBy, setFilterBy] = useState<CategoryFilter>('all');

  // Filter and sort recommendations
  const displayedStores = useMemo(() => {
    let list = [...data.recommendations];

    // Filter
    if (filterBy === 'boutique') {
      list = list.filter((s) =>
        s.retailCategory.toLowerCase().includes('boutique') ||
        s.editorialMatchTitle.toLowerCase().includes('boutique')
      );
    } else if (filterBy === 'department') {
      list = list.filter((s) =>
        s.retailCategory.toLowerCase().includes('department') ||
        s.editorialMatchTitle.toLowerCase().includes('department')
      );
    } else if (filterBy === 'high_rating') {
      list = list.filter((s) => (s.rating || 0) >= 4.0);
    }

    // Sort
    if (sortBy === 'distance') {
      list.sort((a, b) => a.distanceMiles - b.distanceMiles);
    } else if (sortBy === 'rating') {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else {
      // Default: match score descending, then distance ascending
      list.sort((a, b) => {
        if (b.suitabilityScore !== a.suitabilityScore) {
          return b.suitabilityScore - a.suitabilityScore;
        }
        return a.distanceMiles - b.distanceMiles;
      });
    }

    return list;
  }, [data.recommendations, sortBy, filterBy]);

  // Handle empty state within radius
  if (data.recommendations.length === 0) {
    return (
      <section className="py-12 max-w-3xl mx-auto px-4 text-center">
        <div className="bg-white border border-[#DCDAD5] p-8 sm:p-12 space-y-5">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#F7F6F3] flex items-center justify-center text-[#161616]">
            <Compass className="w-6 h-6 stroke-[1.5]" />
          </div>

          <h3 className="font-serif text-2xl sm:text-3xl text-[#161616]">
            No Stores Found Within {data.radiusMiles} Mile{data.radiusMiles === 1 ? '' : 's'}
          </h3>

          <p className="text-sm text-[#555555] max-w-md mx-auto leading-relaxed">
            {data.disclaimer ||
              `We searched within a strict ${data.radiusMiles}-mile radius of ${data.searchCenter.label}, but found no physical clothing retailers matching your criteria.`}
          </p>

          {/* Honest radius expansion recommendation */}
          <div className="pt-3 space-y-3">
            <span className="text-[11px] font-mono tracking-widest uppercase text-[#777777] block">
              Expand Search Radius
            </span>
            <div className="flex flex-wrap justify-center gap-2">
              {([3, 5, 10, 25] as const)
                .filter((r) => r > data.radiusMiles)
                .map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => onExpandRadius(r)}
                    className="px-4 py-2 text-xs font-medium tracking-wider uppercase border border-[#161616] bg-white text-[#161616] hover:bg-[#161616] hover:text-white transition-colors"
                  >
                    Search within {r} miles
                  </button>
                ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Editorial Intelligence Briefing Bar */}
      <div className="bg-white border border-[#DCDAD5] p-6 sm:p-8 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#F7F6F3]">
          <div>
            <span className="text-[10px] tracking-widest uppercase font-mono text-[#777777] block mb-1">
              Gemini Style Interpretation
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#161616] tracking-tight">
              {data.analysis.interpretedOccasion}
            </h2>
          </div>

          {/* Formality and center badge */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <div className="space-y-0.5 text-left md:text-right">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#777777] block">
                Formality Standard
              </span>
              <span className="font-serif text-base font-semibold text-[#161616]">
                {data.analysis.formalityLevel}
              </span>
            </div>
            <span aria-hidden="true" className="hidden md:inline text-[#DCDAD5]">|</span>
            <div className="space-y-0.5 text-left md:text-right">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#777777] block">
                Search Radius
              </span>
              <span className="font-mono text-xs font-medium text-[#161616]">
                {data.radiusMiles} mi · {data.searchCenter.label.split(',')[0]}
              </span>
            </div>
          </div>
        </div>

        {/* Style directions unboxed text per Zero-Pill discipline */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#555555]">
          <span className="font-mono text-[#161616] font-medium">Style Directives:</span>
          {data.analysis.styleKeywords.map((kw, i) => (
            <React.Fragment key={kw}>
              <span className="text-[#333333]">{kw}</span>
              {i < data.analysis.styleKeywords.length - 1 && (
                <span aria-hidden="true" className="text-[#DCDAD5]">·</span>
              )}
            </React.Fragment>
          ))}
          {data.analysis.seasonalContext && (
            <>
              <span aria-hidden="true" className="text-[#DCDAD5]">·</span>
              <span className="italic text-[#777777]">{data.analysis.seasonalContext}</span>
            </>
          )}
        </div>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#DCDAD5]">
        <div className="flex items-center gap-2">
          <span className="font-serif text-lg text-[#161616]">
            {displayedStores.length} Curated Store{displayedStores.length === 1 ? '' : 's'}
          </span>
          <span className="text-xs font-mono text-[#777777]">
            (Found in {data.radiusMiles}-mi radius)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Filter tabs */}
          <div className="flex items-center gap-1 p-1 bg-white border border-[#DCDAD5] text-xs">
            <button
              onClick={() => setFilterBy('all')}
              className={`px-2.5 py-1 transition-colors ${
                filterBy === 'all'
                  ? 'bg-[#161616] text-white'
                  : 'text-[#666666] hover:text-[#161616]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterBy('boutique')}
              className={`px-2.5 py-1 transition-colors ${
                filterBy === 'boutique'
                  ? 'bg-[#161616] text-white'
                  : 'text-[#666666] hover:text-[#161616]'
              }`}
            >
              Boutiques
            </button>
            <button
              onClick={() => setFilterBy('department')}
              className={`px-2.5 py-1 transition-colors ${
                filterBy === 'department'
                  ? 'bg-[#161616] text-white'
                  : 'text-[#666666] hover:text-[#161616]'
              }`}
            >
              Department
            </button>
            <button
              onClick={() => setFilterBy('high_rating')}
              className={`px-2.5 py-1 transition-colors ${
                filterBy === 'high_rating'
                  ? 'bg-[#161616] text-white'
                  : 'text-[#666666] hover:text-[#161616]'
              }`}
            >
              ★ 4.0+
            </button>
          </div>

          {/* Sort dropdown/button */}
          <div className="flex items-center gap-1.5 text-xs text-[#555555]">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#161616]" />
            <span className="font-mono text-[10px] uppercase text-[#777777]">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-white border border-[#DCDAD5] px-2.5 py-1 text-xs text-[#161616] focus:outline-none focus:border-[#161616]"
            >
              <option value="match">Editorial Match</option>
              <option value="distance">Proximity (Closest)</option>
              <option value="rating">Highest Rating</option>
            </select>
          </div>
        </div>
      </div>

      {/* Discovered Stores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {displayedStores.map((store, idx) => (
          <StoreCard
            key={store.placeId}
            store={store}
            index={idx}
            isSaved={savedStoreIds.has(store.placeId)}
            onToggleSave={onToggleSave}
          />
        ))}
      </div>

      {/* Editorial Disclaimer & Data Verification Note */}
      <div className="p-6 bg-white border border-[#DCDAD5] space-y-2 text-xs text-[#666666] leading-relaxed">
        <div className="flex items-center gap-2 text-[#161616] font-medium">
          <Sparkles className="w-4 h-4 text-[#161616]" />
          <span className="uppercase tracking-widest text-[10px] font-mono">
            Occasion Scout Editorial Integrity & Data Notice
          </span>
        </div>
        <p>
          {data.disclaimer}
        </p>
        <p className="text-[11px] text-[#888888]">
          Location and physical store data provided via Google Maps Platform Places API (New). Ratings, operating status, and addresses reflect authentic records at time of query.
        </p>
      </div>
    </section>
  );
};
