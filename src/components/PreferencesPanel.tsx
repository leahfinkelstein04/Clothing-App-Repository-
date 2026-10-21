import React from 'react';
import { SlidersHorizontal, RotateCcw } from 'lucide-react';
import type {
  BudgetTier,
  ClothingFocus,
  RetailCategoryPreference,
  StyleVibe,
} from '../shared/types.ts';

interface PreferencesPanelProps {
  clothingFocus: ClothingFocus;
  style: StyleVibe;
  dressCode: string;
  budget: BudgetTier;
  categoryPreference: RetailCategoryPreference;
  onClothingFocusChange: (val: ClothingFocus) => void;
  onStyleChange: (val: StyleVibe) => void;
  onDressCodeChange: (val: string) => void;
  onBudgetChange: (val: BudgetTier) => void;
  onCategoryPreferenceChange: (val: RetailCategoryPreference) => void;
  onReset: () => void;
}

const CLOTHING_OPTIONS: { id: ClothingFocus; label: string }[] = [
  { id: 'any', label: 'Complete Look' },
  { id: 'dress', label: 'Dress' },
  { id: 'suit', label: 'Suit / Tailored' },
  { id: 'separates', label: 'Separates' },
  { id: 'shoes', label: 'Footwear' },
  { id: 'accessories', label: 'Accessories' },
];

const STYLE_OPTIONS: { id: StyleVibe; label: string }[] = [
  { id: 'any', label: 'Flexible' },
  { id: 'classic', label: 'Classic / Timeless' },
  { id: 'trendy', label: 'Fashion-Forward' },
  { id: 'minimalist', label: 'Minimalist' },
  { id: 'bold', label: 'Bold / Statement' },
  { id: 'romantic', label: 'Romantic' },
  { id: 'vintage', label: 'Vintage / Archival' },
];

const BUDGET_OPTIONS: { id: BudgetTier; label: string; desc: string }[] = [
  { id: 'any', label: 'Any Budget', desc: 'No constraints' },
  { id: 'budget', label: '$', desc: 'Accessible / High-Street' },
  { id: 'moderate', label: '$$', desc: 'Contemporary Mid-Range' },
  { id: 'contemporary', label: '$$$', desc: 'Premium & Designer' },
  { id: 'luxury', label: '$$$$', desc: 'Luxury Flagship' },
];

const RETAIL_OPTIONS: { id: RetailCategoryPreference; label: string }[] = [
  { id: 'any', label: 'All Retailers' },
  { id: 'boutique', label: 'Independent Boutiques' },
  { id: 'department_store', label: 'Department Stores' },
  { id: 'formalwear', label: 'Formalwear Specialists' },
  { id: 'vintage_resale', label: 'Vintage & Consignment' },
  { id: 'shoes_accessories', label: 'Shoes & Accessories' },
];

export const PreferencesPanel: React.FC<PreferencesPanelProps> = ({
  clothingFocus,
  style,
  dressCode,
  budget,
  categoryPreference,
  onClothingFocusChange,
  onStyleChange,
  onDressCodeChange,
  onBudgetChange,
  onCategoryPreferenceChange,
  onReset,
}) => {
  return (
    <div className="bg-white border border-[#DCDAD5] p-5 sm:p-7 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#F7F6F3]">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#161616]" />
          <h3 className="text-xs font-semibold tracking-widest uppercase text-[#161616]">
            Refine Style & Wardrobe Focus
          </h3>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-medium text-[#777777] hover:text-[#161616] flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Filters</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Clothing Focus */}
        <div className="space-y-2">
          <label className="block text-[11px] tracking-widest uppercase font-medium text-[#555555]">
            Clothing Focus
          </label>
          <div className="flex flex-wrap gap-1.5">
            {CLOTHING_OPTIONS.map((opt) => {
              const active = clothingFocus === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onClothingFocusChange(opt.id)}
                  className={`text-xs px-2.5 py-1.5 border transition-colors ${
                    active
                      ? 'border-[#161616] bg-[#161616] text-white'
                      : 'border-[#DCDAD5] bg-[#F7F6F3] text-[#444444] hover:border-[#161616] hover:text-[#161616]'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Style Vibe */}
        <div className="space-y-2">
          <label className="block text-[11px] tracking-widest uppercase font-medium text-[#555555]">
            Style Aesthetic
          </label>
          <div className="flex flex-wrap gap-1.5">
            {STYLE_OPTIONS.map((opt) => {
              const active = style === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onStyleChange(opt.id)}
                  className={`text-xs px-2.5 py-1.5 border transition-colors ${
                    active
                      ? 'border-[#161616] bg-[#161616] text-white'
                      : 'border-[#DCDAD5] bg-[#F7F6F3] text-[#444444] hover:border-[#161616] hover:text-[#161616]'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Budget Band */}
        <div className="space-y-2">
          <label className="block text-[11px] tracking-widest uppercase font-medium text-[#555555]">
            Budget Range
          </label>
          <div className="flex flex-wrap gap-1.5">
            {BUDGET_OPTIONS.map((opt) => {
              const active = budget === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onBudgetChange(opt.id)}
                  title={opt.desc}
                  className={`text-xs px-2.5 py-1.5 border transition-colors ${
                    active
                      ? 'border-[#161616] bg-[#161616] text-white'
                      : 'border-[#DCDAD5] bg-[#F7F6F3] text-[#444444] hover:border-[#161616] hover:text-[#161616]'
                  }`}
                >
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Store Category Preference */}
        <div className="space-y-2">
          <label className="block text-[11px] tracking-widest uppercase font-medium text-[#555555]">
            Retail Type Preference
          </label>
          <div className="flex flex-wrap gap-1.5">
            {RETAIL_OPTIONS.map((opt) => {
              const active = categoryPreference === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onCategoryPreferenceChange(opt.id)}
                  className={`text-xs px-2.5 py-1.5 border transition-colors ${
                    active
                      ? 'border-[#161616] bg-[#161616] text-white'
                      : 'border-[#DCDAD5] bg-[#F7F6F3] text-[#444444] hover:border-[#161616] hover:text-[#161616]'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Optional Known Dress Code Input */}
      <div className="pt-3 border-t border-[#F7F6F3] grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        <div>
          <label htmlFor="dress-code-input" className="block text-[11px] tracking-widest uppercase font-medium text-[#555555] mb-1">
            Explicit Dress Code (Optional)
          </label>
          <input
            id="dress-code-input"
            type="text"
            value={dressCode}
            onChange={(e) => onDressCodeChange(e.target.value)}
            placeholder="e.g. Cocktail Attire, Black Tie Optional, Smart Casual"
            className="w-full bg-[#F7F6F3] border border-[#DCDAD5] px-3.5 py-2 text-base sm:text-xs text-[#161616] placeholder-[#888888] focus:outline-none focus:border-[#161616] transition-colors"
          />
        </div>
        <p className="text-xs text-[#777777] italic self-end pb-1">
          Occasion Scout accommodates all shoppers with gender-neutral styling intelligence.
        </p>
      </div>
    </div>
  );
};
