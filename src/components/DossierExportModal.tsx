import React, { useState } from 'react';
import { X, Copy, Check, Printer, Share2, Sparkles, MapPin, Phone } from 'lucide-react';
import type { ScoutSearchResponse } from '../shared/types.ts';
import { formatDistanceMiles } from '../shared/geo.ts';

interface DossierExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ScoutSearchResponse;
}

export const DossierExportModal: React.FC<DossierExportModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const generatePlainTextDossier = () => {
    let text = `OCCASION SCOUT — EDITORIAL SHOPPING DOSSIER\n`;
    text += `==========================================\n\n`;
    text += `EVENT: ${data.analysis.interpretedOccasion}\n`;
    text += `FORMALITY: ${data.analysis.formalityLevel}\n`;
    if (data.analysis.seasonalContext) {
      text += `SEASONAL CONTEXT: ${data.analysis.seasonalContext}\n`;
    }
    text += `SEARCH CENTER: ${data.searchCenter.label} (${data.radiusMiles}-mile radius)\n\n`;

    if (data.analysis.colorPalette && data.analysis.colorPalette.length > 0) {
      text += `RECOMMENDED COLOR PALETTE:\n`;
      text += data.analysis.colorPalette.map((c) => `• ${c.name} (${c.hex})`).join('\n') + `\n\n`;
    }

    if (data.analysis.keySilhouettes && data.analysis.keySilhouettes.length > 0) {
      text += `KEY SILHOUETTES TO TARGET:\n`;
      text += data.analysis.keySilhouettes.map((s) => `• ${s}`).join('\n') + `\n\n`;
    }

    text += `AUTHENTIC LOCAL STORES (${data.recommendations.length} MATCHES):\n`;
    text += `------------------------------------------\n\n`;

    data.recommendations.forEach((store, idx) => {
      text += `${idx + 1}. ${store.storeName} (${store.suitabilityScore}% Match)\n`;
      text += `   Category: ${store.retailCategory} · ${store.editorialMatchTitle}\n`;
      text += `   Address: ${store.address} (${formatDistanceMiles(store.distanceMiles)} away)\n`;
      if (store.nationalPhoneNumber) text += `   Phone: ${store.nationalPhoneNumber}\n`;
      if (store.websiteUri) text += `   Website: ${store.websiteUri}\n`;
      text += `   Why it fits: ${store.whyItFits}\n`;
      text += `   What to look for: ${store.whatToLookFor}\n`;
      if (store.associatePrompt) text += `   Ask Associate: "${store.associatePrompt}"\n`;
      text += `\n`;
    });

    text += `DISCLAIMER: Recommendations are fashion-editorial evaluations of retailer collections. Occasion Scout does not guarantee real-time stock or inventory.\n`;
    return text;
  };

  const handleCopy = async () => {
    try {
      const text = generatePlainTextDossier();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-[#F7F6F3] border border-[#161616] w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-white border-b border-[#DCDAD5] flex items-center justify-between">
          <div>
            <span className="text-[10px] tracking-widest uppercase font-mono text-[#777777] block mb-1">
              Curated Style Dossier & Itinerary
            </span>
            <h3 className="font-serif text-2xl text-[#161616]">
              {data.analysis.interpretedOccasion}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#555555] hover:text-[#161616] transition-colors"
            aria-label="Close dossier"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Printable Dossier */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-[#222222] font-sans">
          {/* Briefing summary strip */}
          <div className="p-4 bg-white border border-[#DCDAD5] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#777777] block mb-0.5">
                Formality Standard
              </span>
              <span className="font-serif text-lg font-medium text-[#161616]">
                {data.analysis.formalityLevel}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#777777] block mb-0.5">
                Search Radius
              </span>
              <span className="font-serif text-lg font-medium text-[#161616]">
                {data.radiusMiles} Miles
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#777777] block mb-0.5">
                Stores Ranked
              </span>
              <span className="font-serif text-lg font-medium text-[#161616]">
                {data.recommendations.length} Locations
              </span>
            </div>
          </div>

          {/* Recommended Color Palette */}
          {data.analysis.colorPalette && data.analysis.colorPalette.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-mono tracking-widest uppercase text-[#777777] block">
                Editorial Color Palette
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {data.analysis.colorPalette.map((color) => (
                  <div
                    key={color.name}
                    className="flex items-center gap-2.5 p-2 bg-white border border-[#DCDAD5]"
                  >
                    <span
                      className="w-5 h-5 border border-black/10 shrink-0"
                      style={{ backgroundColor: color.hex }}
                    />
                    <div className="truncate">
                      <span className="block text-xs font-medium text-[#161616] truncate">
                        {color.name}
                      </span>
                      <span className="block text-[10px] font-mono text-[#888888]">
                        {color.hex}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Silhouettes */}
          {data.analysis.keySilhouettes && data.analysis.keySilhouettes.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-mono tracking-widest uppercase text-[#777777] block">
                Key Silhouettes to Target
              </span>
              <div className="flex flex-wrap gap-2 text-xs">
                {data.analysis.keySilhouettes.map((sil) => (
                  <div
                    key={sil}
                    className="px-3 py-1.5 bg-white border border-[#DCDAD5] text-[#161616] font-medium"
                  >
                    {sil}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Store List */}
          <div className="space-y-4 pt-2">
            <span className="text-[11px] font-mono tracking-widest uppercase text-[#777777] block">
              Curated Stores & Shopping Order
            </span>
            <div className="space-y-3">
              {data.recommendations.map((store, idx) => (
                <div
                  key={store.placeId}
                  className="bg-white border border-[#DCDAD5] p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-[#777777]">
                        #{idx + 1} · {store.retailCategory} · {store.editorialMatchTitle}
                      </span>
                      <h4 className="font-serif text-xl font-medium text-[#161616]">
                        {store.storeName}
                      </h4>
                    </div>
                    <span className="text-xs font-mono font-semibold text-[#161616] shrink-0">
                      {formatDistanceMiles(store.distanceMiles)}
                    </span>
                  </div>

                  <p className="text-xs text-[#555555]">
                    <MapPin className="w-3 h-3 inline mr-1 text-[#777777]" />
                    {store.address}
                  </p>

                  <div className="text-xs text-[#222222] bg-[#F7F6F3] p-2.5 space-y-1">
                    <p><strong>Why it fits:</strong> {store.whyItFits}</p>
                    <p><strong>What to look for:</strong> {store.whatToLookFor}</p>
                    {store.associatePrompt && (
                      <p className="text-[#555555] italic">
                        <strong>Ask associate:</strong> "{store.associatePrompt}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 sm:p-5 bg-white border-t border-[#DCDAD5] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-4 py-2 text-xs font-medium tracking-wider uppercase border border-[#161616] bg-transparent hover:bg-[#161616] hover:text-white transition-colors flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Itinerary'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-medium tracking-wider uppercase border border-[#DCDAD5] bg-white text-[#161616] hover:border-[#161616] transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-medium tracking-wider uppercase bg-[#161616] text-white hover:bg-[#333333]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
