export type Platform = 'TikTok' | 'Instagram Reels' | 'YouTube Shorts';

export type Tone = 'Energetic' | 'Educational' | 'Storytelling' | 'Controversial';

export interface ScriptSegment {
  time: string;
  visual: string;
  audio: string;
  onScreenText: string;
}

export interface SeoMetadata {
  title: string;
  caption: string;
  hashtags: string[];
}

export interface ViralStrategyResponse {
  viralityScore: number;
  improvementTips: [string, string, string] | string[];
  hooks: [string, string, string, string, string] | string[];
  script: ScriptSegment[];
  seo: SeoMetadata;
}

export interface SavedStrategy extends ViralStrategyResponse {
  id: string;
  topic: string;
  platform: Platform;
  tone: Tone;
  createdAt: string;
  source?: 'ai' | 'blueprint';
}

export interface StrategyInput {
  topic: string;
  platform: Platform;
  tone: Tone;
}
