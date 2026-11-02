import {
  Platform,
  ScriptSegment,
  SavedStrategy,
  StrategyInput,
  Tone,
  ViralStrategyResponse,
} from '../types/strategy';

export const PLATFORMS: Platform[] = [
  'TikTok',
  'Instagram Reels',
  'YouTube Shorts',
];

export const TONES: Tone[] = [
  'Energetic',
  'Educational',
  'Storytelling',
  'Controversial',
];

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateStrategyInput(input: Partial<StrategyInput>): ValidationResult {
  const trimmedTopic = (input.topic ?? '').trim();
  if (!trimmedTopic) {
    return {
      valid: false,
      error: 'Please enter a video topic or idea before generating a strategy.',
    };
  }
  if (trimmedTopic.length < 4) {
    return {
      valid: false,
      error: 'Topic must be at least 4 characters long so the strategist can craft specific hooks.',
    };
  }
  if (!input.platform || !PLATFORMS.includes(input.platform)) {
    return {
      valid: false,
      error: 'Please select a valid target platform.',
    };
  }
  if (!input.tone || !TONES.includes(input.tone)) {
    return {
      valid: false,
      error: 'Please select a valid video tone.',
    };
  }
  return { valid: true };
}

export function getViralityAssessment(score: number): {
  label: string;
  description: string;
  colorClass: string;
  strokeColor: string;
} {
  const clamped = Math.max(1, Math.min(100, Math.round(score)));
  if (clamped >= 85) {
    return {
      label: 'High Breakout Potential',
      description: 'Strong curiosity gap, rapid visual pacing, and high completion probability.',
      colorClass: 'text-emerald-400',
      strokeColor: '#10B981',
    };
  }
  if (clamped >= 70) {
    return {
      label: 'Strong Retention',
      description: 'Solid hook mechanics; tighten mid-video pattern interrupts to push past 85.',
      colorClass: 'text-indigo-400',
      strokeColor: '#6366F1',
    };
  }
  return {
    label: 'Needs Hook Sharpening',
    description: 'Refine the first 3 seconds and add stronger visual contrast to prevent early swipe-away.',
    colorClass: 'text-amber-400',
    strokeColor: '#F59E0B',
  };
}

export function formatScriptForClipboard(
  script: ScriptSegment[],
  metadata?: { topic?: string; platform?: Platform; tone?: Tone }
): string {
  const headerLines: string[] = [];
  if (metadata?.topic) {
    headerLines.push(`TOPIC: ${metadata.topic}`);
  }
  if (metadata?.platform || metadata?.tone) {
    headerLines.push(
      `PLATFORM: ${metadata.platform ?? 'Short-Form'} | TONE: ${metadata.tone ?? 'Standard'}`
    );
  }
  if (headerLines.length > 0) {
    headerLines.push('------------------------------------------------------------');
  }

  const bodyLines = script.map(
    (row, idx) =>
      `[${idx + 1}] TIME: ${row.time}\n` +
      `VISUAL / B-ROLL: ${row.visual}\n` +
      `AUDIO / VOICEOVER: "${row.audio}"\n` +
      `ON-SCREEN TEXT: [${row.onScreenText}]`
  );

  return [...headerLines, ...bodyLines].join('\n\n');
}

