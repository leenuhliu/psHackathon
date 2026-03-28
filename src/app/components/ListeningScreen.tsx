import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import { StoryGuide } from './StoryGuide';
import { Mic, MicOff, Type, Check, ChevronRight, ArrowLeft } from 'lucide-react';
import { useState, useRef, useMemo } from 'react';
import { useNarration } from '../hooks/useNarration';

// ── Question pool ────────────────────────────────────────────────────────────
const TRAIT_POOL = [
  { key: 'fears',            template: 'What is {name} a little afraid of?' },
  { key: 'favoriteFood',     template: "What is {name}'s favorite food?" },
  { key: 'favoriteAnimal',   template: "What is {name}'s favorite animal?" },
  { key: 'talent',           template: "What is {name}'s special talent or superpower?" },
  { key: 'makesHappy',       template: 'What makes {name} the happiest?' },
  { key: 'dreams',           template: 'What does {name} dream about?' },
  { key: 'biggestWish',      template: "What is {name}'s biggest wish?" },
  { key: 'bestFriend',       template: "Who is {name}'s best friend?" },
  { key: 'favoriteColor',    template: "What is {name}'s favorite color?" },
  { key: 'neverLeaveWithout', template: 'What would {name} never leave home without?' },
];

function pickRandomTrait() {
  return TRAIT_POOL[Math.floor(Math.random() * TRAIT_POOL.length)];
}

function fillName(template: string, name: string) {
  return template.replace(/\{name\}/g, name || 'your character');
}

// ── Step definitions ─────────────────────────────────────────────────────────
// Steps are built dynamically — step 2 depends on the charName collected in step 0.
interface Step {
  key: string;
  question: (charName: string) => string;
}

const FIXED_STEPS: Step[] = [
  { key: 'charName', question: () => "What's your main character's name?" },
  { key: 'loves',    question: (n) => `What does ${n || 'your character'} love to do most?` },
];

