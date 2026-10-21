import React from 'react';
import { Bookmark, Sparkles, Compass } from 'lucide-react';

interface HeaderProps {
  savedCount: number;
  onOpenSaved: () => void;
  onOpenGuide: () => void;
  onScrollToSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  savedCount,
  onOpenSaved,
  onOpenGuide,
  onScrollToSearch,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#F7F6F3]/95 backdrop-blur-md border-b border-[#DCDAD5] transition-colors pt-[env(safe-area-inset-top)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark with original custom hanger-pin SVG */}
        <a
          href="/"
          className="flex items-center gap-2.5 text-[#161616] group shrink-0"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          {/* Original Hanger + Location Pin Minimal Monogram */}
          <svg
            className="w-5 h-5 text-[#161616] transition-transform duration-300 group-hover:scale-105"
            viewBox="0 0 32 32"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {/* Hanger hook and frame */}
            <path d="M16 6a3 3 0 0 1 3 3c0 1.2-.7 2.2-1.7 2.7L27 18.5a1.5 1.5 0 0 1-.8 2.7H5.8a1.5 1.5 0 0 1-.8-2.7l9.7-6.8A3 3 0 0 1 13 9a3 3 0 0 1 3-3z" />
            {/* Pin coordinate anchor */}
            <circle cx="16" cy="24" r="2" fill="currentColor" stroke="none" />
          </svg>
          <span className="font-serif text-xl sm:text-2xl font-semibold tracking-wider uppercase text-[#161616]">
            Occasion Scout
          </span>
        </a>

        {/* Zone 2: Navigation links (single line, clean typography) */}
        <nav className="hidden md:flex items-center gap-7 text-xs tracking-widest uppercase font-medium text-[#333333]">
          <button
            onClick={onScrollToSearch}
            className="hover:text-[#161616] transition-colors whitespace-nowrap shrink-0 border-b border-transparent hover:border-[#161616] pb-0.5"
          >
            The Scout
          </button>
          <button
            onClick={onOpenGuide}
            className="hover:text-[#161616] transition-colors whitespace-nowrap shrink-0 border-b border-transparent hover:border-[#161616] pb-0.5"
          >
            How It Works
          </button>
          <button
            onClick={onOpenGuide}
            className="hover:text-[#161616] transition-colors whitespace-nowrap shrink-0 border-b border-transparent hover:border-[#161616] pb-0.5"
          >
            Editorial Methodology
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action button / Saved Counter */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenSaved}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs tracking-wider uppercase font-medium border border-[#161616] text-[#161616] bg-transparent hover:bg-[#161616] hover:text-white transition-colors duration-200 whitespace-nowrap shrink-0"
            aria-label="View saved stores"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Saved Stores</span>
            {savedCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 bg-[#161616] text-white text-[10px] font-mono group-hover:bg-white group-hover:text-[#161616]">
                {savedCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