export function formatHashtagsForClipboard(hashtags: string[]): string {
  return hashtags
    .map((tag) => {
      const cleaned = tag.trim().replace(/^#+/, '');
      return cleaned ? `#${cleaned}` : '';
    })
    .filter(Boolean)
    .join(' ');
}

export function formatFullSeoForClipboard(seo: {
  title: string;
  caption: string;
  hashtags: string[];
}): string {
  const tags = formatHashtagsForClipboard(seo.hashtags);
  return `${seo.title}\n\n${seo.caption}\n\n${tags}`.trim();
}

export function parseEstimatedDurationSeconds(script: ScriptSegment[]): number {
  if (!script || script.length === 0) return 0;
  let maxSecond = 0;
  for (const seg of script) {
    const matches = seg.time.match(/(\d+)\s*s?/g);
    if (matches) {
      for (const m of matches) {
        const val = parseInt(m.replace(/\D/g, ''), 10);
        if (!Number.isNaN(val) && val > maxSecond) {
          maxSecond = val;
        }
      }
    }
  }
  return maxSecond || script.length * 6;
}

export function normalizeStrategyResponse(
  raw: unknown,
  fallbackInput: StrategyInput
): ViralStrategyResponse {
  const fallback = buildDeterministicStrategy(fallbackInput);
  if (!raw || typeof raw !== 'object') {
    return fallback;
  }

  const obj = raw as Record<string, unknown>;
  const rawScore = typeof obj.viralityScore === 'number' ? obj.viralityScore : Number(obj.viralityScore);
  const viralityScore = Number.isFinite(rawScore)
    ? Math.max(1, Math.min(100, Math.round(rawScore)))
    : fallback.viralityScore;

  const improvementTips = Array.isArray(obj.improvementTips)
    ? obj.improvementTips
        .map((item) => String(item ?? '').trim())
        .filter(Boolean)
        .slice(0, 3)
    : [];
  while (improvementTips.length < 3) {
    improvementTips.push(fallback.improvementTips[improvementTips.length]);
  }

  const hooks = Array.isArray(obj.hooks)
    ? obj.hooks
        .map((item) => String(item ?? '').trim())
        .filter(Boolean)
        .slice(0, 5)
    : [];
  while (hooks.length < 5) {
    hooks.push(fallback.hooks[hooks.length]);
  }

  const script: ScriptSegment[] = Array.isArray(obj.script)
    ? obj.script
        .map((item, idx) => {
          if (!item || typeof item !== 'object') return null;
          const seg = item as Record<string, unknown>;
          const fbSeg = fallback.script[idx % fallback.script.length];
          return {
            time: String(seg.time ?? fbSeg.time).trim() || fbSeg.time,
            visual: String(seg.visual ?? fbSeg.visual).trim() || fbSeg.visual,
            audio: String(seg.audio ?? fbSeg.audio).trim() || fbSeg.audio,
            onScreenText:
              String(seg.onScreenText ?? fbSeg.onScreenText).trim() || fbSeg.onScreenText,
          };
        })
        .filter((item): item is ScriptSegment => item !== null)
    : [];

  const finalScript = script.length >= 3 ? script : fallback.script;

  const rawSeo = (obj.seo && typeof obj.seo === 'object' ? obj.seo : {}) as Record<
    string,
    unknown
  >;
  const rawHashtags = Array.isArray(rawSeo.hashtags)
    ? rawSeo.hashtags
        .map((t) => String(t ?? '').trim().replace(/^#+/, ''))
        .filter(Boolean)
    : [];

  return {
    viralityScore,
    improvementTips,
    hooks,
    script: finalScript,
    seo: {
      title: String(rawSeo.title ?? fallback.seo.title).trim() || fallback.seo.title,
      caption: String(rawSeo.caption ?? fallback.seo.caption).trim() || fallback.seo.caption,
      hashtags:
        rawHashtags.length >= 3
          ? rawHashtags.map((t) => `#${t}`)
          : fallback.seo.hashtags.map((t) => `#${t.replace(/^#+/, '')}`),
    },
  };
}

export function buildDeterministicStrategy(input: StrategyInput): ViralStrategyResponse {
  const cleanTopic = input.topic.trim() || 'Short-Form Creator Workflow';
  const platform = input.platform || 'TikTok';
  const tone = input.tone || 'Energetic';

  const hash = Array.from(`${cleanTopic}|${platform}|${tone}`).reduce(
    (acc, ch) => (acc * 31 + ch.charCodeAt(0)) % 1000,
    7
  );
  const viralityScore = 82 + (hash % 14); // 82 - 95

  const platformNuance: Record<Platform, string> = {
    TikTok: 'Add a native comment-bait question in the final 2 seconds to trigger algorithmic replies.',
    'Instagram Reels':
      'Optimize for DM shares and saves by placing a summary checklist frame at 0:24.',
    'YouTube Shorts':
      'Seamless loop the final spoken word back into the opening hook sentence for >105% average view duration.',
  };

  const toneNuance: Record<Tone, string> = {
    Energetic: 'Cut every dead breath >120ms and pair camera zoom-ins with high-contrast kinetic captions.',
    Educational: 'Show the finished proof or outcome in frame 1 before explaining the 3-step mechanism.',
    Storytelling: 'Open mid-conflict at peak tension before flashing back to the inciting mistake.',
    Controversial: 'Challenge a widely held industry belief in the first 2.5 seconds with a concrete counter-metric.',
  };

  const improvementTips: [string, string, string] = [
    toneNuance[tone],
    platformNuance[platform],
    `Insert a visual pattern interrupt at 0:09 (angle switch or B-roll overlay) while unpacking "${cleanTopic}".`,
  ];

  const hooksByTone: Record<Tone, [string, string, string, string, string]> = {
    Energetic: [
      `Stop scrolling if you care about ${cleanTopic}—this 15-second tweak changes everything.`,
      `I tested 40 different ways to master ${cleanTopic}, and only these 3 actually worked.`,
      `You are wasting 4 hours a week on ${cleanTopic} because of this one setting.`,
      `Here is the exact blueprint top 1% creators use for ${cleanTopic} in 2026.`,
      `Give me 28 seconds and I will permanently fix how you approach ${cleanTopic}.`,
    ],
    Educational: [
      `Most people get ${cleanTopic} backwards—here is the 3-step framework that works.`,
      `If I had to learn ${cleanTopic} from scratch today, this is the exact checklist I'd follow.`,
      `The real reason your ${cleanTopic} stalls after week two comes down to one metric.`,
      `Three non-obvious rules about ${cleanTopic} that save 10+ hours every month.`,
      `Let's break down the science behind ${cleanTopic} in under 35 seconds.`,
    ],
    Storytelling: [
      `Six months ago I almost quit over ${cleanTopic}—until I noticed this tiny pattern.`,
      `Everyone told me my approach to ${cleanTopic} was broken, so I ran a 30-day experiment.`,
      `At 2:00 AM last Tuesday, I realized everything I knew about ${cleanTopic} was wrong.`,
      `This single mistake with ${cleanTopic} cost me 3 months of momentum. Don't repeat it.`,
      `I shadowed an expert in ${cleanTopic} for a week—what I saw in the first 10 minutes shocked me.`,
    ],
    Controversial: [
      `Unpopular opinion: 95% of advice about ${cleanTopic} is keeping you stuck.`,
      `Stop following the standard playbook for ${cleanTopic}—it was built for 2022 algorithms.`,
      `Everything gurus tell you about ${cleanTopic} is a lie designed to waste your time.`,
      `Why working harder on ${cleanTopic} actually lowers your results (and what to do instead).`,
      `The "best practice" for ${cleanTopic} is dead. Here is what replaced it.`,
    ],
  };

  const script: ScriptSegment[] = [
    {
      time: '0:00 - 0:03',
      visual: `Tight medium close-up, handheld micro-movement. Creator holds up a visual prop or split-screen proof of "${cleanTopic}".`,
      audio: hooksByTone[tone][0],
      onScreenText: `THE ${cleanTopic.toUpperCase().slice(0, 26)} TRAP`,
    },
    {
      time: '0:03 - 0:09',
      visual: `Fast whip-pan to over-the-shoulder screen recording demonstrating the common mistake people make with ${cleanTopic}.`,
      audio: `Most creators spend hours tweaking surface details, completely ignoring the core bottleneck that drives 80% of the outcome.`,
      onScreenText: `❌ Mistake: Focusing on the wrong 20%`,
    },
    {
      time: '0:09 - 0:17',
      visual: `Clean B-roll montage with 1.5s cuts: step-by-step breakdown on a dark-mode workspace canvas with highlighted callouts.`,
      audio: `Step one: strip away the friction. Step two: lock in a repeatable 3-second hook structure before you ever press record.`,
      onScreenText: `1. Strip Friction  2. Lock the 3s Hook`,
    },
    {
      time: '0:17 - 0:25',
      visual: `Side-by-side comparison graph showing retention curve before vs. after applying the ${cleanTopic} framework.`,
      audio: `When we applied this exact shift on ${platform}, average watch time jumped by 42% in a single week.`,
      onScreenText: `+42% Watch Time on ${platform}`,
    },
    {
      time: '0:25 - 0:30',
      visual: `Direct eye contact, subtle push-in zoom, clean summary checklist card pinned in upper third for easy screenshot/save.`,
      audio: `Save this checklist before your next upload—and drop a comment if you want part two.`,
      onScreenText: `SAVE THIS BLUEPRINT ↗`,
    },
  ];

  const slugWords = cleanTopic
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 3);

  const platformTag =
    platform === 'TikTok'
      ? '#tiktokgrowth'
      : platform === 'Instagram Reels'
      ? '#reelsstrategy'
      : '#youtubeshorts';

  const hashtags = [
    platformTag,
    `#${tone.toLowerCase()}content`,
    ...slugWords.map((w) => `#${w}`),
    '#shortformvideo',
    '#creatorstrategy',
    '#viralhooks',
  ].slice(0, 7);

  return {
    viralityScore,
    improvementTips,
    hooks: hooksByTone[tone],
    script,
    seo: {
      title: `How to Master ${cleanTopic} (${tone} ${platform} Blueprint)`,
      caption: `Stop overcomplicating ${cleanTopic}. Here is the exact 30-second breakdown we use on ${platform} to keep retention above 75% from the very first frame. Save this for your next shoot and test Hook #2 on your next upload.`,
      hashtags,
    },
  };
}

export const INITIAL_SAVED_STRATEGIES: SavedStrategy[] = [
  {
    id: 'preset-automation-workflow',
    topic: 'How I automated 80% of my video editing workflow in 10 minutes',
    platform: 'TikTok',
    tone: 'Energetic',
    createdAt: 'Today · 08:15 AM',
    source: 'blueprint',
    viralityScore: 91,
    improvementTips: [
      'Open on the timeline speed-ramp comparison in the first 1.2 seconds so viewers immediately see the 10-minute payoff.',
      'Drop a 120Hz sound riser right before the 0:09 B-roll transition to prevent mid-scroll drop-off.',
      'Pin a single-frame shortcut cheat sheet at 0:26 to drive high-intent bookmarks and shares.',
    ],
    hooks: [
      'Stop editing manually—this 10-minute automation just cut my post-production time by 80%.',
      'I used to spend 6 hours editing a 30-second TikTok until I built this 3-step pipeline.',
      'Every top creator uses this hidden timeline macro, and nobody is talking about it.',
      'Watch me turn a raw 20-minute voice memo into a finished short in 600 seconds flat.',
      'If you still cut silences by hand in 2026, give me 25 seconds to save your weekend.',
    ],
    script: [
      {
        time: '0:00 - 0:03',
        visual: 'Split-screen: Left shows a chaotic 4-hour timeline; Right shows a single hotkey snapping 40 cuts into place instantly.',
        audio: 'Stop editing manually—this 10-minute automation just cut my post-production time by 80%.',
        onScreenText: '4 HOURS ➔ 10 MINUTES',
      },
      {
        time: '0:03 - 0:09',
        visual: 'Macro close-up of keyboard shortcut execution, cutting to crisp screen capture of auto-silence removal (-38dB threshold).',
        audio: 'First, stop cutting dead air by hand. Set your strip-silence threshold to negative 38 decibels with a 90-millisecond pad.',
        onScreenText: 'STEP 1: -38dB Silence Strip (90ms pad)',
      },
      {
        time: '0:09 - 0:17',
        visual: 'Fast whip-pan to dynamic B-roll folder auto-matching transcript keywords onto Track V2.',
        audio: 'Second, tag your B-roll folder by emotion and action verbs so your timeline auto-populates visual interrupts every 4 seconds.',
        onScreenText: 'STEP 2: Keyword B-Roll Injection',
      },
      {
        time: '0:17 - 0:24',
        visual: 'Side-by-side retention graph showing 78% completion rate with dynamic caption presets.',
        audio: 'Third, apply a two-weight kinetic caption preset that highlights only the power noun on each beat.',
        onScreenText: 'STEP 3: Single-Noun Kinetic Captions',
      },
      {
        time: '0:24 - 0:30',
        visual: 'Creator leans into frame holding a clean summary card; subtle zoom-in for seamless audio loop.',
        audio: 'Screenshot this 3-step settings card right now so you have it open on your next edit.',
        onScreenText: 'SCREENSHOT THE SETTINGS CARD ↗',
      },
    ],
    seo: {
      title: 'How I Automated 80% of My Video Editing Workflow in 10 Minutes',
      caption: 'Editing short-form shouldn’t take longer than filming it. Here is the exact 3-step pipeline (-38dB silence strip + keyword B-roll + single-noun kinetic captions) that took my edit time from 4 hours down to 10 minutes. Save this settings card for your next session.',
      hashtags: [
        '#videoediting',
        '#tiktokgrowth',
        '#creatortools',
        '#editingworkflow',
        '#shortformvideo',
        '#contentcreator',
      ],
    },
  },
  {
    id: 'preset-neuroscience-morning',
    topic: 'Why 99% of morning routines fail according to neuroscience',
    platform: 'YouTube Shorts',
    tone: 'Controversial',
    createdAt: 'Yesterday · 06:40 PM',
    source: 'blueprint',
    viralityScore: 88,
    improvementTips: [
      'Contrast the cliché 4:30 AM ice-bath montage with a stark red strike-through in the first 2 seconds.',
      'Display the cortisol-dopamine curve graphic at 0:11 to anchor the contrarian claim in concrete data.',
      'End the final spoken word on an unfinished conjunction that loops directly back into the opening hook.',
    ],
    hooks: [
      'Your 5:00 AM morning routine is biologically sabotaging your focus before 10:00 AM.',
      'Neuroscientists agree: 99% of productivity morning routines are built backwards.',
      'Stop checking your task list in the first 45 minutes after waking up—here is what happens to your brain.',
      'The cold-plunge and journal routine is killing your deep-work capacity. Let me prove it.',
      'Everything hustle culture taught you about dopamine in the morning is scientifically wrong.',
    ],
    script: [
      {
        time: '0:00 - 0:03',
        visual: 'Montage of cliché 5 AM alarm and journal snaps to black with a sharp waveform graphic.',
        audio: 'Your 5:00 AM morning routine is biologically sabotaging your focus before 10:00 AM.',
        onScreenText: '99% OF MORNING ROUTINES FAIL',
      },
      {
        time: '0:03 - 0:10',
        visual: 'Animated dark-mode brainwave transition diagram: Theta to Alpha state window during first 30 minutes.',
        audio: 'When you wake up, your brain transitions through alpha waves. Flooding it with novelty spikes cheap dopamine and burns out your prefrontal cortex.',
        onScreenText: 'Alpha State ≠ High-Friction Tasks',
      },
      {
        time: '0:10 - 0:19',
        visual: 'Creator walks outdoors into natural sunlight while a timer overlay counts 12 minutes.',
        audio: 'Instead of a 12-step checklist, lock in two inputs: 10 minutes of optic-flow sunlight and zero algorithmic inputs for the first hour.',
        onScreenText: '1. Optic Sunlight  2. Zero Feeds for 60m',
      },
      {
        time: '0:19 - 0:27',
        visual: 'Desk overhead shot: single index card with one priority task circled in high-contrast ink.',
        audio: 'Start your hardest cognitive block while baseline dopamine is clean—and watch your output double by noon.',
        onScreenText: 'Clean Baseline = 2x Deep Work',
      },
    ],
    seo: {
      title: 'Why 99% of Morning Routines Fail (Neuroscience Breakdown)',
      caption: 'More steps in your morning routine usually mean less focus by 10 AM. Protect the theta-to-alpha transition window in the first 45 minutes after waking and save your prefrontal cortex for your #1 deep-work block.',
      hashtags: [
        '#neuroscience',
        '#youtubeshorts',
        '#productivityhacks',
        '#deepwork',
        '#morningroutine',
        '#focus',
      ],
    },
  },
  {
    id: 'preset-solo-founder-story',
    topic: 'How a 1-person design studio replaced $14,000/mo in agency retainers',
    platform: 'Instagram Reels',
    tone: 'Storytelling',
    createdAt: 'Oct 30 · 02:10 PM',
    source: 'blueprint',
    viralityScore: 86,
    improvementTips: [
      'Show the actual Stripe/invoice before-and-after breakdown in Frame 1 to establish immediate credibility.',
      'Keep background music 18dB below the voiceover with a subtle low-pass filter during the 0:08 turning point.',
      'Include a 3-point carousel-style summary frame at the end to maximize Instagram Saves.',
    ],
    hooks: [
      'Last year I fired all 4 of my retainer clients—and my monthly revenue went up by $14,000.',
      'Nobody tells solo designers that traditional agency retainers are a trap until you hit burnout.',
      'Here is the exact async subscription model that replaced our entire agency team.',
      'I deleted Slack and weekly status calls for 60 days. Here is what happened to our studio.',
      'How one productized offer beat a 6-person creative agency in 90 days.',
    ],
    script: [
      {
        time: '0:00 - 0:03',
        visual: 'Close-up of calendar packed with red meeting blocks dissolving into a completely clear week.',
        audio: 'Last year I fired all 4 of my retainer clients—and my monthly revenue went up by $14,000.',
        onScreenText: '0 MEETINGS · +$14K/MO',
      },
      {
        time: '0:03 - 0:11',
        visual: 'Over-the-shoulder shot of a cluttered client Slack channel vs. a clean 3-column async Kanban board.',
        audio: 'We were spending 65% of our week on status calls instead of shipping actual design work.',
        onScreenText: '65% Meetings vs. 35% Deep Craft',
      },
      {
        time: '0:11 - 0:21',
        visual: 'Screen walk-through of the async request queue: 1 active request at a time, 48-hour turnaround.',
        audio: 'So we replaced custom proposals with one flat async queue: one active request at a time, 48-hour delivery, zero live calls.',
        onScreenText: '1 Active Request · 48h Turnaround',
      },
      {
        time: '0:21 - 0:28',
        visual: 'Clean studio portrait shot with the 3-rule productized blueprint overlaid on screen.',
        audio: 'Save this 3-part async offer structure if you want to scale without hiring an account manager.',
        onScreenText: 'SAVE THE ASYNC STUDIO MODEL ↗',
      },
    ],
    seo: {
      title: 'How a 1-Person Studio Replaced $14k/mo in Agency Retainers',
      caption: 'Status meetings were eating 65% of our studio capacity. Switching to a single-queue async model with 48-hour turnarounds let us deliver faster work for clients while eliminating calendar bloat.',
      hashtags: [
        '#reelsstrategy',
        '#solofounder',
        '#designstudio',
        '#productizedservice',
        '#freelancedesign',
        '#creativebusiness',
      ],
    },
  },
];

export const STORAGE_KEY_SAVED_STRATEGIES = 'viralforge_saved_strategies_v1';
export const STORAGE_KEY_ACTIVE_STRATEGY = 'viralforge_active_strategy_id_v1';

export function escapeMarkdownTableCell(text: string): string {
  return (text || '')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ')
    .trim();
}

export function formatStrategyToMarkdown(strategy: SavedStrategy): string {
  const assessment = getViralityAssessment(strategy.viralityScore);
  const duration = parseEstimatedDurationSeconds(strategy.script);
  const formattedHashtags = formatHashtagsForClipboard(strategy.seo.hashtags);

  const tipsBlock = strategy.improvementTips
    .map((tip, idx) => `${idx + 1}. ${tip}`)
    .join('\n');

  const hooksBlock = strategy.hooks
    .map((hook, idx) => `${idx + 1}. ${hook}`)
    .join('\n');

  const scriptTableRows = strategy.script.map((seg) => {
    const time = escapeMarkdownTableCell(seg.time);
    const visual = escapeMarkdownTableCell(seg.visual);
    const audio = escapeMarkdownTableCell(seg.audio);
    const onScreenText = escapeMarkdownTableCell(seg.onScreenText);
    return `| ${time} | ${visual} | ${audio} | ${onScreenText} |`;
  });

  const scriptTable = [
    '| Time | Visual / B-Roll | Audio / Voiceover | On-Screen Text |',
    '| :--- | :--- | :--- | :--- |',
    ...scriptTableRows,
  ].join('\n');

  return [
    `# ViralForge AI — Production Strategy: ${strategy.topic}`,
    '',
    `**Platform:** ${strategy.platform}  `,
    `**Tone:** ${strategy.tone}  `,
    `**Virality Score:** ${strategy.viralityScore}/100 (${assessment.label})  `,
    `**Estimated Duration:** ~${duration}s  `,
    `**Created:** ${strategy.createdAt}`,
    '',
    '---',
    '',
    '## Virality Assessment & Recommendations',
    '',
    `> **${assessment.label}**: ${assessment.description}`,
    '',
    '### Strategic Improvement Tips',
    tipsBlock,
    '',
    '---',
    '',
    '## 5 Viral Hooks (0:00 - 0:03)',
    '',
    hooksBlock,
    '',
    '---',
    '',
    '## Script Breakdown',
    '',
    scriptTable,
    '',
    '---',
    '',
    '## SEO & Metadata',
    '',
    '### Video Title',
    strategy.seo.title,
    '',
    '### Caption / Description',
    strategy.seo.caption,
    '',
    '### Hashtags',
    formattedHashtags,
  ].join('\n');
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below
    }
  }

  if (typeof document !== 'undefined') {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-999999px';
      textarea.style.top = '-999999px';
      textarea.setAttribute('readonly', '');
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      if (success) return true;
    } catch {
      // Fallback failed
    }
  }
  return false;
}

