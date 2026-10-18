import React from 'react';
import { X, Sparkles, Navigation, ShieldCheck, ShoppingBag } from 'lucide-react';

interface EditorialGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditorialGuideModal: React.FC<EditorialGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-[#F7F6F3] border border-[#161616] w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-white border-b border-[#DCDAD5] flex items-center justify-between">
          <div>
            <span className="text-[10px] tracking-widest uppercase font-mono text-[#777777] block mb-1">
              Methodology & Architecture
            </span>
            <h3 className="font-serif text-2xl text-[#161616]">
              How Occasion Scout Works
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#555555] hover:text-[#161616] transition-colors"
            aria-label="Close guide modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-sm text-[#333333] leading-relaxed">
          <div className="space-y-2">
            <h4 className="font-serif text-lg font-medium text-[#161616] flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#161616]" />
              <span>1. Find Where to Shop, Not Imaginary Inventory</span>
            </h4>
            <p className="text-xs text-[#555555] leading-relaxed">
              When someone has an event—an outdoor wedding, an executive job interview, a rooftop birthday—the hardest challenge is knowing which stores carry that vibe. Occasion Scout finds verified physical stores nearby and tells you what to look for, rather than promising a specific dress size that may be out of stock.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-serif text-lg font-medium text-[#161616] flex items-center gap-2">
              <Navigation className="w-4 h-4 text-[#161616]" />
              <span>2. Real Device GPS & Exact Haversine Distances</span>
            </h4>
            <p className="text-xs text-[#555555] leading-relaxed">
              Your phone or laptop’s GPS is requested only when you click “Use My Location”. Every store’s distance is calculated using the spherical Haversine formula (1 mile = 1609.344 meters). If you choose a 1-mile or 5-mile radius, results are strictly filtered to that distance—never silently broadened.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-serif text-lg font-medium text-[#161616] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#161616]" />
              <span>3. Central Gemini AI Styling & Anti-Hallucination Guardrail</span>
            </h4>
            <p className="text-xs text-[#555555] leading-relaxed">
              Gemini AI performs two essential server-side tasks:
              <br />• <strong>Occasion Interpretation:</strong> Decodes event formality, seasonal factors, and styles (even with typos).
              <br />• <strong>Store Suitability Ranking:</strong> Evaluates actual retrieved stores and explains why each suits your occasion. The backend strictly rejects any store not verified in Google Places.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-serif text-lg font-medium text-[#161616] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#161616]" />
              <span>4. Privacy, Zero Telemetry & Open Web URL</span>
            </h4>
            <p className="text-xs text-[#555555] leading-relaxed">
              Occasion Scout requires no login, collects no personal identifiable information, and saves bookmarked stores locally in your browser. It runs natively in any standard web browser on iPhone, Android, iPad, and desktop.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-[#DCDAD5] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-medium tracking-wider uppercase bg-[#161616] text-white hover:bg-[#333333]"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
