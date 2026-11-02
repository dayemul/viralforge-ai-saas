/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Check,
  Compass,
  Copy,
  Download,
  FileText,
  Gauge,
  Hash,
  Layers,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  Platform,
  SavedStrategy,
  StrategyInput,
  Tone,
  ViralStrategyResponse,
} from './types/strategy';
import {
  buildDeterministicStrategy,
  copyTextToClipboard,
  formatFullSeoForClipboard,
  formatScriptForClipboard,
  formatStrategyToMarkdown,
  INITIAL_SAVED_STRATEGIES,
  loadActiveStrategyIdFromStorage,
  loadSavedStrategiesFromStorage,
  normalizeStrategyResponse,
  parseEstimatedDurationSeconds,
  saveActiveStrategyIdToStorage,
  saveStrategiesToStorage,
  validateStrategyInput,
} from './utils/strategyUtils';
import { StrategyForm } from './components/StrategyForm';
import { ViralityGaugeCard } from './components/ViralityGaugeCard';
import { ViralHooksCard } from './components/ViralHooksCard';
import { ScriptTableCard } from './components/ScriptTableCard';
import { SeoMetadataCard } from './components/SeoMetadataCard';

export default function App() {
  const [savedStrategies, setSavedStrategies] = useState<SavedStrategy[]>(() =>
    loadSavedStrategiesFromStorage()
  );
  const [activeStrategyId, setActiveStrategyId] = useState<string>(() => {
    const list = loadSavedStrategiesFromStorage();
    return loadActiveStrategyIdFromStorage(list);
  });

  const activeStrategy: SavedStrategy | null =
    savedStrategies.find((s) => s.id === activeStrategyId) ??
    savedStrategies[0] ??
    null;

  const [topic, setTopic] = useState<string>(() => {
    const list = loadSavedStrategiesFromStorage();
    const activeId = loadActiveStrategyIdFromStorage(list);
    const item = list.find((s) => s.id === activeId) ?? list[0];
    return item ? item.topic : INITIAL_SAVED_STRATEGIES[0].topic;
  });
  const [platform, setPlatform] = useState<Platform>(() => {
    const list = loadSavedStrategiesFromStorage();
    const activeId = loadActiveStrategyIdFromStorage(list);
    const item = list.find((s) => s.id === activeId) ?? list[0];
    return item ? item.platform : INITIAL_SAVED_STRATEGIES[0].platform;
  });
  const [tone, setTone] = useState<Tone>(() => {
    const list = loadSavedStrategiesFromStorage();
    const activeId = loadActiveStrategyIdFromStorage(list);
    const item = list.find((s) => s.id === activeId) ?? list[0];
    return item ? item.tone : INITIAL_SAVED_STRATEGIES[0].tone;
  });

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [copiedBrief, setCopiedBrief] = useState<boolean>(false);

  // Sync saved strategies to localStorage whenever changed
  useEffect(() => {
    saveStrategiesToStorage(savedStrategies);
  }, [savedStrategies]);

  // Sync active strategy selection to localStorage whenever changed
  useEffect(() => {
    if (activeStrategyId) {
      saveActiveStrategyIdToStorage(activeStrategyId);
    }
  }, [activeStrategyId]);

  const handleCopyText = async (text: string, label: string) => {
    await copyTextToClipboard(text);
    setCopyToast(`Copied ${label} to clipboard`);
    window.setTimeout(() => {
      setCopyToast((prev) =>
        prev === `Copied ${label} to clipboard` ? null : prev
      );
    }, 2500);
  };

  const handleSelectSavedStrategy = (strategy: SavedStrategy) => {
    setActiveStrategyId(strategy.id);
    saveActiveStrategyIdToStorage(strategy.id);
    setTopic(strategy.topic);
    setPlatform(strategy.platform);
    setTone(strategy.tone);
    setValidationError(null);
  };

  const handleDeleteSavedStrategy = (id: string) => {
    setSavedStrategies((prev) => {
      const next = prev.filter((item) => item.id !== id);
      if (activeStrategyId === id && next.length > 0) {
        setActiveStrategyId(next[0].id);
        saveActiveStrategyIdToStorage(next[0].id);
        setTopic(next[0].topic);
        setPlatform(next[0].platform);
        setTone(next[0].tone);
      }
      saveStrategiesToStorage(next);
      return next;
    });
  };

  const handleStartBlankBrief = () => {
    setTopic('');
    setValidationError(null);
    const inputEl = document.getElementById('video-topic-input');
    if (inputEl) {
      inputEl.focus();
    }
  };

  const executeGeneration = async (input: StrategyInput) => {
    const check = validateStrategyInput(input);
    if (!check.valid) {
      setValidationError(check.error ?? 'Invalid strategy input.');
      return;
    }

    setValidationError(null);
    setIsGenerating(true);

    try {
      const response = await fetch('/api/generate-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      let generated: ViralStrategyResponse;
      let source: 'ai' | 'blueprint' = 'ai';

      if (response.ok) {
        const data = (await response.json()) as {
          strategy?: unknown;
          source?: 'ai' | 'blueprint';
        };
        generated = normalizeStrategyResponse(data.strategy, input);
        source = data.source ?? 'ai';
      } else {
        generated = buildDeterministicStrategy(input);
        source = 'blueprint';
      }

      const newEntry: SavedStrategy = {
        ...generated,
        id: `strategy-${Date.now()}`,
        topic: input.topic.trim(),
        platform: input.platform,
        tone: input.tone,
        createdAt: 'Just now',
        source,
      };

      setSavedStrategies((prev) => {
        const next = [newEntry, ...prev];
        saveStrategiesToStorage(next);
        return next;
      });
      setActiveStrategyId(newEntry.id);
      saveActiveStrategyIdToStorage(newEntry.id);
    } catch {
      const fallback = buildDeterministicStrategy(input);
      const newEntry: SavedStrategy = {
        ...fallback,
        id: `strategy-${Date.now()}`,
        topic: input.topic.trim(),
        platform: input.platform,
        tone: input.tone,
        createdAt: 'Just now',
        source: 'blueprint',
      };
      setSavedStrategies((prev) => {
        const next = [newEntry, ...prev];
        saveStrategiesToStorage(next);
        return next;
      });
      setActiveStrategyId(newEntry.id);
      saveActiveStrategyIdToStorage(newEntry.id);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeGeneration({ topic, platform, tone });
  };

  const handleSelectQuickTopic = async (preset: StrategyInput) => {
    setTopic(preset.topic);
    setPlatform(preset.platform);
    setTone(preset.tone);
    setValidationError(null);

    const existing = savedStrategies.find(
      (s) =>
        s.topic.toLowerCase() === preset.topic.toLowerCase() &&
        s.platform === preset.platform &&
        s.tone === preset.tone
    );
    if (existing) {
      setActiveStrategyId(existing.id);
      saveActiveStrategyIdToStorage(existing.id);
      return;
    }
    await executeGeneration(preset);
  };

  const handleExportFullStrategy = () => {
    if (!activeStrategy) return;
    const markdown = formatStrategyToMarkdown(activeStrategy);
    handleCopyText(markdown, 'Full Brief (Markdown)');
    setCopiedBrief(true);
    window.setTimeout(() => {
      setCopiedBrief(false);
    }, 2200);
  };

  const estimatedSeconds = activeStrategy
    ? parseEstimatedDurationSeconds(activeStrategy.script)
    : 30;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col">
      {/* Top Bar Contract: Strictly 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 h-16 bg-[#0B0F19]/95 backdrop-blur border-b border-slate-800/90 px-6 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#strategy-studio"
          className="font-display text-lg font-bold tracking-tight text-slate-50 whitespace-nowrap shrink-0"
        >
          ViralForge AI
        </a>

        {/* Zone 2: 4 concise single-line navigation links */}
        <nav
          aria-label="Primary Workspace Navigation"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400"
        >
          <a
            href="#strategy-studio"
            className="hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Strategy Studio
          </a>
          <a
            href="#viral-hooks"
            className="hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Viral Hooks
          </a>
          <a
            href="#script-table"
            className="hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Script Table
          </a>
          <a
            href="#seo-metadata"
            className="hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            SEO Metadata
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={handleExportFullStrategy}
            disabled={!activeStrategy}
            title="Copy entire strategy brief formatted as Markdown"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-100 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 border border-slate-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {copiedBrief ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied Markdown!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-indigo-400" />
                <span>Copy Full Brief</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Workspace Grid: Sidebar + Content Viewport */}
      <div className="flex-1 max-w-[1440px] w-full mx-auto flex flex-col lg:flex-row">
        {/* Left Sidebar Navigation & Saved Blueprints (272px on desktop) */}
        <aside
          aria-label="Saved Strategy Blueprints"
          className="w-full lg:w-[272px] shrink-0 border-b lg:border-b-0 lg:border-r border-slate-800/90 bg-[#0D1322] p-5 flex flex-col justify-between gap-6 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:overflow-y-auto"
        >
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-slate-400 tracking-wide">
                  Workspace Sections
                </h2>
              </div>
              <ul className="space-y-1 text-sm">
                <li>
                  <a
                    href="#strategy-studio"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-200 hover:bg-slate-800/60 transition-colors whitespace-nowrap"
                  >
                    <Compass className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Input Brief</span>
                  </a>
                </li>
                <li>
                  <a
                    href="#viral-hooks"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800/60 transition-colors whitespace-nowrap"
                  >
                    <Gauge className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Score &amp; 5 Hooks</span>
                  </a>
                </li>
                <li>
                  <a
                    href="#script-table"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800/60 transition-colors whitespace-nowrap"
                  >
                    <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Script Breakdown</span>
                  </a>
                </li>
                <li>
                  <a
                    href="#seo-metadata"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800/60 transition-colors whitespace-nowrap"
                  >
                    <Hash className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>SEO &amp; Metadata</span>
                  </a>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-slate-400 tracking-wide">
                  Recent Strategies ({savedStrategies.length})
                </h2>
                <button
                  type="button"
                  onClick={handleStartBlankBrief}
                  className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Brief</span>
                </button>
              </div>

              <ul className="space-y-2">
                {savedStrategies.map((item) => {
                  const isActive = activeStrategy?.id === item.id;
                  return (
                    <li key={item.id} className="group relative">
                      <button
                        type="button"
                        onClick={() => handleSelectSavedStrategy(item)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-slate-800/90 border-indigo-500/60 text-slate-50'
                            : 'bg-[#111827]/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/40 hover:text-slate-100'
                        }`}
                      >
                        <p className="text-xs font-medium line-clamp-2 pr-5 leading-snug">
                          {item.topic}
                        </p>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 tabular-nums">
                          <span>
                            {item.platform} · {item.tone}
                          </span>
                          <span className="font-mono font-semibold text-emerald-400">
                            {item.viralityScore}/100
                          </span>
                        </div>
                      </button>
                      {savedStrategies.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteSavedStrategy(item.id)}
                          aria-label={`Delete strategy ${item.topic}`}
                          className="opacity-0 group-hover:opacity-100 focus:opacity-100 absolute top-2.5 right-2 p-1 rounded text-slate-500 hover:text-rose-400 transition-opacity cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 text-xs text-slate-400 space-y-1">
            <div className="flex items-center gap-2 text-slate-300 font-medium">
              <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>Retention Benchmarks</span>
            </div>
            <p className="leading-relaxed">
              Aim for &ge;78% 3-second hold rate and a visual pattern interrupt every 4–6 seconds.
            </p>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <main className="flex-1 min-w-0 p-6 md:p-8 space-y-8">
          {/* Toast feedback banner for clipboard actions */}
          {copyToast && (
            <div
              role="status"
              aria-live="polite"
              className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 border border-emerald-500/50 text-slate-100 text-xs font-medium shadow-lg"
            >
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{copyToast}</span>
            </div>
          )}

          {/* 1. Input Section */}
          <StrategyForm
            topic={topic}
            platform={platform}
            tone={tone}
            isGenerating={isGenerating}
            validationError={validationError}
            onTopicChange={(value) => {
              setTopic(value);
              if (validationError) setValidationError(null);
            }}
            onPlatformChange={setPlatform}
            onToneChange={setTone}
            onSubmit={handleSubmit}
            onSelectQuickTopic={handleSelectQuickTopic}
            onClearTopic={handleStartBlankBrief}
          />

          {/* 2. Output Dashboard */}
          {isGenerating ? (
            <div
              aria-busy="true"
              aria-label="Generating strategy output"
              className="space-y-6"
            >
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div className="xl:col-span-5 h-[420px] rounded-xl bg-[#111827] border border-slate-800/80 p-6 flex flex-col justify-between">
                  <div className="h-5 w-48 bg-slate-800 rounded" />
                  <div className="my-auto flex items-center gap-6">
                    <div className="w-32 h-32 rounded-full border-8 border-slate-800 shrink-0" />
                    <div className="space-y-3 flex-1">
                      <div className="h-4 w-3/4 bg-slate-800 rounded" />
                      <div className="h-3 w-full bg-slate-800/70 rounded" />
                      <div className="h-3 w-2/3 bg-slate-800/70 rounded" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 w-full bg-slate-800/80 rounded" />
                    <div className="h-4 w-11/12 bg-slate-800/80 rounded" />
                    <div className="h-4 w-4/5 bg-slate-800/80 rounded" />
                  </div>
                </div>
                <div className="xl:col-span-7 h-[420px] rounded-xl bg-[#111827] border border-slate-800/80 p-6 space-y-4">
                  <div className="h-5 w-52 bg-slate-800 rounded" />
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div
                      key={n}
                      className="h-14 w-full bg-slate-800/60 rounded-lg"
                    />
                  ))}
                </div>
              </div>
              <div className="h-80 rounded-xl bg-[#111827] border border-slate-800/80 p-6" />
            </div>
          ) : activeStrategy ? (
            <div data-testid="output-dashboard" className="space-y-8">
              {/* Active Strategy Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
                <div>
                  <p className="text-xs text-slate-400">
                    <span>Active Strategy Output</span>
                    <span aria-hidden="true" className="mx-1.5 text-slate-600">
                      ·
                    </span>
                    <span>{activeStrategy.platform}</span>
                    <span aria-hidden="true" className="mx-1.5 text-slate-600">
                      ·
                    </span>
                    <span>{activeStrategy.tone}</span>
                    <span aria-hidden="true" className="mx-1.5 text-slate-600">
                      ·
                    </span>
                    <span className="tabular-nums">{activeStrategy.createdAt}</span>
                  </p>
                  <h2 className="font-display text-xl font-bold text-slate-100 mt-0.5">
                    {activeStrategy.topic}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleExportFullStrategy}
                  title="Copy complete strategy brief formatted as Markdown"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 rounded-lg transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
                >
                  {copiedBrief ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Copied Markdown!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Copy Full Brief (Markdown)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Row 1: Virality Score + 3 Improvement Tips (Left 5 cols) & 5 Viral Hooks (Right 7 cols) */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
                <div className="xl:col-span-5 flex flex-col">
                  <ViralityGaugeCard
                    score={activeStrategy.viralityScore}
                    improvementTips={activeStrategy.improvementTips}
                    platform={activeStrategy.platform}
                    tone={activeStrategy.tone}
                    estimatedSeconds={estimatedSeconds}
                  />
                </div>
                <div className="xl:col-span-7 flex flex-col">
                  <ViralHooksCard
                    hooks={activeStrategy.hooks}
                    onCopyText={handleCopyText}
                  />
                </div>
              </div>

              {/* Row 2: Structured Script Table ([Time], [Visual/B-Roll], [Audio/Voiceover], [On-Screen Text]) */}
              <ScriptTableCard
                script={activeStrategy.script}
                topic={activeStrategy.topic}
                platform={activeStrategy.platform}
                tone={activeStrategy.tone}
                onCopyText={handleCopyText}
              />

              {/* Row 3: SEO & Metadata Card (Title, Caption, Hashtags) */}
              <SeoMetadataCard
                seo={activeStrategy.seo}
                platform={activeStrategy.platform}
                onCopyText={handleCopyText}
              />
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
