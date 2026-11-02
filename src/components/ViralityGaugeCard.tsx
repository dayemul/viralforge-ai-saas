import React from 'react';
import { Platform, Tone } from '../types/strategy';
import { getViralityAssessment } from '../utils/strategyUtils';

interface ViralityGaugeCardProps {
  score: number;
  improvementTips: string[];
  platform: Platform;
  tone: Tone;
  estimatedSeconds: number;
}

export function ViralityGaugeCard({
  score,
  improvementTips,
  platform,
  tone,
  estimatedSeconds,
}: ViralityGaugeCardProps) {
  const clampedScore = Math.max(1, Math.min(100, Math.round(score)));
  const assessment = getViralityAssessment(clampedScore);

  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  return (
    <section
      aria-labelledby="virality-score-heading"
      className="h-full bg-[#111827] border border-slate-800/90 rounded-xl p-6 md:p-7 flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
          <div>
            <p className="text-xs text-slate-400">
              <span>{platform}</span>
              <span aria-hidden="true" className="mx-1.5 text-slate-600">
                ·
              </span>
              <span>{tone} Tone</span>
              <span aria-hidden="true" className="mx-1.5 text-slate-600">
                ·
              </span>
              <span className="tabular-nums">{estimatedSeconds}s Runtime</span>
            </p>
            <h2
              id="virality-score-heading"
              className="font-display text-lg font-semibold text-slate-100 mt-1"
            >
              Virality Score &amp; Optimization
            </h2>
          </div>
          <span className={`text-xs font-medium ${assessment.colorClass} whitespace-nowrap shrink-0`}>
            {assessment.label}
          </span>
        </div>

        {/* Circular Gauge + Summary */}
        <div className="py-6 flex flex-col sm:flex-row items-center gap-6 border-b border-slate-800/80">
          <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
            <svg
              className="w-36 h-36 -rotate-90"
              viewBox="0 0 140 140"
              role="img"
              aria-label={`Virality Score ${clampedScore} out of 100`}
            >
              <circle
                cx="70"
                cy="70"
                r={radius}
                stroke="#1E293B"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="70"
                cy="70"
                r={radius}
                stroke={assessment.strokeColor}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span
                data-testid="virality-score-value"
                className="font-mono text-3xl font-bold text-slate-50 tabular-nums"
              >
                {clampedScore}
              </span>
              <span className="text-xs text-slate-400 tabular-nums">/ 100</span>
            </div>
          </div>

          <div className="space-y-2 text-center sm:text-left">
            <div className="text-xs text-slate-400">
              <span>Projected Hold Rate: </span>
              <span className="font-mono text-slate-200 tabular-nums">
                {Math.min(92, Math.max(54, Math.round(clampedScore * 0.86)))}%
              </span>
              <span aria-hidden="true" className="mx-2 text-slate-600">
                ·
              </span>
              <span>3s Hook Index: </span>
              <span className="font-mono text-slate-200 tabular-nums">
                {(clampedScore / 10).toFixed(1)}/10
              </span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              {assessment.description}
            </p>
          </div>
        </div>

        {/* 3 Actionable Improvement Tips */}
        <div className="pt-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-200">
              Actionable Improvement Tips
            </h3>
            <span className="text-xs text-slate-400 tabular-nums">
              {improvementTips.length} Priority Adjustments
            </span>
          </div>

          <ol className="divide-y divide-slate-800/70">
            {improvementTips.slice(0, 3).map((tip, index) => (
              <li
                key={index}
                className="py-3 first:pt-1 last:pb-0 flex items-start gap-3.5 text-sm text-slate-300 leading-relaxed"
              >
                <span className="font-mono text-xs font-semibold text-indigo-400 tabular-nums mt-0.5 shrink-0">
                  0{index + 1}.
                </span>
                <span>{tip}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
