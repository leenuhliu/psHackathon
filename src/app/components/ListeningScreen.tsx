import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { StoryGuide } from './StoryGuide';
import { Mic, MicOff, ChevronRight, ArrowLeft, Trash2, Check } from 'lucide-react';
import { useState, useRef, useMemo, useEffect } from 'react';
import { useNarration } from '../hooks/useNarration';

// ── Trait question pool ──────────────────────────────────────────────────────
const TRAIT_POOL = [
  { key: 'fears',             template: 'What is {name} a little afraid of?' },
  { key: 'favoriteFood',      template: "What is {name}'s favorite food?" },
  { key: 'favoriteAnimal',    template: "What is {name}'s favorite animal?" },
  { key: 'talent',            template: "What is {name}'s special talent or superpower?" },
  { key: 'makesHappy',        template: 'What makes {name} the happiest?' },
  { key: 'dreams',            template: 'What does {name} dream about?' },
  { key: 'biggestWish',       template: "What is {name}'s biggest wish?" },
  { key: 'bestFriend',        template: "Who is {name}'s best friend?" },
  { key: 'favoriteColor',     template: "What is {name}'s favorite color?" },
  { key: 'neverLeaveWithout', template: 'What would {name} never leave home without?' },
];

const DRAW_COLORS = ['#EF4444','#F97316','#FDE047','#22C55E','#3B82F6','#8B5CF6','#EC4899','#1F2937'];

function fill(t: string, n: string) { return t.replace(/\{name\}/g, n || 'your character'); }

