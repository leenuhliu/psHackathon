# Story Builder — AI Children's Animated Show Generator

An interactive web app that lets kids (ages 3–10) create their own 3-scene animated show from scratch. A child draws a character, describes what happens in each scene, and the app generates a real animated video clip with background music for every scene — producing a complete mini animated episode at the end.

Built at a hackathon using Google's Veo 3, Lyria, Gemini Flash, and Gemini Live APIs.

---

## What It Does

1. **The child names their story and their main character** (by typing or speaking out loud)
2. **They draw the character** on a canvas — the app AI-styles it into a proper cartoon
3. **They answer two quick character questions** (e.g. "What does Blobby love to do?") to give the character personality
4. **For each of 3 scenes**, the child describes what happens — the app generates an 8-second animated video clip (Veo 3) and matching background music (Lyria) from that description
5. *


*While each clip generates** (~1 minute), the child can draw additional characters or objects to add to the next scene
6. **A voice moment** pops up before generation — e.g. "Make the sound your character would make!" — and the child's voice gets embedded as a speech bubble in the video
7. **A finale screen** plays all three scenes back-to-back with a narrated closing line: *"The End! What a magical story!"*
8. **Past stories are saved** to localStorage so the child can come back and rewatch them anytime

---

## User Flow (Screen by Screen)

```
Screen 1: Setup
  → "What would you like to call your story?"
  → "What's your main character's name?"
  → (past stories shown below for rewatching)

Screen 2: Draw a Character
  → Canvas drawing tool with adjustable brush size
  → Submit → AI cartoon-ifies the doodle + writes a character description

Screen 2.5: Character Trait Questions
  → "What does [name] love to do most?"
  → "What is [name] a little bit afraid of?"
  → Answers feed into scene generation for personalization

Screen 3: Scene Loop (×3)
  → Child describes what happens in the scene (text or voice)
  → Content moderation runs — if flagged, parent approval gate appears
  → Voice moment: child makes a sound that gets embedded in the video
  → Veo 3 generates an 8s animated clip in the background
  → While waiting: draw more characters to add to the next scene
  → Scene video + music plays when ready
  → Repeat for scenes 2 and 3

Screen 4: Finale
  → All 3 scenes play back with titles
  → Character gallery shown
  → Narrated closing line unique to the story's mood

Screen 5: Revisit Past Story
  → Load any previous show_id from history
  → Rewatch all scenes + characters
```

---

## Architecture

```
Browser (index.html)
    │
    ├── HTTP REST ──────────────────────── Express (server.js)
    │       │                                   │
    │       │                              Neon (Postgres)
    │       │                          characters / episodes / world_state
    │       │
    └── WebSocket (/live) ─────────────── Gemini Live proxy
                                          (real-time voice ↔ Gemini 2.0 Flash Live)
```

The entire backend is a single `server.js` file — an Express + WebSocket server that owns all AI calls, database writes, and file saves. The frontend is a single `public/index.html` with vanilla JS. Generated videos and audio files are saved to `public/generated/` and served statically.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/add-character` | Takes a base64 canvas PNG + name. Runs Gemini image generation to cartoon-ify the doodle, Gemini Vision to describe it, saves both to DB. Returns the styled image and description. |
| `POST` | `/api/generate-scene` | Core pipeline. Takes `show_id`, `scene_number`, `user_input` (scene description), optional `voice_response` and `character_traits`. Runs content moderation, builds Veo + Lyria prompts via Gemini Flash, fires Veo 3 + Lyria in parallel, polls until done, saves MP4 + MP3 to disk, saves episode to DB. Returns video/audio URLs + next scene prompt. |
| `POST` | `/api/narrate` | Takes `text`, returns a WAV audio stream via Gemini TTS (voice: Sulafat). Used for all spoken prompts in the UI. |
| `POST` | `/api/scene-voice-prompt` | Given `show_id` + `user_input`, generates a character-specific voice prompt (e.g. "Make the sound your dinosaur would make!") and a short sound label. |
| `POST` | `/api/orchestrate` | Takes a `transcript` from a Gemini Live session. Uses Gemini Flash to parse creative intent and extract structured Veo + Lyria prompts. Saves them to `world_state`. |
| `POST` | `/api/episode` | Manually save an episode record (used by P1 team to push generated clips). |
| `POST` | `/api/character` | Manually save a character record (used by P1 team). |
| `GET`  | `/api/show-bible` | Returns all characters and episodes for a given `show_id`. |
| `GET`  | `/api/world-state` | Returns the full world state key/value map for a `show_id`. |
| `POST` | `/api/world-state` | Upsert a key/value pair into world state. |

### WebSocket: `/live`

Opens a proxied Gemini Live session. The browser streams raw PCM audio (16kHz, 16-bit) and receives back audio chunks + transcript text in real time. Used for voice input throughout the app.

Message types sent **to** the server:
```json
{ "type": "audio", "data": "<base64 PCM>" }
```

Message types received **from** the server:
```json
{ "type": "ready" }
{ "type": "audio", "data": "<base64 PCM>" }
{ "type": "transcript", "text": "..." }
{ "type": "error", "message": "..." }
```

---

## Database Schema (Neon / Postgres)

```sql
characters (
  id             uuid PRIMARY KEY,
  show_id        uuid NOT NULL,
  name           text NOT NULL,
  description    text,           -- Gemini Vision description for use in Veo prompts
  doodle_url     text,           -- path to original canvas PNG
  styled_frame_url text,         -- path to Gemini-styled cartoon PNG
  created_at     timestamptz
)

