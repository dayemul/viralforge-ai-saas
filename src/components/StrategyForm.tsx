import React from 'react';
import { Sparkles, AlertCircle, RotateCcw } from 'lucide-react';
import { Platform, StrategyInput, Tone } from '../types/strategy';
import { PLATFORMS, TONES } from '../utils/strategyUtils';

interface StrategyFormProps {
  topic: string;
  platform: Platform;
  tone: Tone;
  isGenerating: boolean;
  validationError: string | null;
  onTopicChange: (value: string) => void;
  onPlatformChange: (value: Platform) => void;
  onToneChange: (value: Tone) => void;
  onSubmit: (e: React.FormEvent) => void;
  onSelectQuickTopic: (preset: StrategyInput) => void;
  onClearTopic: () => void;
}

const SAMPLE_IDEAS: StrategyInput[] = [
  {
    topic: 'How I automated 80% of my video editing workflow in 10 minutes',
    platform: 'TikTok',
    tone: 'Energetic',
  },
  {
    topic: 'Why 99% of morning routines fail according to neuroscience',
    platform: 'YouTube Shorts',
    tone: 'Controversial',
  },
  {
    topic: 'How a 1-person design studio replaced $14,000/mo in agency retainers',
    platform: 'Instagram Reels',
    tone: 'Storytelling',
  },
  {
    topic: '3 DaVinci Resolve color grading nodes every creator needs to know',
    platform: 'YouTube Shorts',
    tone: 'Educational',
  },
];

export function StrategyForm({
  topic,
  platform,
  tone,
  isGenerating,
  validationError,
  onTopicChange,
  onPlatformChange,
  onToneChange,
  onSubmit,
  onSelectQuickTopic,
  onClearTopic,
}: StrategyFormProps) {
  return (
    <section
      id="strategy-studio"
      aria-labelledby="strategy-studio-heading"
      className="bg-[#111827] border border-slate-800/90 rounded-xl p-6 md:p-8"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <p className="text-xs text-slate-400 tracking-wide">
            Short-Form Production Blueprint · Retention &amp; Hook Architecture
          </p>
          <h1
            id="strategy-studio-heading"
            className="font-display text-2xl md:text-3xl font-bold text-slate-50 tracking-tight mt-1"
            style={{ textWrap: 'balance' }}
          >
            Engineer high-retention short-form video scripts in seconds
          </h1>
        </div>
        <div className="text-xs text-slate-400 tabular-nums shrink-0">
          <span>Target Window: 0:00–0:30</span>
          <span aria-hidden="true" className="mx-2 text-slate-600">
            ·
          </span>
          <span>Hook Threshold: 3.0s</span>
        </div>
      </div>

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Video Topic / Idea Input */}
          <div className="lg:col-span-6">
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="video-topic-input"
                className="block text-sm font-medium text-slate-200"
              >
                Video Topic / Idea
              </label>
              {topic.trim().length > 0 && (
                <button
                  type="button"
                  onClick={onClearTopic}
                  className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-3 h-3" />
                  Clear topic
                </button>
              )}
            </div>
            <input
              id="video-topic-input"
              name="topic"
              type="text"
              value={topic}
              onChange={(e) => onTopicChange(e.target.value)}
              placeholder="e.g., How I automated 80% of my video editing workflow in 10 minutes"
              aria-invalid={Boolean(validationError)}
              aria-describedby={validationError ? 'topic-validation-error' : undefined}
              className="w-full h-11 px-4 rounded-lg bg-[#0B0F19] border border-slate-700/90 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Platform Dropdown */}
          <div className="lg:col-span-3">
            <label
              htmlFor="platform-select"
              className="block text-sm font-medium text-slate-200 mb-2"
            >
              Platform
            </label>
            <select
              id="platform-select"
              name="platform"
              value={platform}
              onChange={(e) => onPlatformChange(e.target.value as Platform)}
              className="w-full h-11 px-3.5 rounded-lg bg-[#0B0F19] border border-slate-700/90 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p} className="bg-[#0B0F19] text-slate-100">
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Tone Dropdown */}
          <div className="lg:col-span-3">
            <label
              htmlFor="tone-select"
              className="block text-sm font-medium text-slate-200 mb-2"
            >
              Tone
            </label>
            <select
              id="tone-select"
              name="tone"
              value={tone}
              onChange={(e) => onToneChange(e.target.value as Tone)}
              className="w-full h-11 px-3.5 rounded-lg bg-[#0B0F19] border border-slate-700/90 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            >
              {TONES.map((t) => (
                <option key={t} value={t} className="bg-[#0B0F19] text-slate-100">
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {validationError && (
          <div
            id="topic-validation-error"
            role="alert"
            className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-rose-950/50 border border-rose-800/80 text-rose-200 text-sm"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 mr-1">Try sample brief:</span>
            {SAMPLE_IDEAS.map((sample, index) => (
              <button
                key={sample.topic}
                type="button"
                onClick={() => onSelectQuickTopic(sample)}
                className="px-2.5 py-1.5 text-xs font-medium rounded-md bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/70 transition-colors whitespace-nowrap shrink-0"
              >
                Sample 0{index + 1} · {sample.platform}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={isGenerating}
            className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-60 text-white font-medium text-sm transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isGenerating ? 'Generating Strategy...' : 'Generate Strategy'}</span>
          </button>
        </div>
      </form>
    </section>
  );
}
