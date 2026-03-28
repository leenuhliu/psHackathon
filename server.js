import 'dotenv/config';
import { setDefaultResultOrder } from 'dns';
setDefaultResultOrder('ipv4first');
import { createServer } from 'http';
import { mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { GoogleGenAI } from '@google/genai';
import sql from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
mkdirSync(join(__dirname, 'public', 'generated'), { recursive: true });

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY });

// Create/migrate tables on startup
async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS world_state (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      show_id uuid NOT NULL,
      key text NOT NULL,
      value jsonb,
      last_updated timestamptz DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS characters (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      show_id uuid NOT NULL,
      name text NOT NULL,
      description text,
      doodle_url text,
      styled_frame_url text,
      created_at timestamptz DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS episodes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      show_id uuid NOT NULL,
      episode_number int NOT NULL,
      title text,
      story_prompt text,
      veo_clip_url text,
      lyria_track_url text,
      created_at timestamptz DEFAULT now()
    )
  `;
  // world_state already exists from Sam's schema — add key/value columns if missing
  await sql`ALTER TABLE world_state ADD COLUMN IF NOT EXISTS key text`;
  await sql`ALTER TABLE world_state ADD COLUMN IF NOT EXISTS value jsonb`;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS world_state_show_key ON world_state(show_id, key)
  `;
  console.log('DB ready');
}

// P3 calls this to load the show bible sidebar
app.get('/api/show-bible', async (req, res) => {
  const { show_id } = req.query;
  if (!show_id) return res.json({ characters: [], episodes: [] });
  const characters = await sql`
    SELECT * FROM characters WHERE show_id = ${show_id}
  `;
  const episodes = await sql`
    SELECT * FROM episodes WHERE show_id = ${show_id}
    ORDER BY episode_number ASC
  `;
  res.json({ characters, episodes });
});

// P3 calls this after a new episode generates
app.post('/api/episode', async (req, res) => {
  const { show_id, title, story_prompt, veo_clip_url, lyria_track_url } = req.body;
  const [latest] = await sql`
    SELECT episode_number FROM episodes
    WHERE show_id = ${show_id}
    ORDER BY episode_number DESC LIMIT 1
  `;
  const nextNumber = (latest?.episode_number ?? 0) + 1;
  const [episode] = await sql`
    INSERT INTO episodes (show_id, episode_number, title, story_prompt, veo_clip_url, lyria_track_url)
    VALUES (${show_id}, ${nextNumber}, ${title}, ${story_prompt}, ${veo_clip_url}, ${lyria_track_url})
    RETURNING *
  `;
  res.json(episode);
});

// P1 calls this to transform a doodle into a styled character frame
app.post('/api/style-character', async (req, res) => {
  const { doodle_url, description = '' } = req.body;
  const output = await replicate.run(
    'jagilley/controlnet-scribble:435061a1b5a4c1e26740464bf786efdfa9cb3a3ac488595a2de23e143fdb0117',
    {
      input: {
        image: doodle_url,
        prompt: `hand-drawn cartoon character, ${description}, clean line art, flat color, sticker style, white background`,
        num_samples: '1',
        image_resolution: '512',
        ddim_steps: 20,
        scale: 9,
        eta: 0,
      }
    }
  );
  const styled_frame_url = Array.isArray(output) ? output[0] : output;
  res.json({ styled_frame_url });
});

// P1 calls this after character assets are ready
app.post('/api/character', async (req, res) => {
  const { show_id, name, description, doodle_url, styled_frame_url } = req.body;
  const [character] = await sql`
    INSERT INTO characters (show_id, name, description, doodle_url, styled_frame_url)
    VALUES (${show_id}, ${name}, ${description}, ${doodle_url}, ${styled_frame_url})
    RETURNING *
  `;
  res.json(character);
});

// World state read
app.get('/api/world-state', async (req, res) => {
  const { show_id } = req.query;
  if (!show_id) return res.json({});
  const rows = await sql`
    SELECT key, value FROM world_state WHERE show_id = ${show_id}
  `;
  const state = Object.fromEntries(rows.map(r => [r.key, r.value]));
  res.json(state);
});

