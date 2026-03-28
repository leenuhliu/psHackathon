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

// P3 calls this to load the show bible sidebar
app.get('/api/show-bible', async (req, res) => {
  const { show_id } = req.query;
  if (!show_id) return res.json({ characters: [], episodes: [] });
  const characters = await sql`
    select * from characters where show_id = ${show_id}
  `;
  const episodes = await sql`
    select * from episodes where show_id = ${show_id}
    order by episode_number asc
  `;
  res.json({ characters, episodes });
});

// P3 calls this after a new episode generates
app.post('/api/episode', async (req, res) => {
  const { show_id, title, story_prompt, veo_clip_url, lyria_track_url } = req.body;

  const [latest] = await sql`
    select episode_number from episodes
    where show_id = ${show_id}
    order by episode_number desc limit 1
  `;
  const nextNumber = (latest?.episode_number ?? 0) + 1;

  const [episode] = await sql`
    insert into episodes (show_id, episode_number, title, story_prompt, veo_clip_url, lyria_track_url)
    values (${show_id}, ${nextNumber}, ${title}, ${story_prompt}, ${veo_clip_url}, ${lyria_track_url})
    returning *
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

// P1 calls this after Veo + Lyria files are ready
app.post('/api/character', async (req, res) => {
  const { show_id, name, description, doodle_url, styled_frame_url } = req.body;
  const [character] = await sql`
    insert into characters (show_id, name, description, doodle_url, styled_frame_url)
    values (${show_id}, ${name}, ${description}, ${doodle_url}, ${styled_frame_url})
    returning *
  `;
  res.json(character);
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

server.listen(3001, () => console.log('API running on http://localhost:3001'));
