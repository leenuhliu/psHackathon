import { motion } from 'motion/react';

const APIS = [
  {
    name: 'Gemini 2.5 Flash',
    model: 'gemini-2.5-flash',
    color: '#4285F4',
    dot: '#60a5fa',
    badge: 'ACTIVE',
    uses: ['Scene scripting', 'Challenge generation', 'Content moderation', 'Character vision'],
    snippet: [
      { t: 'fn',   v: 'ai.models' }, { t: 'op', v: '.' }, { t: 'fn', v: 'generateContent' }, { t: 'op', v: '({' },
      { t: 'key',  v: '  model' },   { t: 'op', v: ': ' }, { t: 'str', v: "'gemini-2.5-flash'" }, { t: 'op', v: ',' },
      { t: 'key',  v: '  config' },  { t: 'op', v: ': ' }, { t: 'op', v: '{ responseMimeType:' },
      { t: 'str',  v: "    'application/json'" }, { t: 'op', v: '} })' },
    ],
  },
  {
    name: 'Gemini Live API',
    model: 'gemini-2.0-flash-live-001',
    color: '#EA4335',
    dot: '#f87171',
    badge: 'STREAMING',
    uses: ['Real-time bidirectional voice', 'WebSocket audio relay'],
    snippet: [
      { t: 'fn',  v: 'ai.live' }, { t: 'op', v: '.' }, { t: 'fn', v: 'connect' }, { t: 'op', v: '({' },
      { t: 'key', v: '  model' }, { t: 'op', v: ': ' }, { t: 'str', v: "'gemini-2.0-flash-live-001'" }, { t: 'op', v: ',' },
      { t: 'key', v: '  config' }, { t: 'op', v: ': ' }, { t: 'op', v: '{' },
      { t: 'key', v: '    responseModalities' }, { t: 'op', v: ': ' }, { t: 'str', v: "['AUDIO']" },
      { t: 'op',  v: '  } })' },
    ],
  },
  {
    name: 'Veo 3.1 Fast',
    model: 'veo-3.1-fast-generate-preview',
    color: '#FBBC04',
    dot: '#fbbf24',
    badge: 'GENERATING',
    uses: ['AI video generation', '5-second cinematic clips'],
    snippet: [
      { t: 'fn',  v: 'ai.models' }, { t: 'op', v: '.' }, { t: 'fn', v: 'generateVideos' }, { t: 'op', v: '({' },
      { t: 'key', v: '  model' }, { t: 'op', v: ': ' }, { t: 'str', v: "'veo-3.1-fast-generate-preview'" }, { t: 'op', v: ',' },
      { t: 'key', v: '  config' }, { t: 'op', v: ': ' }, { t: 'op', v: '{' },
      { t: 'key', v: '    durationSeconds' }, { t: 'op', v: ': ' }, { t: 'num', v: '5' }, { t: 'op', v: ',' },
      { t: 'key', v: '    aspectRatio' }, { t: 'op', v: ': ' }, { t: 'str', v: "'16:9'" },
      { t: 'op',  v: '  } })' },
    ],
  },
  {
    name: 'Lyria 3',
    model: 'lyria-3-clip-preview',
    color: '#34A853',
    dot: '#4ade80',
    badge: 'COMPOSING',
    uses: ['Original music scoring', 'Per-scene soundtrack'],
    snippet: [
      { t: 'fn',  v: 'ai.models' }, { t: 'op', v: '.' }, { t: 'fn', v: 'generateContent' }, { t: 'op', v: '({' },
      { t: 'key', v: '  model' }, { t: 'op', v: ': ' }, { t: 'str', v: "'lyria-3-clip-preview'" }, { t: 'op', v: ',' },
      { t: 'key', v: '  config' }, { t: 'op', v: ': ' }, { t: 'op', v: '{' },
      { t: 'key', v: '    responseModalities' }, { t: 'op', v: ': ' }, { t: 'str', v: "['AUDIO']" },
      { t: 'op',  v: '  } })' },
    ],
  },
  {
    name: 'Gemini TTS',
    model: 'gemini-2.5-flash-preview-tts',
    color: '#A142F4',
    dot: '#c084fc',
    badge: 'SPEAKING',
    uses: ["Simon's narration", 'Voice: Puck'],
    snippet: [
      { t: 'fn',  v: 'ai.models' }, { t: 'op', v: '.' }, { t: 'fn', v: 'generateContent' }, { t: 'op', v: '({' },
      { t: 'key', v: '  model' }, { t: 'op', v: ': ' }, { t: 'str', v: "'gemini-2.5-flash-preview-tts'" }, { t: 'op', v: ',' },
      { t: 'key', v: '  config' }, { t: 'op', v: ': ' }, { t: 'op', v: '{' },
      { t: 'key', v: '    voice' }, { t: 'op', v: ': ' }, { t: 'str', v: "'Puck'" }, { t: 'op', v: ',' },
      { t: 'key', v: '    responseModalities' }, { t: 'op', v: ': ' }, { t: 'str', v: "['AUDIO']" },
      { t: 'op',  v: '  } })' },
    ],
  },
  {
    name: 'Gemini Flash Image',
    model: 'gemini-2.5-flash-image',
    color: '#FF6D00',
    dot: '#fb923c',
    badge: 'RENDERING',
    uses: ['Doodle → cartoon styling', 'Multimodal image generation'],
    snippet: [
      { t: 'fn',  v: 'ai.models' }, { t: 'op', v: '.' }, { t: 'fn', v: 'generateContent' }, { t: 'op', v: '({' },
      { t: 'key', v: '  model' }, { t: 'op', v: ': ' }, { t: 'str', v: "'gemini-2.5-flash-image'" }, { t: 'op', v: ',' },
      { t: 'key', v: '  config' }, { t: 'op', v: ': ' }, { t: 'op', v: '{' },
      { t: 'key', v: '    responseModalities' }, { t: 'op', v: ': ' }, { t: 'str', v: "['IMAGE', 'TEXT']" },
      { t: 'op',  v: '  } })' },
    ],
  },
];