// World state write
app.post('/api/world-state', async (req, res) => {
  const { show_id, key, value } = req.body;
  const [row] = await sql`
    INSERT INTO world_state (show_id, key, value, last_updated)
    VALUES (${show_id}, ${key}, ${JSON.stringify(value)}, now())
    ON CONFLICT (show_id, key)
    DO UPDATE SET value = EXCLUDED.value, last_updated = now()
    RETURNING *
  `;
  res.json(row);
});

// P4 orchestration: Live API transcript → Veo + Lyria prompts
// P3 calls this after voice session produces a transcript
app.post('/api/orchestrate', async (req, res) => {
  const { show_id, transcript } = req.body;

  // Load existing characters for context
  const existingCharacters = await sql`
    SELECT name, description FROM characters WHERE show_id = ${show_id}
  `;

  const characterContext = existingCharacters.length
    ? `Existing characters: ${existingCharacters.map(c => `${c.name} (${c.description})`).join(', ')}.`
    : 'No existing characters yet.';

  // Use Gemini Flash to parse creative intent from transcript
  const result = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{
      role: 'user',
      parts: [{ text: `You are a pipeline assistant for a children's animated show generator.
${characterContext}

Parse this creative director voice transcript and extract structured generation prompts.

Transcript: "${transcript}"

Respond with ONLY valid JSON in this exact shape:
{
  "veo_prompt": "A detailed scene description for Veo 3 video generation. Cinematic, slow-paced, hand-drawn animation style, long scene holds, calm cuts, 8 seconds.",
  "lyria_prompt": "A music generation prompt for Lyria 2. Calm gentle instrumental, slow-media pacing, children's animated show tone.",
  "characters_mentioned": ["name1", "name2"],
  "episode_title": "Short episode title"
}` }]
    }],
    config: { responseMimeType: 'application/json' }
  });

  const parsed = JSON.parse(result.text);

  // Persist the latest prompts to world state
  await sql`
    INSERT INTO world_state (show_id, key, value, last_updated)
    VALUES (${show_id}, 'latest_prompts', ${JSON.stringify(parsed)}, now())
    ON CONFLICT (show_id, key)
    DO UPDATE SET value = EXCLUDED.value, last_updated = now()
  `;

  res.json(parsed);
});

// Accepts base64 canvas PNG, styles it, describes it with Gemini Vision, saves to DB
// Call this while Veo is loading — the character will appear in the next scene
app.post('/api/add-character', async (req, res, next) => {
  try {
    const { show_id, name, image_data } = req.body;
    if (!show_id || !name || !image_data) {
      return res.status(400).json({ error: 'show_id, name, and image_data required' });
    }

    // Save doodle to disk
    const doodleFilename = `${show_id}-doodle-${Date.now()}.png`;
    const doodlePath = join(__dirname, 'public', 'generated', doodleFilename);
    const base64Data = image_data.replace(/^data:image\/\w+;base64,/, '');
    writeFileSync(doodlePath, base64Data, 'base64');
    const doodle_url = `/generated/${doodleFilename}`;

    // Style the doodle with Gemini image generation (Nano Banana)
    const styleResult = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ role: 'user', parts: [
        { inlineData: { mimeType: 'image/png', data: base64Data } },
        { text: `This is a child's drawing of a character named "${name}". Create a colorful cartoon sticker illustration that is COMPLETELY FAITHFUL to this drawing. Preserve every quirky proportion exactly — if the eyes are lopsided keep them lopsided, if the head is huge keep it huge, if limbs are uneven keep them uneven. White background. Children's animation style. Do NOT correct or normalize any proportions.` }
      ]}],
      config: { responseModalities: ['IMAGE', 'TEXT'] }
    });
    const imagePart = styleResult.candidates[0].content.parts.find(p => p.inlineData?.mimeType?.startsWith('image'));
    const styledFilename = `${show_id}-styled-${Date.now()}.png`;
    writeFileSync(join(__dirname, 'public', 'generated', styledFilename), Buffer.from(imagePart.inlineData.data, 'base64'));
    const styled_frame_url = `/generated/${styledFilename}`;

    // Use Gemini Vision to describe the styled character for use in future Veo prompts
    const visionResult = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { mimeType: 'image/png', data: base64Data } },
          { text: `This is a child's drawing of a character named "${name}" for a story. Describe this character in 1-2 vivid sentences that could be used in a video generation prompt. Focus on appearance, colors, and personality suggested by the drawing.` }
        ]
      }]
    });
    const description = visionResult.text.trim();

    // Save to DB
    const [character] = await sql`
      INSERT INTO characters (show_id, name, description, doodle_url, styled_frame_url)
      VALUES (${show_id}, ${name}, ${description}, ${doodle_url}, ${styled_frame_url})
      RETURNING *
    `;

    res.json({ character, styled_frame_url, description });
  } catch (e) { next(e); }
});