export function ListeningScreen() {
  const navigate = useNavigate();
  const showIdRef = useRef<string>(crypto.randomUUID());

  // Pick one random trait
  const trait1 = useMemo(() => TRAIT_POOL[Math.floor(Math.random() * TRAIT_POOL.length)], []);

  const steps = useMemo(() => [
    { key: 'charName', question: (_n: string) => "What's your character's name?" },
    { key: 'loves',    question: (n: string) => `What does ${n || 'your character'} love to do most?` },
    { key: trait1.key, question: (n: string) => fill(trait1.template, n) },
  ], [trait1]);

  const [stepIndex, setStepIndex] = useState(0);
  const [textInput, setTextInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [charName, setCharName] = useState('');
  const [characterTraits, setCharacterTraits] = useState<Record<string, string>>({});
  const recRef = useRef<any>(null);

  // Drawing state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState(DRAW_COLORS[0]);
  const [brushSize, setBrushSize] = useState(5);
  const [drawingStatus, setDrawingStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [drawingDone, setDrawingDone] = useState(false);
  const [styledUrl, setStyledUrl] = useState<string | null>(null);

  const currentQuestion = steps[stepIndex].question(charName);
  useNarration(currentQuestion);

  // ── Canvas init ──────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctxRef.current = ctx;
  }, []);

  const getCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const src = 'touches' in e ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left) * (canvas.width / rect.width),
      y: (src.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const ctx = ctxRef.current; if (!ctx || drawingDone) return;
    e.preventDefault(); setIsDrawing(true);
    const { x, y } = getCoords(e);
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.strokeStyle = drawColor; ctx.lineWidth = brushSize;
    ctx.lineTo(x, y); ctx.stroke();
  };
  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const ctx = ctxRef.current; if (!ctx) return;
    e.preventDefault();
    const { x, y } = getCoords(e);
    ctx.strokeStyle = drawColor; ctx.lineWidth = brushSize;
    ctx.lineTo(x, y); ctx.stroke();
  };
  const onMouseUp = () => { ctxRef.current?.closePath(); setIsDrawing(false); };

  const clearCanvas = () => {
    const canvas = canvasRef.current; const ctx = ctxRef.current;
    if (!canvas || !ctx || drawingDone) return;
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const submitDrawing = async () => {
    const canvas = canvasRef.current;
    if (!canvas || drawingDone) return;
    const imageData = canvas.toDataURL('image/png');
    const name = charName || 'Character';
    setDrawingDone(true);
    setDrawingStatus('submitting');
    try {
      const res = await fetch('/api/add-character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ show_id: showIdRef.current, name, image_data: imageData }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStyledUrl(data.styled_frame_url);
      setDrawingStatus('done');
    } catch {
      setDrawingStatus('error');
      setDrawingDone(false); // allow retry
    }
  };

  // ── Voice ────────────────────────────────────────────────────────────────
  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setVoiceError("Voice not supported — type instead."); return; }
    setVoiceError(null); setTextInput('');
    const rec = new SR(); rec.continuous = false; rec.interimResults = true; rec.lang = 'en-US';
    recRef.current = rec;
    rec.onresult = (e: any) => setTextInput(Array.from(e.results as any[]).map((r: any) => r[0].transcript).join(''));
    rec.onend = () => { setIsListening(false); recRef.current = null; setTextInput(prev => { if (prev.trim()) advance(prev.trim()); return prev; }); };
    rec.onerror = (e: any) => { setIsListening(false); recRef.current = null; if (e.error !== 'aborted') setVoiceError("Couldn't hear you — try again."); };
    rec.start(); setIsListening(true);
  };

  const stopVoice = () => { recRef.current?.stop(); recRef.current = null; setIsListening(false); };

  // ── Advance step ─────────────────────────────────────────────────────────
  const advance = (val: string) => {
    if (!val.trim()) return;
    stopVoice();
    const key = steps[stepIndex].key;
    let newCharName = charName;
    let newTraits = { ...characterTraits };
    if (key === 'charName') { newCharName = val.trim(); setCharName(newCharName); }
    else { newTraits[key] = val.trim(); setCharacterTraits(newTraits); }

    if (stepIndex < steps.length - 1) {
      setStepIndex(s => s + 1);
      setTextInput('');
      setVoiceError(null);
    } else {
      // Fire intro job immediately — it generates while user navigates + reads challenge
      const introJobId = crypto.randomUUID();
      fetch('/api/generate-intro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: introJobId,
          show_id: showIdRef.current,
          char_name: newCharName,
          character_traits: newTraits,
          story_name: `${newCharName}'s Adventure`,
        }),
      }).catch(() => {});

      navigate('/viewing', {
        state: {
          charName: newCharName,
          characterTraits: newTraits,
          showId: showIdRef.current,
          storyDetails: ['', newCharName, '', ''],
          introJobId,
        },
      });
    }
  };

  const handleTextNext = () => { if (textInput.trim()) advance(textInput); };

  return (
    <div className="size-full bg-white flex flex-col overflow-hidden border-[12px] border-[#E63946]">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b-2 border-gray-100 flex-shrink-0">
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/story-choice')}
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full font-bold flex items-center gap-2 text-sm border-2 border-gray-300"
          style={{ fontFamily: 'Comic Sans MS, cursive' }}
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </motion.button>

        <h2 className="text-xl font-bold text-[#FF6B6B]" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
          Create Your Character! 🌟
        </h2>

        {/* Progress dots */}
        <div className="flex gap-2 items-center">
          {steps.map((_, i) => (
            <div key={i} className={`w-3 h-3 rounded-full transition-all ${i < stepIndex ? 'bg-green-400' : i === stepIndex ? 'bg-[#FF6B6B]' : 'bg-gray-300'}`} />
          ))}
        </div>
      </div>

      {/* Main split area */}
      <div className="flex flex-1 gap-0 overflow-hidden">

        {/* ── LEFT: Drawing panel ────────────────────────────────────────── */}
        <div className="w-[480px] flex-shrink-0 bg-gradient-to-b from-red-50 to-red-100 flex flex-col p-4 gap-3 border-r-4 border-[#E63946]">
          <p className="text-center font-bold text-[#E63946] text-base" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
            {charName ? `Draw ${charName}! 🎨` : 'Draw your character! 🎨'}
          </p>

          {/* Canvas */}
          <div className="relative rounded-2xl overflow-hidden border-4 border-gray-800 shadow-inner bg-white flex-1">
            <canvas
              ref={canvasRef}
              width={600}
              height={340}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              className={`w-full h-full touch-none ${drawingDone ? 'cursor-default' : 'cursor-crosshair'}`}
              style={{ imageRendering: 'auto' }}
            />
            {/* Styled overlay */}
            {styledUrl && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-white flex items-center justify-center">
                <img src={styledUrl} className="w-full h-full object-contain" alt="Styled character" />
                <div className="absolute bottom-2 left-0 right-0 text-center">
                  <span className="bg-green-400 text-white text-xs font-bold px-3 py-1 rounded-full" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                    ✓ Looking great!
                  </span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Color palette */}
          {!drawingDone && (
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {DRAW_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setDrawColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${drawColor === c ? 'scale-125 border-gray-800' : 'border-gray-400'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
              {/* Brush sizes */}
              {[3, 6, 12].map((s, i) => (
                <button key={s} onClick={() => setBrushSize(s)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${brushSize === s ? 'border-gray-800 bg-gray-200' : 'border-gray-300 bg-white'}`}>
                  <div className="rounded-full bg-gray-700" style={{ width: i === 0 ? 4 : i === 1 ? 8 : 13, height: i === 0 ? 4 : i === 1 ? 8 : 13 }} />
                </button>
              ))}
            </div>
          )}

          {/* Drawing actions */}
          <div className="flex gap-2 justify-center">
            {!drawingDone && (
              <>
                <motion.button whileTap={{ scale: 0.95 }} onClick={clearCanvas}
                  className="flex items-center gap-1 px-4 py-2 rounded-full bg-gray-200 text-gray-700 font-bold text-sm"
                  style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                  <Trash2 className="w-4 h-4" /> Clear
                </motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={submitDrawing}
                  className="flex items-center gap-2 px-6 py-2 rounded-full bg-[#FF6B6B] text-white font-bold text-sm shadow-lg"
                  style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                  <Check className="w-4 h-4" /> Done Drawing!
                </motion.button>
              </>
            )}
            {drawingStatus === 'submitting' && (
              <div className="flex items-center gap-2 text-sm text-gray-500" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-[#FF6B6B] border-t-transparent rounded-full" />
                Styling your character...
              </div>
            )}
            {drawingStatus === 'error' && (
              <button onClick={() => setDrawingDone(false)} className="text-red-500 text-sm underline" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                ✗ Styling failed — try again
              </button>
            )}
          </div>
        </div>

        {/* ── RIGHT: Question panel ──────────────────────────────────────── */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-5">
          {/* Simon (compact) */}
          <StoryGuide message={currentQuestion} isAnimating={true} />

          {/* Answer input */}
          <div className="w-full max-w-sm flex flex-col gap-4">
            <div className="flex gap-2">
              <input
                autoFocus
                key={stepIndex}
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                placeholder="Type your answer..."
                className="flex-1 px-5 py-3 rounded-2xl text-lg border-4 border-[#4ECDC4] focus:outline-none focus:border-[#FF6B6B] text-gray-800"
                style={{ fontFamily: 'Comic Sans MS, cursive' }}
                onKeyDown={e => { if (e.key === 'Enter') handleTextNext(); }}
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => isListening ? stopVoice() : startVoice()}
                className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ${isListening ? 'bg-[#FF6B6B]' : 'bg-gray-200'}`}
              >
                {isListening
                  ? <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.8, repeat: Infinity }}><Mic className="w-5 h-5 text-white" /></motion.div>
                  : <MicOff className="w-5 h-5 text-gray-600" />}
              </motion.button>
            </div>

            {voiceError && <p className="text-red-500 text-sm text-center">{voiceError}</p>}

            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={handleTextNext}
              disabled={!textInput.trim()}
              className="w-full py-4 rounded-full bg-[#FF6B6B] text-white text-xl font-bold shadow-xl disabled:opacity-40 flex items-center justify-center gap-2"
              style={{ fontFamily: 'Comic Sans MS, cursive' }}
            >
              {stepIndex < steps.length - 1 ? <>Next <ChevronRight className="w-6 h-6" /></> : <>Let's go! 🎬</>}
            </motion.button>

            {/* Step hint */}
            <p className="text-center text-gray-400 text-sm" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
              {stepIndex === 0 && 'Draw your character on the left while you answer!'}
              {stepIndex === 1 && `Hit "Done Drawing" when you're happy with ${charName || 'your drawing'}!`}
              {stepIndex >= 2 && 'Almost there — one more question!'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
