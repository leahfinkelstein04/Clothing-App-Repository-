import React, { useState } from 'react';
import { X, Copy, Check, Share2, Link as LinkIcon, MessageSquare, Send, Sparkles, MapPin } from 'lucide-react';
import type { ScoutSearchResponse, RankedStoreRecommendation } from '../shared/types.ts';
import { formatDistanceMiles } from '../shared/geo.ts';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ScoutSearchResponse;
  singleStore?: RankedStoreRecommendation | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  data,
  singleStore,
}) => {
  const [linkCopied, setLinkCopied] = useState(false);
  const [summaryCopied, setSummaryCopied] = useState(false);

  if (!isOpen) return null;

  // Build the deep link URL with search parameters
  const generateShareUrl = () => {
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('occasion', data.analysis.interpretedOccasion || 'Fashion Scouting');
    url.searchParams.set('lat', data.searchCenter.lat.toString());
    url.searchParams.set('lng', data.searchCenter.lng.toString());
    url.searchParams.set('radius', data.radiusMiles.toString());
    if (data.searchCenter.label) {
      url.searchParams.set('loc', data.searchCenter.label);
    }
    if (singleStore) {
      url.searchParams.set('store', singleStore.placeId);
    }
    return url.toString();
  };

  const shareUrl = generateShareUrl();

  // Generate plain text summary suitable for SMS, WhatsApp, Notes, Slack, or Email
  const generateTextSummary = () => {
    if (singleStore) {
      let text = `Occasion Scout Recommendation:\n`;
      text += `Store: ${singleStore.storeName} (${singleStore.suitabilityScore}% Match)\n`;
      text += `Occasion: ${data.analysis.interpretedOccasion}\n`;
      text += `Category: ${singleStore.retailCategory} · ${singleStore.editorialMatchTitle}\n`;
      text += `Address: ${singleStore.address} (${formatDistanceMiles(singleStore.distanceMiles)} away)\n`;
      if (singleStore.nationalPhoneNumber) text += `Phone: ${singleStore.nationalPhoneNumber}\n`;
      if (singleStore.websiteUri) text += `Website: ${singleStore.websiteUri}\n`;
      text += `Why it fits: ${singleStore.whyItFits}\n`;
      text += `What to look for: ${singleStore.whatToLookFor}\n`;
      if (singleStore.associatePrompt) text += `Ask associate: "${singleStore.associatePrompt}"\n`;
      text += `\nExplore more stores: ${shareUrl}`;
      return text;
    }

    let text = `Occasion Scout — Store Recommendations\n`;
    text += `=====================================\n`;
    text += `Occasion: ${data.analysis.interpretedOccasion}\n`;
    text += `Formality: ${data.analysis.formalityLevel}\n`;
    text += `Location: ${data.searchCenter.label} (${data.radiusMiles}-mile radius)\n\n`;

    const topStores = data.recommendations.slice(0, 5);
    text += `Top Recommended Stores:\n`;
    topStores.forEach((store, idx) => {
      text += `${idx + 1}. ${store.storeName} (${store.suitabilityScore}% Match · ${formatDistanceMiles(store.distanceMiles)} away)\n`;
      text += `   ${store.address}\n`;
      text += `   Why: ${store.whyItFits}\n`;
      text += `   Look for: ${store.whatToLookFor}\n\n`;
    });

    if (data.recommendations.length > 5) {
      text += `+ ${data.recommendations.length - 5} more curated stores\n\n`;
    }

    text += `View full interactive recommendations & directions:\n${shareUrl}`;
    return text;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleCopySummary = async () => {
    try {
      const summary = generateTextSummary();
      await navigator.clipboard.writeText(summary);
      setSummaryCopied(true);
      setTimeout(() => setSummaryCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  // Support Web Share API on mobile phones (iOS Safari / Android Chrome)
  const canWebShare = typeof navigator !== 'undefined' && !!navigator.share;

  const handleNativeShare = async () => {
    if (!canWebShare) return;
    try {
      await navigator.share({
        title: singleStore
          ? `${singleStore.storeName} — Occasion Scout`
          : `${data.analysis.interpretedOccasion} — Occasion Scout`,
        text: singleStore
          ? `Check out ${singleStore.storeName} for ${data.analysis.interpretedOccasion}: ${singleStore.whyItFits}`
          : `Found ${data.recommendations.length} clothing stores near ${data.searchCenter.label} for ${data.analysis.interpretedOccasion}.`,
        url: shareUrl,
      });
    } catch {
      // User cancelled or share failed
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-[#F7F6F3] border border-[#161616] w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-white border-b border-[#DCDAD5] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Share2 className="w-5 h-5 text-[#161616]" />
            <div>
              <span className="text-[10px] tracking-widest uppercase font-mono text-[#777777] block mb-0.5">
                {singleStore ? 'Share Store' : 'Share Recommendations'}
              </span>
              <h3 className="font-serif text-xl sm:text-2xl text-[#161616]">
                {singleStore ? singleStore.storeName : data.analysis.interpretedOccasion}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#555555] hover:text-[#161616] transition-colors"
            aria-label="Close share modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-7 overflow-y-auto space-y-6 text-sm text-[#333333]">
          {/* Option 1: Copy Deep Link */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="deep-link-input" className="text-xs font-semibold tracking-wider uppercase font-mono text-[#161616] flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-[#161616]" />
                <span>Direct Search Link</span>
              </label>
              <span className="text-[11px] text-[#777777] font-mono">
                Anyone with this link can view these stores
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="deep-link-input"
                type="text"
                readOnly
                value={shareUrl}
                className="w-full bg-white border border-[#DCDAD5] px-3.5 py-2.5 text-xs font-mono text-[#161616] select-all focus:outline-none focus:border-[#161616]"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-4 py-2.5 text-xs font-medium tracking-wider uppercase bg-[#161616] text-white hover:bg-[#333333] transition-colors shrink-0 flex items-center gap-1.5"
              >
                {linkCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{linkCopied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Option 2: Copy Formatted Text Summary */}
          <div className="space-y-2 pt-2 border-t border-[#DCDAD5]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold tracking-wider uppercase font-mono text-[#161616] flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#161616]" />
                <span>Text Summary for Messaging</span>
              </label>
              <span className="text-[11px] text-[#777777] font-mono">
                For iMessage, WhatsApp, Notes, Slack
              </span>
            </div>

            <div className="p-3 bg-white border border-[#DCDAD5] text-xs font-mono text-[#444444] max-h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed select-all">
              {generateTextSummary()}
            </div>

            <button
              type="button"
              onClick={handleCopySummary}
              className="w-full py-2.5 px-4 text-xs font-medium tracking-wider uppercase border border-[#161616] bg-transparent text-[#161616] hover:bg-[#161616] hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              {summaryCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{summaryCopied ? 'Summary Copied to Clipboard!' : 'Copy Formatted Summary to Clipboard'}</span>
            </button>
          </div>

          {/* Option 3: System Share Sheet (Mobile / Tablet / Safari) */}
          {canWebShare && (
            <div className="pt-2 border-t border-[#DCDAD5]">
              <button
                type="button"
                onClick={handleNativeShare}
                className="w-full py-2.5 px-4 text-xs font-medium tracking-wider uppercase bg-[#333333] text-white hover:bg-[#161616] transition-colors flex items-center justify-center gap-2"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share via Device Sheet (AirDrop, Messages, Mail)</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-[#DCDAD5] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-medium tracking-wider uppercase bg-[#161616] text-white hover:bg-[#333333]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