// Convert raw PCM L16 to WAV buffer so browsers can play it
function pcmToWav(pcmBuffer, sampleRate = 24000, channels = 1, bitsPerSample = 16) {
  const dataSize = pcmBuffer.length;
  const wav = Buffer.alloc(44 + dataSize);
  wav.write('RIFF', 0); wav.writeUInt32LE(36 + dataSize, 4); wav.write('WAVE', 8);
  wav.write('fmt ', 12); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(channels, 22); wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(sampleRate * channels * bitsPerSample / 8, 28);
  wav.writeUInt16LE(channels * bitsPerSample / 8, 32); wav.writeUInt16LE(bitsPerSample, 34);
  wav.write('data', 36); wav.writeUInt32LE(dataSize, 40);
  pcmBuffer.copy(wav, 44);
  return wav;
}

// TTS narrator — returns a WAV audio stream
app.post('/api/narrate', async (req, res, next) => { try {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'text required' });
  const result = await ai.models.generateContent({
    model: 'gemini-2.5-flash-preview-tts',
    contents: [{ role: 'user', parts: [{ text }] }],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Sulafat' } } }
    }
  });
  const part = result.candidates[0].content.parts.find(p => p.inlineData?.mimeType?.startsWith('audio'));
  if (!part) return res.status(500).json({ error: 'No audio returned' });
  const pcm = Buffer.from(part.inlineData.data, 'base64');
  const wav = pcmToWav(pcm);
  res.set('Content-Type', 'audio/wav');
  res.send(wav);
} catch (e) { next(e); } });

