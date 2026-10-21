import React, { useState } from 'react';
import { MapPin, Navigation, Search, AlertCircle, Check, Loader2 } from 'lucide-react';
import type { SearchCoordinates } from '../shared/types.ts';

interface LocationControlProps {
  location: SearchCoordinates;
  radiusMiles: 1 | 3 | 5 | 10 | 25;
  onLocationChange: (loc: SearchCoordinates) => void;
  onRadiusChange: (radius: 1 | 3 | 5 | 10 | 25) => void;
}

export const PRESET_LOCATIONS: SearchCoordinates[] = [
  { lat: 29.9511, lng: -90.0715, label: 'French Quarter, New Orleans, LA', source: 'preset' },
  { lat: 29.9272, lng: -90.0886, label: 'Magazine St Boutiques, New Orleans, LA', source: 'preset' },
  { lat: 40.7233, lng: -73.9985, label: 'SoHo Fashion District, New York, NY', source: 'preset' },
  { lat: 34.0736, lng: -118.4004, label: 'Beverly Hills / West Hollywood, CA', source: 'preset' },
  { lat: 41.8948, lng: -87.6242, label: 'Magnificent Mile, Chicago, IL', source: 'preset' },
];

export const LocationControl: React.FC<LocationControlProps> = ({
  location,
  radiusMiles,
  onLocationChange,
  onRadiusChange,
}) => {
  const [manualInput, setManualInput] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isGpsLocating, setIsGpsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Handle GPS location request with iPhone Safari resilience
  const handleUseMyLocation = () => {
    setLocationError(null);

    // Check secure context for iOS Safari
    if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost' && window.location.protocol !== 'https:') {
      setLocationError('iOS Safari requires a secure HTTPS connection to access device location. You can enter your city or ZIP code manually below.');
      return;
    }

    if (!('geolocation' in navigator)) {
      setLocationError('Geolocation is not supported by your browser. Please enter a city or ZIP code below.');
      return;
    }

    setIsGpsLocating(true);

    // Apply acquired position immediately without blocking on reverse geocode
    const handleSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      const initialLabel = `Location (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`;

      // 1. Immediately update active search center so UI is instantly unblocked
      onLocationChange({
        lat: latitude,
        lng: longitude,
        label: initialLabel,
        source: 'gps',
      });
      setIsGpsLocating(false);

      // 2. Asynchronously retrieve clean street address / neighborhood
      fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: latitude, lng: longitude }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.formattedAddress) {
            onLocationChange({
              lat: latitude,
              lng: longitude,
              label: data.formattedAddress,
              source: 'gps',
            });
          }
        })
        .catch(() => {
          // Keep coordinates as fallback label
        });
    };

    // Stage 1: Try balanced standard accuracy first (fastest on iPhone indoors & cellular)
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      (err1) => {
        // If timed out or unavailable, attempt stage 2 high-accuracy fallback
        if (err1.code === err1.TIMEOUT || err1.code === err1.POSITION_UNAVAILABLE) {
          navigator.geolocation.getCurrentPosition(
            handleSuccess,
            (err2) => {
              setIsGpsLocating(false);
              if (err2.code === err2.PERMISSION_DENIED || err1.code === err1.PERMISSION_DENIED) {
                setLocationError(
                  'Location access is blocked. On iPhone: check Settings > Privacy > Location Services > Safari (or your browser) > While Using the App. Or enter your city/ZIP below.'
                );
              } else {
                setLocationError('Could not determine GPS coordinates. Please enter your city, neighborhood, or ZIP code manually.');
              }
            },
            {
              enableHighAccuracy: true,
              timeout: 12000,
              maximumAge: 60000,
            }
          );
        } else if (err1.code === err1.PERMISSION_DENIED) {
          setIsGpsLocating(false);
          setLocationError(
            'Location access is blocked. On iPhone: check Settings > Privacy > Location Services > Safari (or your browser) > While Using the App. Or enter your city/ZIP below.'
          );
        } else {
          setIsGpsLocating(false);
          setLocationError('Could not determine GPS coordinates. Please enter your city or ZIP code manually.');
        }
      },
      {
        enableHighAccuracy: false, // Fast Wi-Fi/Cellular lock on iPhone
        timeout: 15000,
        maximumAge: 180000,
      }
    );
  };

  // Handle manual address geocoding
  const handleManualGeocode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;

    setLocationError(null);
    setIsGeocoding(true);

    try {
      const res = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: manualInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to locate address.');
      }

      onLocationChange({
        lat: data.lat,
        lng: data.lng,
        label: data.formattedAddress,
        source: 'manual',
      });
      setManualInput('');
    } catch (err: unknown) {
      setLocationError((err as Error).message || 'Unable to find that location. Please try a specific city or ZIP.');
    } finally {
      setIsGeocoding(false);
    }
  };

  return (
    <div className="bg-white border border-[#DCDAD5] p-5 sm:p-7 space-y-6">
      {/* Active Location Display */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F7F6F3]">
        <div className="space-y-1">
          <span className="text-[10px] tracking-widest uppercase font-mono text-[#777777]">
            Active Search Center
          </span>
          <div className="flex items-center gap-2 text-sm sm:text-base font-medium text-[#161616]">
            <MapPin className="w-4 h-4 text-[#161616] shrink-0" />
            <span className="truncate max-w-[280px] sm:max-w-md font-sans">
              {location.label || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
            </span>
            <span className="text-xs font-mono text-[#777777]">
              ({location.source === 'gps' ? 'Device GPS' : location.source === 'preset' ? 'Preset' : 'Geocoded'})
            </span>
          </div>
        </div>

        {/* Use My Location GPS Button */}
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={isGpsLocating}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium tracking-wider uppercase border border-[#161616] bg-transparent hover:bg-[#161616] hover:text-white transition-colors duration-200 disabled:opacity-50 shrink-0"
        >
          {isGpsLocating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Acquiring GPS...</span>
            </>
          ) : (
            <>
              <Navigation className="w-3.5 h-3.5" />
              <span>Use My Location</span>
            </>
          )}
        </button>
      </div>

      {locationError && (
        <div className="flex items-start gap-2.5 p-3.5 bg-amber-50/70 border border-amber-200/80 text-amber-950 text-xs">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p>{locationError}</p>
        </div>
      )}

      {/* Manual Search and Radius Rows */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-end">
        {/* Manual Location Form (7 cols) */}
        <form onSubmit={handleManualGeocode} className="lg:col-span-7 space-y-1.5">
          <label htmlFor="manual-loc" className="block text-[11px] tracking-widest uppercase font-medium text-[#555555]">
            Or Enter City, Neighborhood, or ZIP
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                id="manual-loc"
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="e.g. French Quarter, New Orleans or 70130"
                className="w-full bg-[#F7F6F3] border border-[#DCDAD5] px-3.5 py-2.5 text-base sm:text-sm text-[#161616] placeholder-[#888888] focus:outline-none focus:border-[#161616] transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={isGeocoding || !manualInput.trim()}
              className="px-4 py-2.5 text-xs font-medium tracking-wider uppercase bg-[#161616] text-white hover:bg-[#333333] transition-colors disabled:opacity-40 shrink-0 flex items-center gap-1.5 min-h-[42px]"
            >
              {isGeocoding ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Search className="w-3.5 h-3.5" />
              )}
              <span>Locate</span>
            </button>
          </div>
        </form>

        {/* Radius Selector (5 cols) */}
        <div className="lg:col-span-5 space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] tracking-widest uppercase font-medium text-[#555555]">
              Search Radius
            </label>
            <span className="text-xs font-mono text-[#777777]">{radiusMiles} miles</span>
          </div>
          {/* Functional segmented controls */}
          <div className="grid grid-cols-5 gap-1 p-1 bg-[#F7F6F3] border border-[#DCDAD5]">
            {([1, 3, 5, 10, 25] as const).map((r) => {
              const active = radiusMiles === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => onRadiusChange(r)}
                  className={`py-2 sm:py-1.5 text-xs font-medium transition-colors flex items-center justify-center min-h-[38px] ${
                    active
                      ? 'bg-[#161616] text-white shadow-xs'
                      : 'text-[#555555] hover:text-[#161616] hover:bg-white/60 active:bg-gray-200'
                  }`}
                  aria-pressed={active}
                >
                  {r}mi
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Preset Fashion Locations */}
      <div className="pt-3 border-t border-[#F7F6F3]">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[10px] tracking-widest uppercase font-mono text-[#777777] mr-1">
            Explore:
          </span>
          {PRESET_LOCATIONS.map((preset) => {
            const isSelected =
              Math.abs(location.lat - preset.lat) < 0.001 &&
              Math.abs(location.lng - preset.lng) < 0.001;
            return (
              <button
                key={preset.label || `${preset.lat},${preset.lng}`}
                type="button"
                onClick={() => onLocationChange(preset)}
                className={`text-xs px-2.5 py-1 border transition-colors ${
                  isSelected
                    ? 'border-[#161616] bg-[#161616] text-white'
                    : 'border-[#DCDAD5] text-[#444444] bg-white hover:border-[#161616] hover:text-[#161616]'
                }`}
              >
                {(preset.label || 'Location').split(',')[0]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
