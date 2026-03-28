import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import sql from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

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

app.listen(3001, () => console.log('API running on http://localhost:3001'));
