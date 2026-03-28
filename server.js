import 'dotenv/config';
import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { GoogleGenAI } from '@google/genai';
import Replicate from 'replicate';
import sql from './db.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

// Create/migrate tables on startup
async function initDb() {
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

// P1 calls this to generate a background music track via MusicGen
app.post('/api/generate-track', async (req, res) => {
  const { lyria_prompt = 'calm gentle instrumental, children\'s animated show, slow pacing' } = req.body;

  const output = await replicate.run(
    'lucataco/ace-step:280fc4f9ee507577f880a167f639c02622421d8fecf492454320311217b688f1',
    {
      input: {
        prompt: lyria_prompt,
        duration: 30,
      }
    }
  );

  const lyria_track_url = typeof output === 'string' ? output : output?.url?.() ?? String(output);
  res.json({ lyria_track_url });
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
    model: 'gemini-2.0-flash',
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
