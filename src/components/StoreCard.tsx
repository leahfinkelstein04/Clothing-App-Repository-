import React, { useState } from 'react';
import {
  ExternalLink,
  Navigation,
  Bookmark,
  BookmarkCheck,
  Star,
  MapPin,
  Sparkles,
  Phone,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Footprints,
  Car,
} from 'lucide-react';
import type { RankedStoreRecommendation } from '../shared/types.ts';
import { formatDistanceMiles } from '../shared/geo.ts';

interface StoreCardProps {
  store: RankedStoreRecommendation;
  isSaved: boolean;
  isSelected?: boolean;
  onToggleSave: (store: RankedStoreRecommendation) => void;
  onSelect?: (store: RankedStoreRecommendation) => void;
  onShare?: (store: RankedStoreRecommendation) => void;
  index: number;
}

export const StoreCard: React.FC<StoreCardProps> = ({
  store,
  isSaved,
  isSelected,
  onToggleSave,
  onSelect,
  onShare,
  index,
}) => {
  const [showAssociateTip, setShowAssociateTip] = useState(false);

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${store.storeName}, ${store.address}`
  )}&destination_place_id=${store.placeId}`;

  return (
    <article
      id={`store-card-${store.placeId}`}
      onClick={() => onSelect && onSelect(store)}
      className={`group bg-white border p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 relative shadow-xs cursor-default ${
        isSelected
          ? 'border-[#161616] ring-1 ring-[#161616]'
          : 'border-[#DCDAD5] hover:border-[#161616]'
      }`}
    >
      <div>
        {/* Top Header: Editorial Match Title & Fit Index */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#F7F6F3]">
          <div>
            <span className="text-[10px] tracking-widest uppercase font-mono text-[#777777] block mb-1">
              Store #{index + 1} · {store.retailCategory}
            </span>
            <h4 className="font-serif text-lg sm:text-xl font-medium text-[#161616] tracking-tight">
              {store.editorialMatchTitle}
            </h4>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Suitability score percentage */}
            <div className="text-right">
              <span className="text-xs font-mono font-semibold text-[#161616] block">
                {store.suitabilityScore}% Match
              </span>
              <span className="text-[9px] uppercase tracking-wider text-[#777777] font-mono">
                Suitability
              </span>
            </div>

            {/* Share button */}
            {onShare && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onShare(store);
                }}
                className="p-2 border border-[#DCDAD5] bg-transparent text-[#555555] hover:border-[#161616] hover:text-[#161616] transition-colors"
                aria-label="Share store"
                title="Share this store"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            )}

            {/* Bookmark button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave(store);
              }}
              className={`p-2 border transition-colors ${
                isSaved
                  ? 'border-[#161616] bg-[#161616] text-white'
                  : 'border-[#DCDAD5] bg-transparent text-[#555555] hover:border-[#161616] hover:text-[#161616]'
              }`}
              aria-label={isSaved ? 'Remove from saved' : 'Save store'}
              title={isSaved ? 'Remove from saved' : 'Save store'}
            >
              {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Store Title & Address / Distance */}
        <div className="pt-4 pb-3">
          <h3 className="font-serif text-2xl sm:text-3xl font-normal text-[#161616] tracking-tight group-hover:text-[#333333] transition-colors mb-2">
            {store.storeName}
          </h3>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#555555]">
            <span className="font-mono font-semibold text-[#161616]">
              {formatDistanceMiles(store.distanceMiles)} away
            </span>

            {/* Estimated Travel */}
            {store.estimatedTravel && (
              <>
                <span aria-hidden="true" className="text-[#DCDAD5]">·</span>
                <span className="inline-flex items-center gap-1 font-mono text-[#777777]">
                  {store.estimatedTravel.walkingMinutes ? (
                    <>
                      <Footprints className="w-3 h-3" />
                      <span>~{store.estimatedTravel.walkingMinutes} min walk</span>
                    </>
                  ) : (
                    <>
                      <Car className="w-3 h-3" />
                      <span>~{store.estimatedTravel.drivingMinutes} min drive</span>
                    </>
                  )}
                </span>
              </>
            )}

            <span aria-hidden="true" className="text-[#DCDAD5]">·</span>
            <span className="truncate max-w-xs sm:max-w-md">{store.address}</span>
          </div>

          {/* Ratings & Price tier unboxed metadata */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#666666] mt-2">
            {store.rating && (
              <div className="flex items-center gap-1 font-mono text-[#161616]">
                <Star className="w-3.5 h-3.5 fill-[#161616] text-[#161616]" />
                <span>{store.rating.toFixed(1)}</span>
                {store.userRatingCount && (
                  <span className="text-[#777777]">({store.userRatingCount})</span>
                )}
              </div>
            )}
            {store.rating && <span aria-hidden="true" className="text-[#DCDAD5]">·</span>}
            <span className="font-mono">{store.priceLevelDisplay}</span>
          </div>
        </div>

        {/* Editorial Reasoning Box */}
        <div className="mt-3 p-4 bg-[#F7F6F3] border border-[#EBE9E4] space-y-2.5">
          <div className="space-y-1">
            <span className="text-[10px] tracking-widest uppercase font-mono text-[#777777] block">
              Why It Fits This Occasion
            </span>
            <p className="text-xs sm:text-sm text-[#222222] leading-relaxed">
              {store.whyItFits}
            </p>
          </div>

          <div className="pt-2 border-t border-[#DCDAD5]/60">
            <span className="text-[10px] tracking-widest uppercase font-mono text-[#777777] block mb-0.5">
              What To Look For
            </span>
            <p className="text-xs font-medium text-[#161616]">
              {store.whatToLookFor}
            </p>
          </div>

          {/* Interactive Styling Brief for Associate */}
          {store.associatePrompt && (
            <div className="pt-2 border-t border-[#DCDAD5]/60">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAssociateTip((prev) => !prev);
                }}
                className="text-[11px] font-mono tracking-wider uppercase text-[#555555] hover:text-[#161616] flex items-center justify-between w-full transition-colors pt-0.5"
              >
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-3 h-3 text-[#161616]" />
                  <span>What to ask the store associate</span>
                </span>
                {showAssociateTip ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {showAssociateTip && (
                <div className="mt-2 p-2.5 bg-white border border-[#DCDAD5] text-xs text-[#333333] italic leading-relaxed animate-in fade-in duration-150">
                  "{store.associatePrompt}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card Actions: Website & Directions */}
      <div className="pt-6 mt-4 border-t border-[#F7F6F3] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {store.websiteUri ? (
            <a
              href={store.websiteUri}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#161616] hover:underline"
            >
              <span>Visit Website</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <span className="text-xs text-[#888888] font-mono">Website not listed</span>
          )}

          {store.nationalPhoneNumber && (
            <>
              <span className="text-[#DCDAD5]">·</span>
              <a
                href={`tel:${store.nationalPhoneNumber}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-xs text-[#555555] hover:text-[#161616]"
              >
                <Phone className="w-3 h-3" />
                <span>{store.nationalPhoneNumber}</span>
              </a>
            </>
          )}
        </div>

        {/* Get Directions CTA */}
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium tracking-wider uppercase bg-[#161616] text-white hover:bg-[#333333] transition-colors shrink-0"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Directions</span>
        </a>
      </div>
    </article>
  );
};