export function loadSavedStrategiesFromStorage(): SavedStrategy[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return INITIAL_SAVED_STRATEGIES;
  }
  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY_SAVED_STRATEGIES) ||
      window.localStorage.getItem('viralforge_saved_strategies');
    if (!raw) {
      return INITIAL_SAVED_STRATEGIES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const valid = parsed.filter(
        (item): item is SavedStrategy =>
          Boolean(
            item &&
            typeof item === 'object' &&
            typeof item.id === 'string' &&
            typeof item.topic === 'string' &&
            Array.isArray(item.hooks) &&
            Array.isArray(item.script) &&
            item.seo &&
            typeof item.seo === 'object'
          )
      );
      if (valid.length > 0) {
        return valid;
      }
    }
  } catch (e) {
    console.error('Failed to load saved strategies from localStorage:', e);
  }
  return INITIAL_SAVED_STRATEGIES;
}

export function saveStrategiesToStorage(strategies: SavedStrategy[]): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    window.localStorage.setItem(
      STORAGE_KEY_SAVED_STRATEGIES,
      JSON.stringify(strategies)
    );
  } catch (e) {
    console.error('Failed to save strategies to localStorage:', e);
  }
}

export function loadActiveStrategyIdFromStorage(
  fallbackStrategies: SavedStrategy[]
): string {
  if (typeof window === 'undefined' || !window.localStorage) {
    return fallbackStrategies[0]?.id || INITIAL_SAVED_STRATEGIES[0].id;
  }
  try {
    const savedId = window.localStorage.getItem(STORAGE_KEY_ACTIVE_STRATEGY);
    if (savedId && fallbackStrategies.some((s) => s.id === savedId)) {
      return savedId;
    }
  } catch {
    // Ignore
  }
  return fallbackStrategies[0]?.id || INITIAL_SAVED_STRATEGIES[0].id;
}

export function saveActiveStrategyIdToStorage(id: string): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY_ACTIVE_STRATEGY, id);
  } catch {
    // Ignore
  }
}
