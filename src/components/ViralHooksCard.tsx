import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface ViralHooksCardProps {
  hooks: string[];
  onCopyText: (text: string, label: string) => void;
}

const HOOK_ARCHETYPES = [
  'Pattern Interrupt',
  'Proof & Timeframe',
  'Hidden Cost Callout',
  'Insider Framework',
  'Direct Challenge',
];

export function ViralHooksCard({ hooks, onCopyText }: ViralHooksCardProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | 'all' | null>(null);

  const handleCopySingle = (hook: string, index: number) => {
    onCopyText(hook, `Hook #${index + 1}`);
    setCopiedIndex(index);
    window.setTimeout(() => {
      setCopiedIndex((prev) => (prev === index ? null : prev));
    }, 1800);
  };

  const handleCopyAll = () => {
    const joined = hooks.map((h, i) => `${i + 1}. ${h}`).join('\n');
    onCopyText(joined, 'All 5 Viral Hooks');
    setCopiedIndex('all');
    window.setTimeout(() => {
      setCopiedIndex((prev) => (prev === 'all' ? null : prev));
    }, 1800);
  };

  return (
    <section
      id="viral-hooks"
      aria-labelledby="viral-hooks-heading"
      className="h-full bg-[#111827] border border-slate-800/90 rounded-xl p-6 md:p-7 flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
          <div>
            <p className="text-xs text-slate-400">
              <span>First 3-Second Retention Openers</span>
              <span aria-hidden="true" className="mx-1.5 text-slate-600">
                ·
              </span>
              <span className="tabular-nums">5 Variations</span>
            </p>
            <h2
              id="viral-hooks-heading"
              className="font-display text-lg font-semibold text-slate-100 mt-1"
            >
              Viral Hooks (0:00 – 0:03)
            </h2>
          </div>

          <button
            type="button"
            onClick={handleCopyAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-xs font-medium text-slate-200 border border-slate-700/80 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {copiedIndex === 'all' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Copied All Hooks</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy All 5</span>
              </>
            )}
          </button>
        </div>

        <ol className="divide-y divide-slate-800/80 mt-2">
          {hooks.slice(0, 5).map((hook, index) => {
            const isCopied = copiedIndex === index;
            const archetype = HOOK_ARCHETYPES[index % HOOK_ARCHETYPES.length];
            const wordCount = hook.trim().split(/\s+/).filter(Boolean).length;

            return (
              <li
                key={index}
                className="py-3.5 first:pt-3 last:pb-1 flex items-start justify-between gap-4 group"
              >
                <div className="space-y-1 min-w-0">
                  <div className="text-xs text-slate-400 tabular-nums">
                    <span className="font-mono font-semibold text-indigo-400">
                      0{index + 1}
                    </span>
                    <span aria-hidden="true" className="mx-1.5 text-slate-600">
                      ·
                    </span>
                    <span>{archetype}</span>
                    <span aria-hidden="true" className="mx-1.5 text-slate-600">
                      ·
                    </span>
                    <span>{wordCount} words</span>
                  </div>
                  <p className="text-sm text-slate-100 leading-relaxed font-medium">
                    &ldquo;{hook}&rdquo;
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopySingle(hook, index)}
                  aria-label={`Copy Hook ${index + 1}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B0F19] hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0 mt-1"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
