import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Platform, SeoMetadata } from '../types/strategy';
import {
  formatFullSeoForClipboard,
  formatHashtagsForClipboard,
} from '../utils/strategyUtils';

interface SeoMetadataCardProps {
  seo: SeoMetadata;
  platform: Platform;
  onCopyText: (text: string, label: string) => void;
}

type CopiedField = 'title' | 'caption' | 'hashtags' | 'all' | null;

export function SeoMetadataCard({
  seo,
  platform,
  onCopyText,
}: SeoMetadataCardProps) {
  const [copiedField, setCopiedField] = useState<CopiedField>(null);

  const triggerCopy = (field: CopiedField, text: string, label: string) => {
    onCopyText(text, label);
    setCopiedField(field);
    window.setTimeout(() => {
      setCopiedField((prev) => (prev === field ? null : prev));
    }, 1800);
  };

  const formattedHashtags = formatHashtagsForClipboard(seo.hashtags);

  return (
    <section
      id="seo-metadata"
      aria-labelledby="seo-metadata-heading"
      className="bg-[#111827] border border-slate-800/90 rounded-xl p-6 md:p-7"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
        <div>
          <p className="text-xs text-slate-400">
            <span>Algorithmic Indexing &amp; Search Discovery</span>
            <span aria-hidden="true" className="mx-1.5 text-slate-600">
              ·
            </span>
            <span>{platform}</span>
          </p>
          <h2
            id="seo-metadata-heading"
            className="font-display text-lg font-semibold text-slate-100 mt-1"
          >
            SEO &amp; Metadata
          </h2>
        </div>

        <button
          type="button"
          onClick={() =>
            triggerCopy('all', formatFullSeoForClipboard(seo), 'Complete SEO Package')
          }
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          {copiedField === 'all' ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300">Copied Full Metadata</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Copy All Metadata</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6">
        {/* Optimized Title */}
        <div className="lg:col-span-4 flex flex-col justify-between pb-6 lg:pb-0 border-b lg:border-b-0 lg:border-r border-slate-800/80 lg:pr-6">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-xs font-semibold text-slate-400">
                Optimized Video Title
              </h3>
              <span className="text-xs text-slate-400 font-mono tabular-nums">
                {seo.title.length} chars
              </span>
            </div>
            <p className="text-base font-semibold text-slate-100 leading-snug">
              {seo.title}
            </p>
          </div>

          <div className="mt-4 pt-3">
            <button
              type="button"
              onClick={() => triggerCopy('title', seo.title, 'SEO Title')}
              aria-label="Copy Title"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B0F19] hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {copiedField === 'title' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Copied Title</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Title</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Post Caption */}
        <div className="lg:col-span-5 flex flex-col justify-between pb-6 lg:pb-0 border-b lg:border-b-0 lg:border-r border-slate-800/80 lg:pr-6">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-xs font-semibold text-slate-400">
                High-Retention Caption &amp; CTA
              </h3>
              <span className="text-xs text-slate-400 font-mono tabular-nums">
                {seo.caption.split(/\s+/).filter(Boolean).length} words
              </span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">
              {seo.caption}
            </p>
          </div>

          <div className="mt-4 pt-3">
            <button
              type="button"
              onClick={() => triggerCopy('caption', seo.caption, 'SEO Caption')}
              aria-label="Copy Caption"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B0F19] hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {copiedField === 'caption' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Copied Caption</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Caption</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Hashtags */}
        <div className="lg:col-span-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-xs font-semibold text-slate-400">
                Discovery Hashtags
              </h3>
              <span className="text-xs text-slate-400 font-mono tabular-nums">
                {seo.hashtags.length} tags
              </span>
            </div>
            <p className="font-mono text-xs text-indigo-300 leading-relaxed break-words">
              {formattedHashtags}
            </p>
          </div>

          <div className="mt-4 pt-3">
            <button
              type="button"
              onClick={() =>
                triggerCopy('hashtags', formattedHashtags, 'SEO Hashtags')
              }
              aria-label="Copy Hashtags"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B0F19] hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {copiedField === 'hashtags' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Copied Hashtags</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Hashtags</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
