import React from 'react';

interface FooterProps {
  onOpenGuide: () => void;
  onOpenSaved: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenGuide, onOpenSaved }) => {
  return (
    <footer className="mt-20 border-t border-[#DCDAD5] bg-white pt-12 pb-[calc(3rem+env(safe-area-inset-bottom))] text-[#555555]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-[#F7F6F3]">
          <div>
            <span className="font-serif text-2xl font-semibold tracking-wider uppercase text-[#161616] block">
              Occasion Scout
            </span>
            <p className="text-xs text-[#777777] mt-1 font-light">
              Find the right store for the moment. An original fashion-editorial store finder.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs uppercase tracking-wider font-mono">
            <button
              onClick={onOpenGuide}
              className="text-[#555555] hover:text-[#161616] transition-colors"
            >
              Methodology
            </button>
            <span aria-hidden="true" className="text-[#DCDAD5]">·</span>
            <button
              onClick={onOpenSaved}
              className="text-[#555555] hover:text-[#161616] transition-colors"
            >
              Saved Stores
            </button>
            <span aria-hidden="true" className="text-[#DCDAD5]">·</span>
            <a
              href="https://cloud.google.com/maps-platform/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#555555] hover:text-[#161616] transition-colors"
            >
              Maps Terms
            </a>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#888888]">
          <p>© {new Date().getFullYear()} Occasion Scout. Built with Google AI Studio & Gemini.</p>
          <p className="text-[11px] font-mono">
            Verified Physical Stores via Google Maps Places API (New).
          </p>
        </div>
      </div>
    </footer>
  );
};