episodes (
  id             uuid PRIMARY KEY,
  show_id        uuid NOT NULL,
  episode_number int NOT NULL,
  title          text,
  story_prompt   text,           -- the Veo prompt used to generate this scene
  veo_clip_url   text,           -- path to MP4
  lyria_track_url text,          -- path to MP3
  created_at     timestamptz
)

world_state (
  id             uuid PRIMARY KEY,
  show_id        uuid NOT NULL,
  key            text NOT NULL,
  value          jsonb,
  last_updated   timestamptz,
  UNIQUE (show_id, key)
)
```

Each story is identified by a UUID (`show_id`) generated client-side at the start of each session. Past show IDs are stored in `localStorage` so the browser can reload them.

---

## AI Models Used

| Model | Purpose |
|-------|---------|
| `veo-3.0-fast-generate-001` | Generates 8-second animated video clips from text prompts |
| `lyria-3-clip-preview` | Generates background music clips from text prompts |
| `gemini-2.5-flash` | Prompt generation, content moderation, character descriptions, orchestration |
| `gemini-2.5-flash-image` | Cartoon-ifies child's doodles (Nano Banana-style image generation) |
| `gemini-2.5-flash-preview-tts` | Text-to-speech narration (voice: Sulafat) |
| `gemini-2.0-flash-live-001` | Real-time voice conversation via WebSocket (voice: Aoede) |

---

## Content Safety

Every scene description passes through a Gemini-powered content moderation check before generation runs. If the input is flagged (violence, scary themes, adult content, strong language), a **Parent Check overlay** appears and a parent or guardian must explicitly approve before the story can continue. The child can also try a different description.

---

## Setup

### Prerequisites
- Node.js 18+
- A [Neon](https://neon.tech) Postgres database
- A Google AI API key with access to Veo 3, Lyria, and Gemini

### Environment Variables

Create a `.env` file:

```
GEMINI_API_KEY=your_google_ai_api_key
DATABASE_URL=your_neon_postgres_connection_string
PORT=3001  # optional, defaults to 3001
```

### Install and Run

```bash
npm install
npm start
```

Then open `http://localhost:3001` in Chrome (Chrome required for WebSpeech API voice input).

The server automatically creates the database tables on first startup.

---

## Project Structure

```
server.js          — Express + WebSocket server, all API endpoints, all AI calls
db.js              — Neon database connection
public/
  index.html       — Entire frontend (single-file vanilla JS)
  audio-processor.js — AudioWorklet for streaming PCM to the Gemini Live WebSocket
  generated/       — AI-generated videos, music, and character images (gitignored)
```

---

## Notes

- Video generation takes ~60 seconds per scene. The drawing canvas appears while waiting to keep kids engaged.
- The Veo prompt always ends each scene with theatrical curtains closing — giving every clip a consistent storybook ending.
- The closing narration adjective (e.g. "magical", "silly", "daring") is dynamically chosen by Gemini to match the specific mood and events of that story.
- Voice input uses the browser's native Web Speech API as a lightweight fallback for quick answers, and the full Gemini Live WebSocket for the richer real-time voice chat experience.