export function ListeningScreen() {
  const navigate = useNavigate();

  // Pick one random trait question for step 2 — stable for the lifetime of this screen
  const randomTrait = useMemo(() => pickRandomTrait(), []);
  const steps: Step[] = [
    ...FIXED_STEPS,
    { key: randomTrait.key, question: (n) => fillName(randomTrait.template, n) },
  ];

  const [stepIndex, setStepIndex] = useState(0);
  const [inputMode, setInputMode] = useState<'voice' | 'text' | null>(null);
  const [userInput, setUserInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [charName, setCharName] = useState('');
  const [characterTraits, setCharacterTraits] = useState<Record<string, string>>({});
  const recognitionRef = useRef<any>(null);

  const currentStep = steps[stepIndex];
  const currentQuestion = currentStep.question(charName);
  useNarration(currentQuestion);

  // ── Voice helpers ────────────────────────────────────────────────────────
  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setVoiceError('Voice not supported here. Please type instead.');
      setInputMode('text');
      return;
    }
    setVoiceError(null);
    setUserInput('');
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-US';
    recognitionRef.current = rec;

    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results as any[])
        .map((r: any) => r[0].transcript)
        .join('');
      setUserInput(transcript);
    };
    rec.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
      setUserInput(prev => { if (prev.trim()) setShowConfirmation(true); return prev; });
    };
    rec.onerror = (e: any) => {
      setIsListening(false);
      recognitionRef.current = null;
      if (e.error !== 'aborted') setVoiceError('Could not hear you. Try again or type.');
    };
    rec.start();
    setIsListening(true);
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  };

  // ── Navigation ───────────────────────────────────────────────────────────
  const handleConfirm = () => {
    stopVoice();
    const val = userInput.trim();
    const key = currentStep.key;

    // Save answer
    let newCharName = charName;
    let newTraits = { ...characterTraits };
    if (key === 'charName') {
      newCharName = val;
      setCharName(val);
    } else {
      newTraits[key] = val;
      setCharacterTraits(newTraits);
    }

    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
      setUserInput('');
      setInputMode(null);
      setShowConfirmation(false);
      setVoiceError(null);
    } else {
      // All done — go to drawing
      navigate('/drawing', {
        state: {
          charName: newCharName,
          characterTraits: newTraits,
          // Keep storyDetails[1] = charName for DrawingScreen compatibility
          storyDetails: ['', newCharName, '', ''],
        },
      });
    }
  };

  const handleTryAgain = () => {
    stopVoice();
    setUserInput('');
    setShowConfirmation(false);
    setInputMode(null);
    setVoiceError(null);
  };

  const handleTextSubmit = () => { if (userInput.trim()) setShowConfirmation(true); };

  return (
    <div className="size-full bg-white flex flex-col items-center justify-between p-8 overflow-hidden">
      {/* Back */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/story-choice')}
        className="absolute top-8 left-8 bg-white text-gray-700 px-6 py-3 rounded-full text-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 border-4 border-gray-300 z-10"
        style={{ fontFamily: 'Comic Sans MS, cursive' }}
      >
        <ArrowLeft className="w-6 h-6" />
        Back
      </motion.button>

      {/* Progress dots */}
      <div className="w-full max-w-4xl">
        <div className="flex gap-2 justify-center">
          {steps.map((_, index) => (
            <motion.div
              key={index}
              className={`h-3 rounded-full ${index <= stepIndex ? 'bg-[#FF6B6B]' : 'bg-gray-300'}`}
              initial={{ width: 0 }}
              animate={{ width: index <= stepIndex ? 80 : 60 }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>
        <p className="text-center text-gray-700 mt-2 text-lg" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
          Question {stepIndex + 1} of {steps.length}
        </p>
      </div>

      {/* Main area */}
      <div className="flex flex-col items-center gap-8 max-w-3xl w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={stepIndex}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-8 w-full"
          >
            <StoryGuide message={currentQuestion} isAnimating={true} />

            {!showConfirmation ? (
              <>
                {inputMode === null && (
                  <div className="flex gap-6">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { setInputMode('voice'); startVoice(); }}
                      className="bg-[#4ECDC4] text-white px-10 py-8 rounded-3xl text-2xl font-bold shadow-xl flex flex-col items-center gap-3 min-w-[200px]"
                      style={{ fontFamily: 'Comic Sans MS, cursive' }}
                    >
                      <Mic className="w-16 h-16" />
                      Speak
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setInputMode('text')}
                      className="bg-[#FFD93D] text-gray-800 px-10 py-8 rounded-3xl text-2xl font-bold shadow-xl flex flex-col items-center gap-3 min-w-[200px]"
                      style={{ fontFamily: 'Comic Sans MS, cursive' }}
                    >
                      <Type className="w-16 h-16" />
                      Type
                    </motion.button>
                  </div>
                )}

                {inputMode === 'voice' && (
                  <div className="flex flex-col items-center gap-5">
                    <motion.button
                      animate={{ scale: isListening ? [1, 1.15, 1] : 1 }}
                      transition={{ duration: 1, repeat: isListening ? Infinity : 0 }}
                      onClick={() => isListening ? stopVoice() : startVoice()}
                      className={`rounded-full p-8 shadow-2xl ${isListening ? 'bg-[#FF6B6B]' : 'bg-gray-400'}`}
                    >
                      {isListening
                        ? <Mic className="w-20 h-20 text-white" />
                        : <MicOff className="w-20 h-20 text-white" />}
                    </motion.button>
                    <p className="text-3xl text-gray-800 font-bold" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                      {isListening ? 'Listening...' : 'Tap to speak'}
                    </p>
                    {userInput && (
                      <p className="text-xl text-gray-600 italic text-center">"{userInput}"</p>
                    )}
                    {voiceError && <p className="text-red-500 text-sm">{voiceError}</p>}
                    <button
                      onClick={() => { stopVoice(); setInputMode('text'); }}
                      className="text-gray-400 underline text-lg"
                      style={{ fontFamily: 'Comic Sans MS, cursive' }}
                    >
                      Type instead
                    </button>
                  </div>
                )}

                {inputMode === 'text' && (
                  <div className="flex flex-col gap-6 items-center w-full">
                    <textarea
                      autoFocus
                      value={userInput}
                      onChange={e => setUserInput(e.target.value)}
                      placeholder="Type your answer here..."
                      className="w-full max-w-2xl p-6 rounded-3xl text-2xl border-4 border-[#4ECDC4] focus:outline-none focus:border-[#FF6B6B] min-h-[140px] resize-none text-gray-800"
                      style={{ fontFamily: 'Comic Sans MS, cursive' }}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleTextSubmit(); } }}
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleTextSubmit}
                      disabled={!userInput.trim()}
                      className="bg-[#4ECDC4] text-white px-12 py-6 rounded-full text-2xl font-bold shadow-xl disabled:opacity-50 flex items-center gap-3"
                      style={{ fontFamily: 'Comic Sans MS, cursive' }}
                    >
                      Next <ChevronRight className="w-8 h-8" />
                    </motion.button>
                  </div>
                )}
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col gap-6 items-center"
              >
                <div className="bg-white rounded-3xl p-8 shadow-xl max-w-2xl border-4 border-[#4ECDC4]">
                  <p className="text-xl text-gray-500 mb-3 text-center" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                    You said:
                  </p>
                  <p className="text-2xl text-[#4ECDC4] font-bold text-center" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                    "{userInput}"
                  </p>
                </div>
                <div className="flex gap-6">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleTryAgain}
                    className="bg-[#FFAAA5] text-white px-12 py-6 rounded-full text-2xl font-bold shadow-xl"
                    style={{ fontFamily: 'Comic Sans MS, cursive' }}
                  >
                    Try Again
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleConfirm}
                    className="bg-[#A8E6CF] text-white px-12 py-6 rounded-full text-2xl font-bold shadow-xl flex items-center gap-3"
                    style={{ fontFamily: 'Comic Sans MS, cursive' }}
                  >
                    <Check className="w-8 h-8" />
                    Yes! Continue
                  </motion.button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="h-8" />
    </div>
  );
}
