import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

async function bootstrap() {
  const app = express();
  app.use(express.json({ limit: '60mb' }));

  // Helper for Gemini AI client with required User-Agent
  const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // Modular AI Auto-Captions Endpoint
  app.post('/api/ai/captions', async (req, res) => {
    try {
      const { text, language = 'English', style = 'Reels' } = req.body;
      const ai = getAiClient();
      if (!ai) {
        return res.status(503).json({
          error: 'AI service is temporarily unavailable.',
          fallback: [
            { text: 'EditPro Mobile Studio', start: 0, end: 2.5 },
            { text: 'Create stunning viral videos', start: 2.5, end: 5.0 },
            { text: 'Share to Shorts & Reels', start: 5.0, end: 7.5 },
          ],
        });
      }

      const prompt = `You are a professional video subtitling assistant for Indian social media creators (Shorts, Reels, YouTube).
Given the input context or voice transcript: "${text || 'Energetic video showcase'}",
Target Language: ${language} (support Hindi, English, or Hinglish).
Format: Generate 4 to 8 punchy short subtitle lines with estimated start and end timestamps (in seconds).
Return pure JSON with format:
[
  {"text": "Short punchy line", "start": 0.0, "end": 2.2},
  {"text": "Second line", "start": 2.2, "end": 4.5}
]`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const raw = response.text?.trim() || '[]';
      const parsed = JSON.parse(raw);
      return res.json({ captions: parsed });
    } catch (err: any) {
      console.error('Caption generation error:', err);
      return res.status(503).json({
        error: 'AI service is temporarily unavailable.',
        fallback: [
          { text: 'EditPro Professional Video', start: 0, end: 2.5 },
          { text: 'Tap to customize subtitles', start: 2.5, end: 5.0 },
        ],
      });
    }
  });

  // Modular AI Script / Idea Generator (Shorts, Reels, Vlogs, News in English / Hindi)
  app.post('/api/ai/script', async (req, res) => {
    try {
      const { topic = 'Travel Vlog India', platform = 'Shorts', language = 'Hindi' } = req.body;
      const ai = getAiClient();
      if (!ai) {
        return res.status(503).json({
          error: 'AI service is temporarily unavailable.',
          script: `🎬 Hook (0-3s): "Check out this amazing spot in India!"\n💡 Main (3-15s): Quick transitions, dynamic text, beat sync.\n🔥 Call To Action: "Subscribe for more EditPro tutorials!"`,
        });
      }

      const prompt = `Create a high-retention video script storyboard for ${platform}.
Topic: ${topic}
Language: ${language} (can be Hindi devanagari or Hinglish or English).
Include:
1. Hook (0-3s)
2. Fast-paced scenes (3-20s) with suggested visual transitions and text overlays
3. Call to Action (CTA)`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      return res.json({ script: response.text });
    } catch (err: any) {
      console.error('Script generation error:', err);
      return res.status(503).json({
        error: 'AI service is temporarily unavailable.',
      });
    }
  });

  // Modular AI Auto-Edit Suggestions (Section 30)
  app.post('/api/ai/auto-edit', async (req, res) => {
    try {
      const { clipCount = 2, totalDuration = 10, style = 'Cinematic Beat' } = req.body;
      const ai = getAiClient();
      if (!ai) {
        return res.status(503).json({
          error: 'AI service is temporarily unavailable.',
          suggestions: [
            { cutAt: 2.5, transition: 'dissolve', tip: 'Cut to secondary angle on beat 1' },
            { cutAt: 5.0, transition: 'zoom', tip: 'Dynamic zoom in for dramatic focus' },
          ],
        });
      }

      const prompt = `Analyze a video project with ${clipCount} clips and duration of ${totalDuration} seconds. Style: ${style}.
Suggest 3 optimal rhythm cut times (in seconds) and recommended transitions (e.g. dissolve, zoom, slide, flash).
Return pure JSON array with format:
[
  {"cutAt": 2.5, "transition": "dissolve", "tip": "Brief advice"},
  {"cutAt": 5.0, "transition": "zoom", "tip": "Brief advice"}
]`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text?.trim() || '[]');
      return res.json({ suggestions: parsed });
    } catch (err) {
      return res.status(503).json({
        error: 'AI service is temporarily unavailable.',
        suggestions: [
          { cutAt: 2.0, transition: 'dissolve', tip: 'Smooth cut on beat drop' },
          { cutAt: 5.0, transition: 'zoom', tip: 'Punch in zoom for emphasis' },
        ],
      });
    }
  });

  // Mount Vite or static build
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EditPro server running on http://0.0.0.0:${PORT}`);
  });
}

bootstrap();
