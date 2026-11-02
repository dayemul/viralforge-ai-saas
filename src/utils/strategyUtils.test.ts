import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateStrategyInput,
  getViralityAssessment,
  formatScriptForClipboard,
  formatHashtagsForClipboard,
  parseEstimatedDurationSeconds,
  normalizeStrategyResponse,
  buildDeterministicStrategy,
  formatStrategyToMarkdown,
  INITIAL_SAVED_STRATEGIES,
  loadSavedStrategiesFromStorage,
  saveStrategiesToStorage,
  loadActiveStrategyIdFromStorage,
  saveActiveStrategyIdToStorage,
} from './strategyUtils';

test('validateStrategyInput rejects empty or overly short topics', () => {
  const emptyRes = validateStrategyInput({
    topic: '   ',
    platform: 'TikTok',
    tone: 'Energetic',
  });
  assert.equal(emptyRes.valid, false);
  assert.ok(emptyRes.error?.includes('Please enter a video topic'));

  const shortRes = validateStrategyInput({
    topic: 'AI',
    platform: 'TikTok',
    tone: 'Energetic',
  });
  assert.equal(shortRes.valid, false);
  assert.ok(shortRes.error?.includes('at least 4 characters'));

  const validRes = validateStrategyInput({
    topic: 'How to edit faster in DaVinci Resolve',
    platform: 'YouTube Shorts',
    tone: 'Educational',
  });
  assert.equal(validRes.valid, true);
  assert.equal(validRes.error, undefined);
});

test('getViralityAssessment maps scores to accurate semantic tiers', () => {
  const high = getViralityAssessment(92);
  assert.equal(high.label, 'High Breakout Potential');

  const mid = getViralityAssessment(76);
  assert.equal(mid.label, 'Strong Retention');

  const low = getViralityAssessment(58);
  assert.equal(low.label, 'Needs Hook Sharpening');
});

test('formatScriptForClipboard outputs structured time, visual, audio, and on-screen text', () => {
  const formatted = formatScriptForClipboard(
    [
      {
        time: '0:00 - 0:03',
        visual: 'Close-up camera pan',
        audio: 'Stop scrolling right now.',
        onScreenText: 'STOP SCROLLING',
      },
    ],
    { topic: 'Test Topic', platform: 'TikTok', tone: 'Energetic' }
  );

  assert.ok(formatted.includes('TOPIC: Test Topic'));
  assert.ok(formatted.includes('[1] TIME: 0:00 - 0:03'));
  assert.ok(formatted.includes('VISUAL / B-ROLL: Close-up camera pan'));
  assert.ok(formatted.includes('AUDIO / VOICEOVER: "Stop scrolling right now."'));
  assert.ok(formatted.includes('ON-SCREEN TEXT: [STOP SCROLLING]'));
});

test('formatHashtagsForClipboard normalizes leading hash symbols', () => {
  const tags = formatHashtagsForClipboard(['#tiktok', 'creator', '##viral']);
  assert.equal(tags, '#tiktok #creator #viral');
});

test('parseEstimatedDurationSeconds extracts maximum timestamp second', () => {
  const secs = parseEstimatedDurationSeconds([
    { time: '0:00 - 0:03', visual: 'a', audio: 'b', onScreenText: 'c' },
    { time: '0:03 - 0:28', visual: 'a', audio: 'b', onScreenText: 'c' },
  ]);
  assert.equal(secs, 28);
});

test('normalizeStrategyResponse guarantees 3 tips, 5 hooks, valid score, script, and seo', () => {
  const normalized = normalizeStrategyResponse(
    {
      viralityScore: 120, // should clamp to 100
      improvementTips: ['Only one tip provided'],
      hooks: ['Hook 1', 'Hook 2'],
      script: [],
      seo: { title: 'Custom Title', caption: '', hashtags: ['shorts'] },
    },
    {
      topic: 'Building a solo SaaS in 30 days',
      platform: 'Instagram Reels',
      tone: 'Storytelling',
    }
  );

  assert.equal(normalized.viralityScore, 100);
  assert.equal(normalized.improvementTips.length, 3);
  assert.equal(normalized.improvementTips[0], 'Only one tip provided');
  assert.equal(normalized.hooks.length, 5);
  assert.ok(normalized.script.length >= 3);
  assert.equal(normalized.seo.title, 'Custom Title');
  assert.ok(normalized.seo.caption.length > 10);
  assert.ok(normalized.seo.hashtags.every((h) => h.startsWith('#')));
});

test('buildDeterministicStrategy generates platform and tone tailored output', () => {
  const strategy = buildDeterministicStrategy({
    topic: 'Cold email teardown for B2B founders',
    platform: 'YouTube Shorts',
    tone: 'Controversial',
  });

  assert.ok(strategy.viralityScore >= 1 && strategy.viralityScore <= 100);
  assert.equal(strategy.improvementTips.length, 3);
  assert.equal(strategy.hooks.length, 5);
  assert.ok(strategy.script.length >= 4);
  assert.ok(strategy.seo.title.includes('Cold email teardown'));
});

