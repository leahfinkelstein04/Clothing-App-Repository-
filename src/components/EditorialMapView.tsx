import React, { useMemo, useState } from 'react';
import { MapPin, Navigation, ExternalLink, X, Compass, Layers } from 'lucide-react';
import type { RankedStoreRecommendation } from '../shared/types.ts';
import { formatDistanceMiles } from '../shared/geo.ts';

interface EditorialMapViewProps {
  center: { lat: number; lng: number; label: string };
  radiusMiles: number;
  stores: RankedStoreRecommendation[];
  selectedStoreId?: string;
  onSelectStore: (store: RankedStoreRecommendation) => void;
  onClose?: () => void;
}

export const EditorialMapView: React.FC<EditorialMapViewProps> = ({
  center,
  radiusMiles,
  stores,
  selectedStoreId,
  onSelectStore,
  onClose,
}) => {
  const [hoveredStoreId, setHoveredStoreId] = useState<string | null>(null);

  // Compute map bounds with generous padding around center and stores
  const { points, viewRadiusMiles } = useMemo(() => {
    // Miles to approx degrees (1 degree lat ~= 69 miles; 1 degree lng ~= 69 * cos(lat) miles)
    const latMilesDeg = 69.0;
    const lngMilesDeg = 69.0 * Math.cos((center.lat * Math.PI) / 180);

    const maxDist = Math.max(radiusMiles, ...stores.map((s) => s.distanceMiles));
    const effectiveRadius = Math.max(maxDist * 1.15, 1);

    const mapped = stores.map((s) => {
      // Calculate relative delta in miles from center
      const dyMiles = (s.lat - center.lat) * latMilesDeg;
      const dxMiles = (s.lng - center.lng) * lngMilesDeg;

      // Project onto normalized [-1, 1] range inside effectiveRadius
      const normX = dxMiles / effectiveRadius;
      const normY = -dyMiles / effectiveRadius; // Invert for SVG y-down

      return {
        ...s,
        normX,
        normY,
      };
    });

    return { points: mapped, viewRadiusMiles: effectiveRadius };
  }, [center, radiusMiles, stores]);

  const activeStore = stores.find((s) => s.placeId === (hoveredStoreId || selectedStoreId));

  return (
    <div className="bg-white border border-[#DCDAD5] p-5 sm:p-7 space-y-4 relative shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#F7F6F3]">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-[#161616]" />
          <h3 className="font-serif text-lg text-[#161616] tracking-tight">
            Editorial Proximity Radar
          </h3>
          <span className="text-[11px] font-mono text-[#777777]">
            ({radiusMiles}-mile radius centered at {center.label.split(',')[0]})
          </span>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1 text-[#777777] hover:text-[#161616] transition-colors"
            aria-label="Close radar map"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Interactive Map Visualizer */}
      <div className="relative w-full aspect-square sm:aspect-16/9 max-h-[420px] bg-[#F7F6F3] border border-[#EBE9E4] overflow-hidden flex items-center justify-center">
        <svg
          viewBox="-120 -120 240 240"
          className="w-full h-full select-none"
          role="img"
          aria-label="Geographic radar of nearby stores"
        >
          {/* Background grid radial lines */}
          <line x1="-110" y1="0" x2="110" y2="0" stroke="#DCDAD5" strokeWidth="0.5" strokeDasharray="2 2" />
          <line x1="0" y1="-110" x2="0" y2="110" stroke="#DCDAD5" strokeWidth="0.5" strokeDasharray="2 2" />

          {/* Concentric distance boundary rings */}
          {[0.25, 0.5, 0.75, 1.0].map((ratio) => {
            const ringMiles = (viewRadiusMiles * ratio).toFixed(1);
            const r = ratio * 100;
            return (
              <g key={ratio}>
                <circle
                  cx="0"
                  cy="0"
                  r={r}
                  fill="none"
                  stroke={ratio === 1.0 ? '#161616' : '#DCDAD5'}
                  strokeWidth={ratio === 1.0 ? '1' : '0.5'}
                  strokeDasharray={ratio === 1.0 ? 'none' : '3 3'}
                />
                <text
                  x="2"
                  y={-r + 8}
                  fill="#888888"
                  fontSize="4"
                  fontFamily="monospace"
                  className="select-none"
                >
                  {ringMiles} mi
                </text>
              </g>
            );
          })}

          {/* Center Origin Pin (User GPS / Searched Location) */}
          <g>
            <circle cx="0" cy="0" r="4.5" fill="#161616" />
            <circle cx="0" cy="0" r="1.5" fill="#FFFFFF" />
            <text
              x="0"
              y="11"
              textAnchor="middle"
              fill="#161616"
              fontSize="4.5"
              fontWeight="600"
              fontFamily="sans-serif"
            >
              Search Center
            </text>
          </g>

          {/* Discovered Store Pins */}
          {points.map((pt, idx) => {
            const cx = pt.normX * 100;
            const cy = pt.normY * 100;
            const isSelected = pt.placeId === selectedStoreId;
            const isHovered = pt.placeId === hoveredStoreId;
            const isHighSuitability = pt.suitabilityScore >= 85;

            return (
              <g
                key={pt.placeId}
                className="cursor-pointer transition-transform duration-200"
                onClick={() => onSelectStore(pt)}
                onTouchStart={() => {
                  setHoveredStoreId(pt.placeId);
                  onSelectStore(pt);
                }}
                onMouseEnter={() => setHoveredStoreId(pt.placeId)}
                onMouseLeave={() => setHoveredStoreId(null)}
              >
                {/* Connecting hairline to center */}
                <line
                  x1="0"
                  y1="0"
                  x2={cx}
                  y2={cy}
                  stroke={isSelected || isHovered ? '#161616' : '#DCDAD5'}
                  strokeWidth={isSelected || isHovered ? '0.75' : '0.35'}
                  strokeOpacity={isSelected || isHovered ? 0.9 : 0.4}
                />

                {/* Outer halo */}
                {(isSelected || isHovered) && (
                  <circle cx={cx} cy={cy} r="8" fill="#161616" fillOpacity="0.12" />
                )}

                {/* Pin body */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isSelected || isHovered ? '5' : '4'}
                  fill={isSelected ? '#161616' : isHighSuitability ? '#333333' : '#666666'}
                  stroke="#FFFFFF"
                  strokeWidth="1"
                />

                {/* Index label inside pin */}
                <text
                  x={cx}
                  y={cy + 1.5}
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="3.2"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  {idx + 1}
                </text>

                {/* Store name tag on hover or selection */}
                {(isSelected || isHovered) && (
                  <g>
                    <rect
                      x={cx - 24}
                      y={cy - 12}
                      width="48"
                      height="7"
                      fill="#161616"
                      rx="1"
                    />
                    <text
                      x={cx}
                      y={cy - 7.5}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="3"
                      fontWeight="500"
                      fontFamily="sans-serif"
                    >
                      {pt.storeName.length > 20 ? pt.storeName.slice(0, 18) + '...' : pt.storeName}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Legend / Overlay Note */}
        <div className="absolute bottom-2 left-3 text-[10px] font-mono text-[#777777] bg-white/90 px-2 py-0.5 border border-[#DCDAD5]">
          Tap any pin to view details · Distances verified via Haversine
        </div>
      </div>

      {/* Selected Store Mini Preview Drawer */}
      {activeStore && (
        <div className="p-4 bg-[#F7F6F3] border border-[#161616] flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest uppercase text-[#777777]">
                {activeStore.retailCategory} · {activeStore.editorialMatchTitle}
              </span>
              <span className="text-[10px] font-mono font-semibold text-[#161616]">
                {activeStore.suitabilityScore}% Match
              </span>
            </div>
            <h4 className="font-serif text-lg font-medium text-[#161616]">
              {activeStore.storeName}
            </h4>
            <p className="text-xs text-[#555555]">
              {formatDistanceMiles(activeStore.distanceMiles)} away · {activeStore.address}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                `${activeStore.storeName}, ${activeStore.address}`
              )}&destination_place_id=${activeStore.placeId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 text-xs font-medium tracking-wider uppercase bg-[#161616] text-white hover:bg-[#333333] transition-colors flex items-center gap-1.5"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Route Directions</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
