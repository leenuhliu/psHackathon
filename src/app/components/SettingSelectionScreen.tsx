import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import { StoryGuide } from './StoryGuide';
import { Mic, MicOff, Keyboard, ArrowLeft } from 'lucide-react';
import { useState, useRef } from 'react';

const PREMADE_SETTINGS = [
  { id: 'ocean',  label: 'The Deep Ocean',  icon: '🌊', color: '#4ECDC4' },
  { id: 'space',  label: 'Outer Space',      icon: '🚀', color: '#6A4C93' },
  { id: 'forest', label: 'Enchanted Forest', icon: '🌲', color: '#88D49E' },
  { id: 'dino',   label: 'Dino Island',      icon: '🦖', color: '#FFB067' },
  { id: 'castle', label: 'Magic Castle',     icon: '🏰', color: '#B588D4' },
  { id: 'farm',   label: 'Sunny Farm',       icon: '🚜', color: '#F4D03F' },
  { id: 'city',   label: 'Busy City',        icon: '🏙️', color: '#85929E' },
  { id: 'cave',   label: 'Secret Cave',      icon: '🦇', color: '#5D6D7E' },
];

export function SettingSelectionScreen() {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [inputMode, setInputMode] = useState<'voice' | 'text' | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setVoiceError('Voice not supported here. Please type instead.'); setInputMode('text'); return; }
    setVoiceError(null); setCustomInput('');
    const rec = new SR();
    rec.continuous = false; rec.interimResults = true; rec.lang = 'en-US';
    recognitionRef.current = rec;
    rec.onresult = (e: any) => setCustomInput(Array.from(e.results as any[]).map((r: any) => r[0].transcript).join(''));
    rec.onend = () => {
      setIsListening(false); recognitionRef.current = null;
      setCustomInput(prev => { if (prev.trim()) handleConfirm(prev.trim()); return prev; });
    };
    rec.onerror = (e: any) => {
      setIsListening(false); recognitionRef.current = null;
      if (e.error !== 'aborted') setVoiceError('Could not hear you. Try again or type.');
    };
    rec.start(); setIsListening(true); setInputMode('voice');
  };

  const stopVoice = () => { recognitionRef.current?.stop(); recognitionRef.current = null; setIsListening(false); };

  const handleConfirm = (setting: string, settingId: string = 'custom') => {
    stopVoice(); setShowConfirmation(true);
    setTimeout(() => navigate('/story-choice', { state: { setting, settingId } }), 3000);
  };

  return (
    <div className="size-full bg-white flex flex-col items-center p-8 overflow-hidden relative">
      <div className="flex flex-col items-center w-full max-w-6xl flex-1 justify-center z-10">
        <AnimatePresence mode="wait">
          {!showConfirmation ? (
            <motion.div
              key="selection"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center w-full h-full justify-between pt-4 pb-4"
            >
              <div className="flex flex-col items-center w-full gap-6 shrink-0 relative pt-4">
                <div className="w-full relative flex items-center justify-center h-32">
                  <motion.button
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/')}
                    className="absolute left-0 bg-white text-gray-700 px-6 py-3 rounded-full text-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 border-4 border-gray-300 z-10"
                    style={{ fontFamily: 'Comic Sans MS, cursive' }}
                  >
                    <ArrowLeft className="w-6 h-6" /> Back
                  </motion.button>
                  <StoryGuide message="Where should our adventure take place?" isAnimating={true} />
                </div>

                {inputMode === 'text' ? (
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md px-8">
                    <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                      Type your setting!
                    </h3>
                    <textarea
                      value={customInput} onChange={e => setCustomInput(e.target.value)}
                      className="w-full h-32 p-4 rounded-xl border-4 border-yellow-400 focus:outline-none text-xl resize-none shadow-inner bg-white"
                      placeholder="A magical candy castle..." autoFocus
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (customInput.trim()) handleConfirm(customInput.trim()); } }}
                    />
                    <div className="flex justify-end mt-4 gap-3">
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => { setInputMode(null); setCustomInput(''); }}
                        className="bg-gray-200 text-gray-700 px-6 py-2 rounded-full font-bold shadow-md"
                        style={{ fontFamily: 'Comic Sans MS, cursive' }}>Cancel</motion.button>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => { if (customInput.trim()) handleConfirm(customInput.trim()); }}
                        disabled={!customInput.trim()}
                        className="bg-[#FFD700] text-gray-800 px-8 py-2 rounded-full font-bold shadow-md border-b-4 border-[#D4A000] disabled:opacity-50"
                        style={{ fontFamily: 'Comic Sans MS, cursive' }}>Done!</motion.button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center relative w-full justify-center">
                    <p className="text-2xl font-extrabold text-gray-800 mb-6 text-center" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                      Press speak when ready!
                    </p>
                    <motion.button
                      onClick={() => isListening ? stopVoice() : startVoice()}
                      animate={isListening ? { scale: [1,1.05,1], boxShadow: ["0 0 0 0 rgba(255,215,0,0)","0 0 0 20px rgba(255,215,0,0.4)","0 0 0 0 rgba(255,215,0,0)"] } : { scale: 1 }}
                      transition={isListening ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } : {}}
                      whileHover={!isListening ? { scale: 1.05 } : {}} whileTap={!isListening ? { scale: 0.95 } : {}}
                      className="relative flex flex-col items-center justify-center w-40 h-40 rounded-full border-8 border-white bg-[#FFD700] shadow-2xl z-20"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-full pointer-events-none" />
                      {isListening
                        ? <Mic className="w-12 h-12 mb-1 z-10 text-white animate-pulse" />
                        : <MicOff className="w-12 h-12 mb-1 z-10 text-white" />}
                      <span className="text-xl font-extrabold text-white tracking-wider z-10" style={{ fontFamily: 'Comic Sans MS, cursive', textShadow: '2px 2px 0px rgba(0,0,0,0.2)' }}>
                        {isListening ? 'Listening...' : 'Press Speak'}
                      </span>
                    </motion.button>
                    {customInput && <p className="mt-3 text-lg text-gray-600 italic text-center">"{customInput}"</p>}
                    {voiceError && <p className="mt-2 text-red-500 text-sm">{voiceError}</p>}
                    <motion.button
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                      onClick={() => { stopVoice(); setInputMode('text'); }}
                      className="absolute bottom-0 right-[20%] text-gray-500 font-bold hover:text-gray-800 flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl shadow-sm z-20"
                      style={{ fontFamily: 'Comic Sans MS, cursive' }}
                    >
                      <Keyboard className="w-5 h-5" /> or press to type
                    </motion.button>
                  </div>
                )}
              </div>

              <div className="w-full flex flex-col gap-4 mt-8 pb-4 shrink-0">
                <h3 className="text-2xl font-bold text-gray-600 text-center" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                  Or explore our worlds!
                </h3>
                <div className="relative w-full max-w-5xl mx-auto">
                  <div className="absolute left-0 top-0 bottom-8 w-12 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
                  <div className="flex gap-4 overflow-x-auto pb-4 px-8 hide-scrollbar touch-pan-x snap-x snap-mandatory scroll-pl-8">
                    {PREMADE_SETTINGS.map((setting, index) => (
                      <motion.button
                        key={setting.id}
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + Math.min(index * 0.1, 0.5) }}
                        whileHover={{ scale: 1.05, y: -5 }} whileTap={{ scale: 0.95 }}
                        onClick={() => handleConfirm(setting.label, setting.id)}
                        className="flex flex-col items-center justify-center p-4 rounded-3xl border-8 shadow-xl min-w-[160px] aspect-[4/3] shrink-0 gap-2 hover:brightness-110 transition-all snap-start"
                        style={{ backgroundColor: setting.color, borderColor: 'rgba(255,255,255,0.5)' }}
                      >
                        <span className="text-4xl bg-white/20 p-3 rounded-full shadow-inner">{setting.icon}</span>
                        <span className="text-white text-lg font-bold text-center leading-tight" style={{ fontFamily: 'Comic Sans MS, cursive', textShadow: '1px 1px 0px rgba(0,0,0,0.2)' }}>
                          {setting.label}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                  <div className="absolute right-0 top-0 bottom-8 w-12 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
                </div>
                <div className="flex items-center justify-center gap-3 text-gray-400">
                  <ArrowLeft className="w-4 h-4 animate-pulse" />
                  <span className="text-sm font-bold uppercase tracking-wider" style={{ fontFamily: 'Comic Sans MS, cursive' }}>Swipe to see more</span>
                  <ArrowLeft className="w-4 h-4 rotate-180 animate-pulse" />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="confirmation" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center h-full w-full">
              <StoryGuide message="Great choice! Now let's pick how to make your story! 🎨" isAnimating={true} />
              <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: [1,1.1,0.9,1], opacity: 1 }}
                transition={{ delay: 0.5, duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} className="mt-12">
                <span className="text-6xl">✨</span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <style>{`.hide-scrollbar::-webkit-scrollbar{display:none}.hide-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
    </div>
  );
}