// Core pipeline: user input → Gemini prompts → Veo video
app.post('/api/generate-scene', async (req, res, next) => { try {
  const { show_id, scene_number, user_input } = req.body;
  if (!show_id || !user_input) return res.status(400).json({ error: 'show_id and user_input required' });

  // Load characters for context
  const existingCharacters = await sql`
    SELECT name, description, styled_frame_url FROM characters WHERE show_id = ${show_id}
  `;
  const characterContext = existingCharacters.length
    ? `Characters in this story: ${existingCharacters.map(c => `${c.name} (${c.description})`).join(', ')}.`
    : 'No characters yet.';

  // Load previous scenes for continuity
  const prevEpisodes = await sql`
    SELECT episode_number, title, story_prompt FROM episodes
    WHERE show_id = ${show_id} ORDER BY episode_number ASC
  `;
  const storyHistory = prevEpisodes.length
    ? `Previous scenes: ${prevEpisodes.map(e => `Scene ${e.episode_number}: ${e.title} — ${e.story_prompt}`).join(' | ')}`
    : 'This is the first scene.';

  // Ask Gemini to build the scene prompt + next guidance
  const result = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: `You are a creative director for a gentle children's animated story app.
${characterContext}
${storyHistory}

The child/parent just said: "${user_input}"

This is scene ${scene_number} of 3. Respond with ONLY valid JSON:
{
  "veo_prompt": "Detailed cinematic scene description for Veo 3. Hand-drawn doodle animation style, warm and slow-paced, 8 seconds. Include the character visually.",
  "lyria_prompt": "Music prompt for Lyria. Warm, gentle, children's animated tone.",
  "episode_title": "Short fun title for this scene",
  "next_prompt": "A warm, one-sentence question to ask the child to inspire scene ${scene_number + 1}. ${scene_number >= 3 ? 'This is the last scene, so say something celebratory instead.' : ''}"
}` }] }],
    config: { responseMimeType: 'application/json' }
  });

  const prompts = JSON.parse(result.text);

  // Generate Veo video + Lyria music in parallel
  const [operation, lyriaRes] = await Promise.all([
    ai.models.generateVideos({
      model: 'veo-3.0-fast-generate-001',
      prompt: prompts.veo_prompt,
      config: { aspectRatio: '16:9', durationSeconds: 8 },
    }),
    ai.models.generateContent({
      model: 'lyria-3-clip-preview',
      contents: [{ role: 'user', parts: [{ text: prompts.lyria_prompt }] }],
      config: { responseModalities: ['AUDIO'] },
    }),
  ]);

  // Poll Veo until done
  let veoOp = operation;
  while (!veoOp.done) {
    await new Promise(r => setTimeout(r, 5000));
    veoOp = await ai.operations.getVideosOperation({ operation: veoOp });
  }

  // Save Veo video
  const filename = `${show_id}-scene-${scene_number}.mp4`;
  const downloadPath = join(__dirname, 'public', 'generated', filename);
  const video = veoOp.response.generatedVideos[0];
  await ai.files.download({ file: video.video, downloadPath });
  const video_url = `/generated/${filename}`;

  // Save Lyria audio
  const audioPart = lyriaRes.candidates[0].content.parts.find(p => p.inlineData?.mimeType?.startsWith('audio'));
  const audioFilename = `${show_id}-scene-${scene_number}.mp3`;
  writeFileSync(join(__dirname, 'public', 'generated', audioFilename), Buffer.from(audioPart.inlineData.data, 'base64'));
  const audio_url = `/generated/${audioFilename}`;

  // Save episode to DB
  const [episode] = await sql`
    INSERT INTO episodes (show_id, episode_number, title, story_prompt, veo_clip_url, lyria_track_url)
    VALUES (${show_id}, ${scene_number}, ${prompts.episode_title}, ${prompts.veo_prompt}, ${video_url}, ${audio_url})
    ON CONFLICT DO NOTHING
    RETURNING *
  `;

  // Save next_prompt to world state for the frontend to display
  await sql`
    INSERT INTO world_state (show_id, key, value, last_updated)
    VALUES (${show_id}, 'next_prompt', ${JSON.stringify(prompts.next_prompt)}, now())
    ON CONFLICT (show_id, key)
    DO UPDATE SET value = EXCLUDED.value, last_updated = now()
  `;

  res.json({ video_url, audio_url, episode_title: prompts.episode_title, next_prompt: prompts.next_prompt });
} catch (e) { next(e); } });

// Return JSON for any unhandled errors instead of Express HTML
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// WebSocket: browser voice session proxied to Gemini Live
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/live' });

wss.on('connection', async (ws) => {
  let session;
  try {
    session = await ai.live.connect({
      model: 'gemini-2.0-flash-live-001',
      config: {
        responseModalities: ['AUDIO'],
        systemInstruction: {
          parts: [{ text: 'You are a gentle, curious creative director for a children\'s animated show. You help kids describe characters and stories in a warm, age-appropriate way. Keep responses short and encouraging.' }]
        },
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } }
        }
      },
      callbacks: {
        onopen: () => ws.send(JSON.stringify({ type: 'ready' })),
        onmessage: (msg) => {
          const parts = msg.serverContent?.modelTurn?.parts;
          if (parts) {
            for (const part of parts) {
              if (part.inlineData?.data) {
                ws.send(JSON.stringify({ type: 'audio', data: part.inlineData.data }));
              }
              if (part.text) {
                ws.send(JSON.stringify({ type: 'transcript', text: part.text }));
              }
            }
          }
        },
        onerror: (e) => ws.send(JSON.stringify({ type: 'error', message: String(e) })),
        onclose: () => { if (ws.readyState === ws.OPEN) ws.close(); }
      }
    });
  } catch (e) {
    ws.send(JSON.stringify({ type: 'error', message: String(e) }));
    ws.close();
    return;
  }

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      if (msg.type === 'audio') {
        session.sendRealtimeInput({
          audio: { data: msg.data, mimeType: 'audio/pcm;rate=16000' }
        });
      }
    } catch (_) {}
  });

  ws.on('close', () => { try { session.close(); } catch (_) {} });
});

initDb().then(() => {
  server.listen(3001, () => console.log('API running on http://localhost:3001'));
});
