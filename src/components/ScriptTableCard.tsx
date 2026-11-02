import React, { useState } from 'react';
import { Check, Copy, Search } from 'lucide-react';
import { Platform, ScriptSegment, Tone } from '../types/strategy';
import { formatScriptForClipboard } from '../utils/strategyUtils';

interface ScriptTableCardProps {
  script: ScriptSegment[];
  topic: string;
  platform: Platform;
  tone: Tone;
  onCopyText: (text: string, label: string) => void;
}

export function ScriptTableCard({
  script,
  topic,
  platform,
  tone,
  onCopyText,
}: ScriptTableCardProps) {
  const [copiedFull, setCopiedFull] = useState(false);
  const [copiedRowIndex, setCopiedRowIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredScript = script.filter((seg) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      seg.time.toLowerCase().includes(q) ||
      seg.visual.toLowerCase().includes(q) ||
      seg.audio.toLowerCase().includes(q) ||
      seg.onScreenText.toLowerCase().includes(q)
    );
  });

  const handleCopyFullScript = () => {
    const formatted = formatScriptForClipboard(script, { topic, platform, tone });
    onCopyText(formatted, 'Full Script');
    setCopiedFull(true);
    window.setTimeout(() => setCopiedFull(false), 2000);
  };

  const handleCopySegment = (seg: ScriptSegment, index: number) => {
    const text = `[${seg.time}] VISUAL: ${seg.visual} | AUDIO: "${seg.audio}" | ON-SCREEN TEXT: [${seg.onScreenText}]`;
    onCopyText(text, `Script Segment ${seg.time}`);
    setCopiedRowIndex(index);
    window.setTimeout(() => {
      setCopiedRowIndex((prev) => (prev === index ? null : prev));
    }, 1800);
  };

  return (
    <section
      id="script-table"
      aria-labelledby="script-table-heading"
      className="bg-[#111827] border border-slate-800/90 rounded-xl p-6 md:p-7"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
        <div>
          <p className="text-xs text-slate-400">
            <span>Time-Coded Production Sheet</span>
            <span aria-hidden="true" className="mx-1.5 text-slate-600">
              ·
            </span>
            <span className="tabular-nums">{script.length} Beats</span>
            <span aria-hidden="true" className="mx-1.5 text-slate-600">
              ·
            </span>
            <span>{platform}</span>
          </p>
          <h2
            id="script-table-heading"
            className="font-display text-lg font-semibold text-slate-100 mt-1"
          >
            Script Table Breakdown
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter script beats..."
              aria-label="Filter script beats"
              className="h-9 pl-8 pr-3 rounded-lg bg-[#0B0F19] border border-slate-700/80 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="button"
            onClick={handleCopyFullScript}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {copiedFull ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-200" />
                <span>Copied Full Script</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Full Script</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400">
              <th scope="col" className="py-3 pr-4 w-32 whitespace-nowrap">
                Time
              </th>
              <th scope="col" className="py-3 px-4 min-w-[220px]">
                Visual / B-Roll
              </th>
              <th scope="col" className="py-3 px-4 min-w-[260px]">
                Audio / Voiceover
              </th>
              <th scope="col" className="py-3 pl-4 min-w-[190px]">
                On-Screen Text
              </th>
              <th scope="col" className="py-3 pl-3 w-20 text-right">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70 text-sm">
            {filteredScript.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 text-sm">
                  No script segments match &ldquo;{searchQuery}&rdquo;.{' '}
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-indigo-400 hover:underline ml-1"
                  >
                    Reset filter
                  </button>
                </td>
              </tr>
            ) : (
              filteredScript.map((row, index) => {
                const isRowCopied = copiedRowIndex === index;
                return (
                  <tr
                    key={`${row.time}-${index}`}
                    className="hover:bg-slate-800/30 transition-colors align-top"
                  >
                    <td className="py-4 pr-4 font-mono text-xs font-semibold text-indigo-400 tabular-nums whitespace-nowrap">
                      {row.time}
                    </td>
                    <td className="py-4 px-4 text-slate-300 leading-relaxed">
                      {row.visual}
                    </td>
                    <td className="py-4 px-4 text-slate-100 font-medium leading-relaxed">
                      &ldquo;{row.audio}&rdquo;
                    </td>
                    <td className="py-4 pl-4 font-mono text-xs text-emerald-300 leading-relaxed">
                      {row.onScreenText}
                    </td>
                    <td className="py-4 pl-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleCopySegment(row, index)}
                        aria-label={`Copy segment ${row.time}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#0B0F19] hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-300 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      >
                        {isRowCopied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-300">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-400" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