function Token({ t, v }: { t: string; v: string }) {
  const colors: Record<string, string> = {
    fn:  '#60a5fa',
    key: '#86efac',
    str: '#fca5a5',
    num: '#fcd34d',
    op:  '#9ca3af',
  };
  return <span style={{ color: colors[t] ?? '#e5e7eb' }}>{v}</span>;
}

function ApiCard({ api, index }: { api: typeof APIS[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.12, duration: 0.4 }}
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: api.color + '40', backgroundColor: '#0d1117' }}
    >
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-2.5" style={{ backgroundColor: api.color + '18' }}>
        <div className="flex items-center gap-2.5">
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: api.dot, boxShadow: `0 0 6px ${api.dot}` }}
          />
          <span className="text-white font-bold text-sm tracking-wide" style={{ fontFamily: 'monospace' }}>
            {api.name}
          </span>
        </div>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ color: api.dot, backgroundColor: api.color + '22', fontFamily: 'monospace' }}
        >
          {api.badge}
        </span>
      </div>

      {/* Code snippet */}
      <div className="px-4 py-3 text-xs leading-6 overflow-hidden" style={{ fontFamily: 'monospace' }}>
        <div className="flex flex-wrap gap-x-1">
          {api.snippet.map((tok, i) => (
            <span key={i}>
              {tok.v.includes('\n')
                ? tok.v.split('\n').map((line, li) => (
                    <span key={li}>
                      {li > 0 && <br />}
                      <Token t={tok.t} v={line} />
                    </span>
                  ))
                : <Token t={tok.t} v={tok.v} />}
            </span>
          ))}
        </div>
      </div>

      {/* Uses */}
      <div className="flex flex-wrap gap-1.5 px-4 pb-3">
        {api.uses.map(u => (
          <span
            key={u}
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ color: api.dot, backgroundColor: api.color + '15', fontFamily: 'monospace' }}
          >
            // {u}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

export function ApiShowcase() {
  return (
    <div className="h-full w-full flex flex-col bg-[#010409] overflow-hidden">
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-800 flex-shrink-0">
        <div className="w-3 h-3 rounded-full bg-red-500 opacity-80" />
        <div className="w-3 h-3 rounded-full bg-yellow-500 opacity-80" />
        <div className="w-3 h-3 rounded-full bg-green-500 opacity-80" />
        <span className="ml-3 text-gray-500 text-xs" style={{ fontFamily: 'monospace' }}>
          tell-a-sketch / api-dashboard.ts
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
        {/* Import line */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-xs mb-1"
          style={{ fontFamily: 'monospace' }}
        >
          <span style={{ color: '#c084fc' }}>import</span>
          <span style={{ color: '#9ca3af' }}> {'{ '}</span>
          <span style={{ color: '#60a5fa' }}>GoogleGenAI</span>
          <span style={{ color: '#9ca3af' }}>{" } "}</span>
          <span style={{ color: '#c084fc' }}>from</span>
          <span style={{ color: '#fca5a5' }}> '@google/genai'</span>
          <span style={{ color: '#9ca3af' }}>;</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="text-xs mb-3"
          style={{ fontFamily: 'monospace' }}
        >
          <span style={{ color: '#c084fc' }}>const </span>
          <span style={{ color: '#60a5fa' }}>ai</span>
          <span style={{ color: '#9ca3af' }}> = </span>
          <span style={{ color: '#60a5fa' }}>new GoogleGenAI</span>
          <span style={{ color: '#9ca3af' }}>{'({ apiKey: '}</span>
          <span style={{ color: '#86efac' }}>process.env</span>
          <span style={{ color: '#9ca3af' }}>.GEMINI_API_KEY {'});'}</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-xs text-gray-600 mb-1"
          style={{ fontFamily: 'monospace' }}
        >
          {'// ─────────────────────────────────────────────── //'}
        </motion.div>

        {APIS.map((api, i) => (
          <ApiCard key={api.model} api={api} index={i} />
        ))}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: APIS.length * 0.12 + 0.4 }}
          className="text-xs text-gray-600 mt-2 pb-4"
          style={{ fontFamily: 'monospace' }}
        >
          {'// ─────────────────────────────────────────────── //'}
          <br />
          <span style={{ color: '#9ca3af' }}>{'// '}</span>
          <span style={{ color: '#4ade80' }}>6 Google AI APIs</span>
          <span style={{ color: '#9ca3af' }}>{' · '}</span>
          <span style={{ color: '#60a5fa' }}>1 children\'s story app</span>
          <span style={{ color: '#9ca3af' }}>{' · '}</span>
          <span style={{ color: '#fbbf24' }}>infinite imagination</span>
        </motion.div>
      </div>
    </div>
  );
}
