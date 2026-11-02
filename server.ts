import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import {
  buildDeterministicStrategy,
  normalizeStrategyResponse,
  validateStrategyInput,
} from './src/utils/strategyUtils.ts';
import type { StrategyInput } from './src/types/strategy.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '1mb' }));

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

app.post('/api/generate-strategy', async (req, res) => {
  try {
    const body = req.body as Partial<StrategyInput>;
    const validation = validateStrategyInput(body);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const input: StrategyInput = {
      topic: body.topic!.trim(),
      platform: body.platform!,
      tone: body.tone!,
    };

    const ai = getGeminiClient();
    if (!ai) {
      const strategy = buildDeterministicStrategy(input);
      res.json({
        strategy,
        source: 'blueprint',
      });
      return;
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Create a high-retention short-form video strategy for the following brief:
- Video Topic / Idea: "${input.topic}"
- Target Platform: ${input.platform}
- Tone / Style: ${input.tone}

Ensure the hooks grab attention in the first 3 seconds, the script breaks down [Time], [Visual/B-Roll], [Audio/Voiceover], and [On-Screen Text] across 4 to 6 crisp segments (covering a 25-45 second short), and the SEO metadata is tailored specifically for ${input.platform} discovery.`,
        config: {
          systemInstruction:
            'Act as an expert short-form video strategist. Based on the user\'s topic, platform, and tone, return a structured JSON response containing: viralityScore (number 1-100), improvementTips (array of 3 actionable strings), hooks (array of 5 high-retention first 3-second hook strings), script (array of objects with time, visual, audio, onScreenText), and seo (object with title, caption, hashtags array).',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              viralityScore: {
                type: Type.INTEGER,
                description: 'Estimated virality score from 1 to 100 based on hook strength, retention pacing, and shareability.',
              },
              improvementTips: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Exactly 3 concrete, actionable improvement tips to maximize retention and share rate.',
              },
              hooks: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Exactly 5 distinct, high-retention first 3-second verbal/visual hooks.',
              },
              script: {
                type: Type.ARRAY,
                description: 'Time-coded script breakdown with 4 to 6 segments.',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    time: {
                      type: Type.STRING,
                      description: 'Timestamp range, e.g. "0:00 - 0:03"',
                    },
                    visual: {
                      type: Type.STRING,
                      description: 'Camera framing, action, or B-Roll visual direction.',
                    },
                    audio: {
                      type: Type.STRING,
                      description: 'Spoken voiceover line or sound design cue.',
                    },
                    onScreenText: {
                      type: Type.STRING,
                      description: 'Punchy kinetic caption or callout text displayed on screen.',
                    },
                  },
                  required: ['time', 'visual', 'audio', 'onScreenText'],
                },
              },
              seo: {
                type: Type.OBJECT,
                properties: {
                  title: {
                    type: Type.STRING,
                    description: 'Search-optimized and curiosity-driven video title.',
                  },
                  caption: {
                    type: Type.STRING,
                    description: 'Engaging post caption with a clear call-to-action.',
                  },
                  hashtags: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: '5 to 8 platform-relevant hashtags.',
                  },
                },
                required: ['title', 'caption', 'hashtags'],
              },
            },
            required: ['viralityScore', 'improvementTips', 'hooks', 'script', 'seo'],
          },
        },
      });

      const rawText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(rawText);
      const normalized = normalizeStrategyResponse(parsed, input);

      res.json({
        strategy: normalized,
        source: 'ai',
      });
    } catch (aiError: unknown) {
      console.error('Gemini API generation error, falling back to deterministic strategy:', aiError);
      const fallback = buildDeterministicStrategy(input);
      res.json({
        strategy: fallback,
        source: 'blueprint',
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected server error';
    res.status(500).json({ error: message });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`ViralForge AI server listening on http://localhost:${port}`);
  });
}

startServer();
