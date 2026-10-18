import React from 'react';
import { ArrowRight, Sparkles, SlidersHorizontal, Loader2 } from 'lucide-react';

interface HeroSearchProps {
  occasion: string;
  onOccasionChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  loadingStep: string;
  showPreferences: boolean;
  onTogglePreferences: () => void;
}

export const EDITORIAL_SUGGESTIONS = [
  'Wedding Guest',
  'Job Interview',
  'Graduation',
  'Birthday Night Out',
  'Formal',
  'Concert',
  'Vacation',
  'Date Night',
];

export const HeroSearch: React.FC<HeroSearchProps> = ({
  occasion,
  onOccasionChange,
  onSubmit,
  isLoading,
  loadingStep,
  showPreferences,
  onTogglePreferences,
}) => {
  return (
    <section className="pt-10 pb-8 sm:pt-16 sm:pb-12 text-center max-w-4xl mx-auto px-4">
      {/* Editorial Kicker */}
      <div className="inline-flex items-center gap-2 mb-4 text-xs tracking-widest uppercase font-mono text-[#666666]">
        <span>Occasion Scout</span>
        <span aria-hidden="true">·</span>
        <span>Fashion Intelligence</span>
      </div>

      {/* Hero Headline in Cormorant Garamond */}
      <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-light tracking-tight text-[#161616] leading-[1.08] mb-4 text-balance">
        WHAT’S THE OCCASION?
      </h1>

      <p className="text-sm sm:text-base md:text-lg text-[#555555] font-light max-w-xl mx-auto mb-8 sm:mb-10 text-balance">
        The right look starts with the right store. Discover authentic nearby fashion retailers curated and ranked for your exact event.
      </p>

      {/* Main Search Input Form */}
      <form onSubmit={onSubmit} className="max-w-2xl mx-auto space-y-4">
        <div className="relative group shadow-sm bg-white border border-[#161616] transition-all duration-200 focus-within:ring-2 focus-within:ring-[#161616]/10">
          <input
            type="text"
            value={occasion}
            onChange={(e) => onOccasionChange(e.target.value)}
            placeholder="An outdoor wedding in November"
            className="w-full px-5 py-4 sm:py-5 text-base sm:text-lg text-[#161616] placeholder-[#888888] bg-transparent focus:outline-none pr-14"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !occasion.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 bg-[#161616] text-white flex items-center justify-center hover:bg-[#333333] transition-colors disabled:opacity-40"
            aria-label="Find stores for this occasion"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ArrowRight className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Action Controls & Filter Toggle */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <button
            type="button"
            onClick={onTogglePreferences}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 transition-colors ${
              showPreferences
                ? 'text-[#161616] font-semibold underline'
                : 'text-[#666666] hover:text-[#161616]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{showPreferences ? 'Hide Preferences' : 'Filter by Style, Category & Budget'}</span>
          </button>

          <span className="text-[11px] font-mono text-[#888888]">
            Instant AI Interpretation & Proximity Ranking
          </span>
        </div>

        {/* Tappable Editorial Quick Suggestions */}
        <div className="pt-2 text-left">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] tracking-widest uppercase font-mono text-[#777777]">
              Curated Occasions:
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {EDITORIAL_SUGGESTIONS.map((sug) => {
              const isSelected = occasion.toLowerCase() === sug.toLowerCase();
              return (
                <button
                  key={sug}
                  type="button"
                  onClick={() => onOccasionChange(sug)}
                  className={`text-xs px-3 py-1.5 border transition-colors ${
                    isSelected
                      ? 'border-[#161616] bg-[#161616] text-white'
                      : 'border-[#DCDAD5] bg-white text-[#444444] hover:border-[#161616] hover:text-[#161616]'
                  }`}
                >
                  {sug}
                </button>
              );
            })}
          </div>
        </div>

        {/* Primary Prominent Action Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading || !occasion.trim()}
            className="w-full py-4 px-8 bg-[#161616] text-white text-xs sm:text-sm font-medium tracking-widest uppercase hover:bg-[#333333] active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{loadingStep || 'Scouting Stores...'}</span>
              </>
            ) : (
              <>
                <span>FIND MY STORES</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
};
