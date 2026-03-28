/**
 * server.js — Story App backend
 *
 * Run with:  node server.js
 * Requires:  npm install express @google/genai dotenv
 *
 * Create a .env file in the same folder:
 *   GEMINI_API_KEY=your_key_here
 */

import 'dotenv/config';
import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: '30mb' })); // drawings are large base64 strings

// ── Video storage ──────────────────────────────────────────────────────────
const VIDEOS_DIR = path.join(__dirname, 'generated-videos');
fs.mkdirSync(VIDEOS_DIR, { recursive: true });

// ── Gemini client ──────────────────────────────────────────────────────────
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ── In-memory job store ────────────────────────────────────────────────────
const jobs = {};

// ── POST /api/generate-animation ──────────────────────────────────────────
// Called by ViewingScreen on mount. Returns { job_id } immediately.
app.post('/api/generate-animation', async (req, res) => {
  const { drawings, story_details, story_id } = req.body;

  if (!drawings?.length) {
    return res.status(400).json({ error: 'No drawings provided.' });
  }

  const jobId = randomUUID();
  jobs[jobId] = {
    status: 'running',
    step: 'building_prompt',
    startTime: Date.now(),
    elapsed_ms: 0,
    veo_poll: 0,
    video_url: null,
    error: null,
  };

  // Fire and forget — don't await
  runPipeline(jobId, drawings, story_details, story_id).catch((e) => {
    jobs[jobId].status = 'error';
    jobs[jobId].error = e.message;
    console.error(`[job ${jobId}] failed:`, e.message);
  });

  res.json({ job_id: jobId });
});

// ── GET /api/animation-progress/:jobId ────────────────────────────────────
// ViewingScreen polls this every 8 seconds.
app.get('/api/animation-progress/:jobId', (req, res) => {
  const job = jobs[req.params.jobId];
  if (!job) return res.status(404).json({ error: 'Job not found' });
  job.elapsed_ms = Date.now() - job.startTime;
  res.json(job);
});

// ── GET /api/video/:filename ───────────────────────────────────────────────
// Serves the generated MP4 back to the browser.
app.get('/api/video/:filename', (req, res) => {
  const file = path.join(VIDEOS_DIR, path.basename(req.params.filename));
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'Video not found' });
  res.sendFile(file);
});

// ── Pipeline ───────────────────────────────────────────────────────────────
async function runPipeline(jobId, drawings, storyDetails, storyId) {
  const job = jobs[jobId];

  // Step 1: Ask Gemini to look at the drawing and write a Veo prompt
  job.step = 'building_prompt';
  console.log(`[job ${jobId}] building Veo prompt from ${drawings.length} drawing(s)...`);

  const imageParts = drawings.slice(0, 3).map((dataUrl) => ({
    inlineData: {
      mimeType: 'image/png',
      data: dataUrl.replace(/^data:image\/\w+;base64,/, ''),
    },
  }));

  const context = storyDetails?.length ? `Story details: ${storyDetails.join(', ')}.` : '';

  const promptRes = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [{
      role: 'user',
      parts: [
        ...imageParts,
        {
          text: `${context}
These are children's hand-drawn characters/scenes. Write a single vivid animation prompt (2-3 sentences) for Veo that:
- Brings these exact characters/scenes to life as a short animated clip
- Uses the style: "hand-drawn doodle animation, colourful, child-friendly, gentle movement, whimsical"
- Describes what the character does or what happens in the scene

Reply with ONLY the prompt text, nothing else.`,
        },
      ],
    }],
  });

  const veoPrompt = promptRes.candidates[0].content.parts[0].text.trim();
  console.log(`[job ${jobId}] Veo prompt: ${veoPrompt}`);

  // Step 2: Submit to Veo
  job.step = 'submitting_veo';
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-001',
    prompt: veoPrompt,
    config: { aspectRatio: '16:9', durationSeconds: 8 },
  });
  console.log(`[job ${jobId}] Veo job submitted`);

  // Step 3: Poll until Veo is done
  job.step = 'polling_veo';
  const VEO_TIMEOUT = 8 * 60 * 1000;
  const veoStart = Date.now();

  while (!operation.done) {
    if (Date.now() - veoStart > VEO_TIMEOUT) {
      throw new Error('Veo timed out after 8 minutes.');
    }
    await new Promise((r) => setTimeout(r, 10_000));
    job.veo_poll++;
    operation = await ai.operations.getVideosOperation({ operation });
    console.log(`[job ${jobId}] poll #${job.veo_poll} — done: ${operation.done}`);
  }

  if (operation.error) throw new Error(`Veo error: ${JSON.stringify(operation.error)}`);
  if (!operation.response?.generatedVideos?.length) throw new Error('Veo returned no videos.');

  // Step 4: Download and save the MP4
  job.step = 'downloading';
  const filename = `story_${storyId || jobId}_${Date.now()}.mp4`;
  const savePath = path.join(VIDEOS_DIR, filename);
  await ai.files.download({
    file: operation.response.generatedVideos[0].video,
    downloadPath: savePath,
  });
  console.log(`[job ${jobId}] saved to ${savePath}`);

  job.video_url = `/api/video/${filename}`;
  job.status = 'done';
  job.step = 'done';
}

// ── Start ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
