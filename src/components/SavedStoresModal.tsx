import React from 'react';
import { X, Trash2, Navigation, ExternalLink, Bookmark, MapPin } from 'lucide-react';
import type { RankedStoreRecommendation } from '../shared/types.ts';
import { formatDistanceMiles } from '../shared/geo.ts';

interface SavedStoresModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedStores: RankedStoreRecommendation[];
  onRemove: (placeId: string) => void;
  onClearAll: () => void;
}

export const SavedStoresModal: React.FC<SavedStoresModalProps> = ({
  isOpen,
  onClose,
  savedStores,
  onRemove,
  onClearAll,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-[#F7F6F3] border border-[#161616] w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-white border-b border-[#DCDAD5] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Bookmark className="w-5 h-5 text-[#161616]" />
            <h3 className="font-serif text-2xl text-[#161616]">
              Saved Stores ({savedStores.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#555555] hover:text-[#161616] transition-colors"
            aria-label="Close saved stores modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {savedStores.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Bookmark className="w-8 h-8 text-[#A79A8C] mx-auto stroke-1" />
              <p className="font-serif text-xl text-[#333333]">No Saved Stores Yet</p>
              <p className="text-xs text-[#777777] max-w-xs mx-auto">
                Click the bookmark icon on any store card during your search to save it here for easy reference.
              </p>
            </div>
          ) : (
            savedStores.map((store) => {
              const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                `${store.storeName}, ${store.address}`
              )}&destination_place_id=${store.placeId}`;

              return (
                <div
                  key={store.placeId}
                  className="bg-white border border-[#DCDAD5] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:border-[#161616]"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] tracking-widest uppercase font-mono text-[#777777]">
                      {store.retailCategory} · {store.editorialMatchTitle}
                    </span>
                    <h4 className="font-serif text-xl font-medium text-[#161616]">
                      {store.storeName}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-[#555555]">
                      <MapPin className="w-3.5 h-3.5 text-[#777777] shrink-0" />
                      <span className="truncate max-w-xs">{store.address}</span>
                      <span className="font-mono text-[#161616] font-semibold">
                        ({formatDistanceMiles(store.distanceMiles)})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={directionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-xs font-medium tracking-wider uppercase bg-[#161616] text-white hover:bg-[#333333] transition-colors flex items-center gap-1.5"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Directions</span>
                    </a>
                    <button
                      onClick={() => onRemove(store.placeId)}
                      className="p-2 border border-[#DCDAD5] text-[#777777] hover:text-red-700 hover:border-red-700 transition-colors"
                      title="Remove from saved"
                      aria-label="Remove from saved"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        {savedStores.length > 0 && (
          <div className="p-4 bg-white border-t border-[#DCDAD5] flex items-center justify-between">
            <button
              onClick={onClearAll}
              className="text-xs text-[#777777] hover:text-red-700 underline font-mono"
            >
              Clear All Saved
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium tracking-wider uppercase bg-[#161616] text-white hover:bg-[#333333]"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