test('formatStrategyToMarkdown produces complete structured markdown with Score, Hooks, Script Table, and SEO', () => {
  const sampleStrategy = {
    id: 'test-strategy-1',
    topic: 'How to scale a micro-SaaS to $10k MRR',
    platform: 'TikTok' as const,
    tone: 'Energetic' as const,
    createdAt: 'Just now',
    source: 'ai' as const,
    viralityScore: 94,
    improvementTips: [
      'Hook the viewer with an MRR graph within 1s.',
      'Add a pattern interrupt at 0:08.',
      'Include a comment prompt in the last 2 seconds.',
    ],
    hooks: [
      'Stop building SaaS products backwards.',
      'How I reached $10k MRR with zero employees.',
      'The #1 mistake killing micro-SaaS founders.',
      'Three tools that saved my subscription business.',
      'Why 90% of solo developers never get their first paying customer.',
    ],
    script: [
      {
        time: '0:00 - 0:03',
        visual: 'Split-screen: $0 vs $10k dashboard | fast zoom',
        audio: 'Stop building SaaS products backwards.',
        onScreenText: '$0 ➔ $10,000 MRR',
      },
      {
        time: '0:03 - 0:10',
        visual: 'Screen capture of Stripe payout feed',
        audio: 'Instead of spending 6 months coding, sell before you build.',
        onScreenText: 'Sell Before Coding',
      },
    ],
    seo: {
      title: 'How to scale a micro-SaaS to $10k MRR (TikTok Blueprint)',
      caption: 'Solo SaaS playbooks in 2026 require rapid validation before writing code. Save this blueprint!',
      hashtags: ['#microsaas', '#buildinpublic', '#tiktokgrowth'],
    },
  };

  const md = formatStrategyToMarkdown(sampleStrategy);

  // Verifies header & topic
  assert.ok(md.includes('# ViralForge AI — Production Strategy: How to scale a micro-SaaS to $10k MRR'));
  assert.ok(md.includes('**Platform:** TikTok'));
  assert.ok(md.includes('**Tone:** Energetic'));

  // Verifies Score & Assessment & Tips
  assert.ok(md.includes('**Virality Score:** 94/100 (High Breakout Potential)'));
  assert.ok(md.includes('## Virality Assessment & Recommendations'));
  assert.ok(md.includes('1. Hook the viewer with an MRR graph within 1s.'));

  // Verifies 5 Viral Hooks
  assert.ok(md.includes('## 5 Viral Hooks (0:00 - 0:03)'));
  assert.ok(md.includes('1. Stop building SaaS products backwards.'));
  assert.ok(md.includes('5. Why 90% of solo developers never get their first paying customer.'));

  // Verifies Script Table & escaped pipe
  assert.ok(md.includes('## Script Breakdown'));
  assert.ok(md.includes('| Time | Visual / B-Roll | Audio / Voiceover | On-Screen Text |'));
  assert.ok(md.includes('| :--- | :--- | :--- | :--- |'));
  assert.ok(md.includes('| 0:00 - 0:03 | Split-screen: $0 vs $10k dashboard \\| fast zoom | Stop building SaaS products backwards. | $0 ➔ $10,000 MRR |'));

  // Verifies SEO section
  assert.ok(md.includes('## SEO & Metadata'));
  assert.ok(md.includes('### Video Title'));
  assert.ok(md.includes('How to scale a micro-SaaS to $10k MRR (TikTok Blueprint)'));
  assert.ok(md.includes('### Caption / Description'));
  assert.ok(md.includes('### Hashtags'));
  assert.ok(md.includes('#microsaas #buildinpublic #tiktokgrowth'));
});

test('localStorage helpers persist and restore strategies and active strategy ID', () => {
  const mockStorage: Record<string, string> = {};
  const originalWindow = globalThis.window;

  // Mock minimal window.localStorage
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).window = {
    localStorage: {
      getItem: (key: string) => mockStorage[key] ?? null,
      setItem: (key: string, value: string) => {
        mockStorage[key] = value;
      },
      removeItem: (key: string) => {
        delete mockStorage[key];
      },
    },
  };

  try {
    // 1. Initial load from empty storage returns default strategies
    const initial = loadSavedStrategiesFromStorage();
    assert.ok(initial.length >= 3);
    assert.equal(initial[0].id, INITIAL_SAVED_STRATEGIES[0].id);

    // 2. Save new generated strategy
    const customStrategy = {
      ...initial[0],
      id: 'generated-strategy-999',
      topic: 'My Custom Generated Topic',
    };
    saveStrategiesToStorage([customStrategy, ...initial]);

    // 3. Load back from storage - should have the new strategy at the top
    const loaded = loadSavedStrategiesFromStorage();
    assert.equal(loaded[0].id, 'generated-strategy-999');
    assert.equal(loaded[0].topic, 'My Custom Generated Topic');
    assert.equal(loaded.length, initial.length + 1);

    // 4. Test active strategy ID persistence
    saveActiveStrategyIdToStorage('generated-strategy-999');
    const activeId = loadActiveStrategyIdFromStorage(loaded);
    assert.equal(activeId, 'generated-strategy-999');
  } finally {
    // Restore
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).window = originalWindow;
  }
});
