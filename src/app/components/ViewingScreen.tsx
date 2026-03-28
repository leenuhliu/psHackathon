import { motion } from 'motion/react';
import { useLocation, useNavigate } from 'react-router';
import { StoryGuide } from './StoryGuide';
import { Home, PlayCircle, RotateCcw, Image as ImageIcon, ChevronRight, Download, Trash2 } from 'lucide-react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useNarration } from '../hooks/useNarration';

const TOTAL_SCENES = 3;

type ScreenState = 'ready' | 'challenge' | 'generating' | 'playing' | 'naming' | 'replay' | 'done';

interface Challenge {
  challenge_text: string;
  challenge_short: string;
  challenge_image_url?: string;
}

export function ViewingScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const storyDetails: string[] = location.state?.storyDetails || [];
  const charNameFromState: string = location.state?.charName || '';
  const characterTraitsFromState: Record<string, string> = location.state?.characterTraits || {};
  const showIdRef = useRef<string>(location.state?.showId || crypto.randomUUID());

  const [screenState, setScreenState] = useState<ScreenState>('ready');
  const [currentScene, setCurrentScene] = useState(1);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [solution, setSolution] = useState('');
  const [progressLabel, setProgressLabel] = useState('');
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [audioUrls, setAudioUrls] = useState<string[]>([]);
  const [closingLine, setClosingLine] = useState<string | null>(null);
  const [episodeTitles, setEpisodeTitles] = useState<string[]>([]);
  const [isLoadingChallenge, setIsLoadingChallenge] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replaySlide, setReplaySlide] = useState(0);

  // Parental approval
  const [approvalPending, setApprovalPending] = useState(false);
  const [approvalReason, setApprovalReason] = useState('');

  // Story naming
  const [storyTitle, setStoryTitle] = useState('');
  const [isSavingTitle, setIsSavingTitle] = useState(false);

  // Export
  const [isExporting, setIsExporting] = useState(false);

  // Loading-draw canvas (draw while Veo generates)
  const loadingCanvasRef = useRef<HTMLCanvasElement>(null);
  const loadingCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [loadingIsDrawing, setLoadingIsDrawing] = useState(false);
  const [loadingCharName, setLoadingCharName] = useState('');
  const [loadingChars, setLoadingChars] = useState<{ name: string; url?: string; status: 'pending' | 'done' | 'error' }[]>([]);
  const [isSubmittingChar, setIsSubmittingChar] = useState(false);
  // track pending approvals across re-renders
  const pendingApprovalRef = useRef<{ solution: string; challenge_text: string } | null>(null);

  // Custom adventure path: charName + characterTraits
  // Template path: storyDetails array [setting, char, adventure, ending]
  const storyName = charNameFromState
    ? `${charNameFromState}'s Story`
    : (storyDetails[1] || storyDetails[0] || 'My Adventure');

  const TRAIT_LABELS: Record<string, string> = {
    fears:             '{name} is a little afraid of',
    favoriteFood:      "{name}'s favorite food is",
    favoriteAnimal:    "{name}'s favorite animal is",
    talent:            "{name}'s special talent is",
    makesHappy:        '{name} is happiest when',
    dreams:            '{name} dreams about',
    biggestWish:       "{name}'s biggest wish is",
    bestFriend:        "{name}'s best friend is",
    favoriteColor:     "{name}'s favorite color is",
    neverLeaveWithout: '{name} never leaves home without',
  };

  const storyContext = charNameFromState
    ? [
        `Main character: ${charNameFromState}`,
        characterTraitsFromState.loves && `${charNameFromState} loves: ${characterTraitsFromState.loves}`,
        ...Object.entries(characterTraitsFromState)
          .filter(([k]) => k !== 'loves')
          .map(([k, v]) => {
            const label = (TRAIT_LABELS[k] || k).replace('{name}', charNameFromState);
            return `${label}: ${v}`;
          }),
      ].filter(Boolean).join('\n')
    : [
        storyDetails[0] && `Setting: ${storyDetails[0]}`,
        storyDetails[1] && `Main character: ${storyDetails[1]}`,
        storyDetails[2] && `Adventure: ${storyDetails[2]}`,
        storyDetails[3] && `Ending: ${storyDetails[3]}`,
      ].filter(Boolean).join('\n');

  // ── Loading canvas init ──────────────────────────────────────────────────
  useEffect(() => {
    if (screenState !== 'generating') return;
    const canvas = loadingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    loadingCtxRef.current = ctx;
  }, [screenState]);

  const getLoadingCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = loadingCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const src = 'touches' in e ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top) * scaleY,
    };
  };

  const onLoadingMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const ctx = loadingCtxRef.current;
    if (!ctx) return;
    e.preventDefault();
    setLoadingIsDrawing(true);
    const { x, y } = getLoadingCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 4;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const onLoadingMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!loadingIsDrawing) return;
    const ctx = loadingCtxRef.current;
    if (!ctx) return;
    e.preventDefault();
    const { x, y } = getLoadingCanvasCoords(e);
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 4;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const onLoadingMouseUp = () => {
    loadingCtxRef.current?.closePath();
    setLoadingIsDrawing(false);
  };

  const clearLoadingCanvas = () => {
    const canvas = loadingCanvasRef.current;
    const ctx = loadingCtxRef.current;
    if (!canvas || !ctx) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleSubmitLoadingChar = async () => {
    if (!loadingCharName.trim()) return;
    const canvas = loadingCanvasRef.current;
    if (!canvas) return;
    const imageData = canvas.toDataURL('image/png');
    const name = loadingCharName.trim();
    setLoadingCharName('');
    clearLoadingCanvas();

    const idx = loadingChars.length;
    setLoadingChars(prev => [...prev, { name, status: 'pending' }]);
    setIsSubmittingChar(true);

    try {
      const res = await fetch('/api/add-character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ show_id: showIdRef.current, name, image_data: imageData }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setLoadingChars(prev => prev.map((c, i) => i === idx ? { ...c, url: data.styled_frame_url, status: 'done' } : c));
    } catch {
      setLoadingChars(prev => prev.map((c, i) => i === idx ? { ...c, status: 'error' } : c));
    } finally {
      setIsSubmittingChar(false);
    }
  };

  // ── Challenge fetch ──────────────────────────────────────────────────────
  const fetchChallenge = useCallback(async (sceneNum: number) => {
    setIsLoadingChallenge(true);
    setError(null);
    try {
      const resp = await fetch('/api/generate-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          show_id: showIdRef.current,
          scene_number: sceneNum,
          story_name: storyName,
          story_context: storyContext,
        }),
      });
      if (!resp.ok) throw new Error('Failed to get challenge');
      const data = await resp.json();
      setChallenge(data);
      setScreenState('challenge');
    } catch {
      setError('Could not load challenge. Try again!');
      setScreenState('challenge');
    } finally {
      setIsLoadingChallenge(false);
    }
  }, [storyName, storyContext]);

  // ── Scene generation ─────────────────────────────────────────────────────
  const runGenerate = useCallback(async (parentApproved: boolean) => {
    const sol = pendingApprovalRef.current?.solution ?? solution.trim();
    const challengeText = pendingApprovalRef.current?.challenge_text ?? challenge?.challenge_text ?? '';

    setError(null);
    setProgressLabel('Starting your scene...');
    setScreenState('generating');
    setLoadingChars([]);

    try {
      const resp = await fetch('/api/generate-scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          show_id: showIdRef.current,
          scene_number: currentScene,
          solution: sol,
          challenge_text: challengeText,
          story_name: storyName,
          story_context: storyContext,
          parent_approved: parentApproved,
        }),
      });
      if (!resp.ok) throw new Error('Failed to start scene generation');
      const { job_id } = await resp.json();

      // Skip voice moment immediately
      await fetch(`/api/scene-voice-response/${job_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voice_response: null }),
      });

      // Poll until done
      while (true) {
        await new Promise(r => setTimeout(r, 3000));
        const pollResp = await fetch(`/api/scene-progress/${job_id}`);
        const job = await pollResp.json();
        setProgressLabel(job.label || '');

        if (job.status === 'done') {
          pendingApprovalRef.current = null;
          setVideoUrls(prev => [...prev, job.result.video_url]);
          setAudioUrls(prev => [...prev, job.result.audio_url]);
          setEpisodeTitles(prev => [...prev, job.result.episode_title || `Scene ${currentScene}`]);
          if (job.result.closing_line) setClosingLine(job.result.closing_line);
          setScreenState('playing');
          break;
        } else if (job.status === 'error') {
          throw new Error(job.error || 'Scene generation failed');
        } else if (job.status === 'needs_approval') {
          pendingApprovalRef.current = { solution: sol, challenge_text: challengeText };
          setApprovalReason(job.reason || 'The story idea needs a parent to review it.');
          setApprovalPending(true);
          setScreenState('challenge');
          break;
        }
      }
    } catch (e: any) {
      pendingApprovalRef.current = null;
      setError(e.message || 'Something went wrong. Try again!');
      setScreenState('challenge');
    }
  }, [currentScene, solution, challenge, storyName, storyContext]);

  const submitSolution = () => {
    if (!solution.trim()) return;
    pendingApprovalRef.current = { solution: solution.trim(), challenge_text: challenge?.challenge_text ?? '' };
    runGenerate(false);
  };

  const handleApprove = () => {
    setApprovalPending(false);
    runGenerate(true);
  };

  const handleDeny = () => {
    setApprovalPending(false);
    pendingApprovalRef.current = null;
    setSolution('');
    setError('Please try a different idea!');
  };

  // ── Video events ─────────────────────────────────────────────────────────
  const handleVideoEnded = () => {
    if (currentScene < TOTAL_SCENES) {
      const next = currentScene + 1;
      setCurrentScene(next);
      setSolution('');
      fetchChallenge(next);
    } else {
      setScreenState('naming');
    }
  };

  const handleReplayEnded = () => {
    if (replaySlide < videoUrls.length - 1) {
      setReplaySlide(prev => prev + 1);
    } else {
      setScreenState('done');
    }
  };

  // ── Story naming ─────────────────────────────────────────────────────────
  const handleSubmitStoryName = async () => {
    const title = storyTitle.trim() || storyName;
    setIsSavingTitle(true);
    try {
      await fetch(`/api/story/${showIdRef.current}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story_name: title }),
      });
    } catch { /* non-fatal */ }
    setIsSavingTitle(false);
    setScreenState('done');
  };

  // ── Export ───────────────────────────────────────────────────────────────
  const handleExport = async () => {
    setIsExporting(true);
    setError(null);
    try {
      const res = await fetch(`/api/export-story/${showIdRef.current}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const a = document.createElement('a');
      a.href = data.url;
      a.download = `${storyTitle || storyName}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e: any) {
      setError('Export failed: ' + e.message);
    } finally {
      setIsExporting(false);
    }
  };

  // ── Render helpers ───────────────────────────────────────────────────────
  const storyGuideMessage = {
    ready: "Lights, camera, action! Click to start your adventure!",
    challenge: "Here's your challenge! What will you do?",
    generating: "The magic is happening... your scene is being made!",
    playing: "Watch your story come to life!",
    naming: "Your story is complete! Give it a title!",
    replay: "Here's your story!",
    done: "What a wonderful story! Want to make another one?",
  }[screenState];
  useNarration(storyGuideMessage);

  const renderScreenContent = () => {
    switch (screenState) {
      case 'ready':
        return (
          <motion.div
            className="size-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-black cursor-pointer"
            onClick={() => !isLoadingChallenge && fetchChallenge(1)}
          >
            {isLoadingChallenge ? (
              <div className="flex flex-col items-center gap-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-16 h-16 border-4 border-[#FFD93D] border-t-transparent rounded-full"
                />
                <p className="text-white text-xl" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                  Getting your story ready...
                </p>
              </div>
            ) : (
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="flex flex-col items-center gap-4">
                <PlayCircle className="w-32 h-32 text-[#FFD93D] drop-shadow-2xl" fill="#FFD93D" />
                <p className="text-white text-2xl font-bold" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                  Click to Start Your Adventure! 🎥
                </p>
              </motion.div>
            )}
          </motion.div>
        );

      case 'challenge':
        return (
          <div className="size-full flex flex-col bg-gradient-to-br from-blue-900 to-black overflow-hidden">
            {challenge?.challenge_image_url && (
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <img src={challenge.challenge_image_url} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="relative flex flex-col h-full p-6 gap-4">
              <div className="bg-yellow-400 rounded-2xl px-4 py-2 self-start">
                <p className="text-gray-800 font-bold text-sm" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                  Scene {currentScene} of {TOTAL_SCENES}
                </p>
              </div>
              <div className="flex-1 flex flex-col justify-center gap-4">
                {isLoadingChallenge ? (
                  <div className="flex flex-col items-center gap-3">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-12 h-12 border-4 border-[#FFD93D] border-t-transparent rounded-full"
                    />
                    <p className="text-white text-lg" style={{ fontFamily: 'Comic Sans MS, cursive' }}>Loading challenge...</p>
                  </div>
                ) : (
                  <>
                    <p className="text-white text-xl font-bold leading-relaxed" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                      {challenge?.challenge_text}
                    </p>
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    <textarea
                      value={solution}
                      onChange={e => setSolution(e.target.value)}
                      placeholder="What do you do? Type your idea here..."
                      className="w-full p-4 rounded-2xl text-lg border-4 border-[#4ECDC4] focus:outline-none focus:border-[#FFD93D] resize-none bg-white text-gray-800"
                      rows={3}
                      style={{ fontFamily: 'Comic Sans MS, cursive' }}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitSolution(); } }}
                    />
                  </>
                )}
              </div>
              {!isLoadingChallenge && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={submitSolution}
                  disabled={!solution.trim()}
                  className="bg-[#FF6B6B] text-white px-8 py-4 rounded-full text-xl font-bold shadow-xl disabled:opacity-40 flex items-center gap-3 self-center"
                  style={{ fontFamily: 'Comic Sans MS, cursive' }}
                >
                  Generate Scene! <ChevronRight className="w-6 h-6" />
                </motion.button>
              )}
            </div>
          </div>
        );

      case 'generating':
        return (
          <div className="size-full flex flex-col bg-gradient-to-br from-purple-900 to-black overflow-hidden">
            {/* Progress section */}
            <div className="flex flex-col items-center justify-center gap-4 p-6 flex-shrink-0">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-12 h-12 border-4 border-[#FFD93D] border-t-transparent rounded-full"
              />
              <div className="text-center">
                <p className="text-[#FFD93D] text-xl font-bold" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                  Creating Scene {currentScene}...
                </p>
                <p className="text-gray-300 text-sm" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                  {progressLabel || 'Working on your story magic...'}
                </p>
              </div>
              <div className="flex gap-3">
                {Array.from({ length: TOTAL_SCENES }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full ${
                      i < currentScene - 1 ? 'bg-green-400' : i === currentScene - 1 ? 'bg-[#FFD93D]' : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Loading draw area */}
            <div className="flex-1 border-t border-purple-700 mx-4 mb-4 rounded-2xl overflow-hidden bg-black/30 flex flex-col p-3 gap-2 min-h-0">
              <p className="text-yellow-300 text-sm font-bold text-center" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                🎨 Draw a new character to add to your story!
              </p>
              <div className="flex gap-2 items-center">
                <input
                  value={loadingCharName}
                  onChange={e => setLoadingCharName(e.target.value)}
                  placeholder="Name it..."
                  className="flex-1 px-3 py-1.5 rounded-xl text-sm text-gray-800 border-2 border-yellow-400 focus:outline-none"
                  style={{ fontFamily: 'Comic Sans MS, cursive' }}
                  onKeyDown={e => { if (e.key === 'Enter') handleSubmitLoadingChar(); }}
                />
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={clearLoadingCanvas}
                  className="px-3 py-1.5 rounded-xl bg-gray-600 text-white text-sm flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSubmitLoadingChar}
                  disabled={!loadingCharName.trim() || isSubmittingChar}
                  className="px-3 py-1.5 rounded-xl bg-yellow-400 text-gray-800 font-bold text-sm disabled:opacity-40"
                  style={{ fontFamily: 'Comic Sans MS, cursive' }}
                >
                  ✓ Done
                </motion.button>
              </div>
              <canvas
                ref={loadingCanvasRef}
                width={740}
                height={160}
                onMouseDown={onLoadingMouseDown}
                onMouseMove={onLoadingMouseMove}
                onMouseUp={onLoadingMouseUp}
                onMouseLeave={onLoadingMouseUp}
                className="w-full bg-white rounded-xl cursor-crosshair border-2 border-purple-400 touch-none"
                style={{ imageRendering: 'auto' }}
              />
              {/* Styled character cards */}
              {loadingChars.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {loadingChars.map((c, i) => (
                    <div key={i} className="text-center text-xs text-white bg-black/40 rounded-xl p-2 w-20">
                      {c.status === 'pending' && (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-6 h-6 border-2 border-yellow-300 border-t-transparent rounded-full mx-auto mb-1"
                          />
                          <span>{c.name}</span>
                        </>
                      )}
                      {c.status === 'done' && c.url && (
                        <>
                          <img src={c.url} className="w-full h-12 object-cover rounded-lg mb-1" alt={c.name} />
                          <span className="text-green-300">✓ {c.name}</span>
                        </>
                      )}
                      {c.status === 'error' && <span className="text-red-400">✗ {c.name}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'playing': {
        const videoUrl = videoUrls[currentScene - 1];
        const audioUrl = audioUrls[currentScene - 1];
        return (
          <div className="size-full relative bg-black">
            <video
              key={videoUrl}
              src={videoUrl}
              autoPlay
              onEnded={handleVideoEnded}
              className="w-full h-full object-contain"
            />
            {audioUrl && <audio key={audioUrl} src={audioUrl} autoPlay />}
            <div className="absolute top-3 left-3 bg-black/60 rounded-full px-3 py-1">
              <p className="text-white text-sm" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                {episodeTitles[currentScene - 1] || `Scene ${currentScene}`}
              </p>
            </div>
            <div className="absolute bottom-4 left-8 right-8 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-400 rounded-full transition-all"
                style={{ width: `${(currentScene / TOTAL_SCENES) * 100}%` }}
              />
            </div>
          </div>
        );
      }

      case 'naming':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="size-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-black gap-6 p-8"
          >
            <p className="text-[#FFD93D] text-4xl font-bold text-center" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
              🎬 You Did It!
            </p>
            <p className="text-white text-xl text-center" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
              What do you want to call your story?
            </p>
            <input
              autoFocus
              value={storyTitle}
              onChange={e => setStoryTitle(e.target.value)}
              placeholder={`${storyName}'s Adventure`}
              className="w-full max-w-md px-6 py-4 rounded-2xl text-xl border-4 border-[#FFD93D] focus:outline-none bg-white text-gray-800 text-center"
              style={{ fontFamily: 'Comic Sans MS, cursive' }}
              onKeyDown={e => { if (e.key === 'Enter') handleSubmitStoryName(); }}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmitStoryName}
              disabled={isSavingTitle}
              className="bg-[#FF6B6B] text-white px-12 py-4 rounded-full text-xl font-bold shadow-xl disabled:opacity-50"
              style={{ fontFamily: 'Comic Sans MS, cursive' }}
            >
              {isSavingTitle ? 'Saving...' : 'See My Story ✨'}
            </motion.button>
          </motion.div>
        );

      case 'replay': {
        const videoUrl = videoUrls[replaySlide];
        const audioUrl = audioUrls[replaySlide];
        return (
          <div className="size-full relative bg-black">
            <video
              key={videoUrl}
              src={videoUrl}
              autoPlay
              onEnded={handleReplayEnded}
              className="w-full h-full object-contain"
            />
            {audioUrl && <audio key={audioUrl} src={audioUrl} autoPlay />}
            <div className="absolute top-3 left-3 bg-black/60 rounded-full px-3 py-1">
              <p className="text-white text-sm" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                {episodeTitles[replaySlide] || `Scene ${replaySlide + 1}`}
              </p>
            </div>
            <div className="absolute bottom-4 left-8 right-8 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-400 rounded-full transition-all"
                style={{ width: `${((replaySlide + 1) / videoUrls.length) * 100}%` }}
              />
            </div>
          </div>
        );
      }

      case 'done':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="size-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-black gap-5"
          >
            <p className="text-[#FFD93D] text-5xl font-bold" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
              THE END
            </p>
            {(storyTitle || storyName) && (
              <p className="text-white text-2xl font-bold" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                "{storyTitle || storyName}"
              </p>
            )}
            {closingLine && (
              <p className="text-gray-300 text-lg text-center px-8" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                {closingLine}
              </p>
            )}
            {error && <p className="text-red-400 text-sm px-8 text-center">{error}</p>}
            <div className="flex gap-4 flex-wrap justify-center mt-2">
              {videoUrls.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { setReplaySlide(0); setScreenState('replay'); }}
                  className="bg-[#4ECDC4] text-white px-8 py-4 rounded-full text-xl font-bold shadow-xl flex items-center gap-3"
                  style={{ fontFamily: 'Comic Sans MS, cursive' }}
                >
                  <RotateCcw className="w-5 h-5" />
                  Watch Again
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleExport}
                disabled={isExporting || videoUrls.length < TOTAL_SCENES}
                className="bg-[#FFD93D] text-gray-800 px-8 py-4 rounded-full text-xl font-bold shadow-xl flex items-center gap-3 disabled:opacity-40"
                style={{ fontFamily: 'Comic Sans MS, cursive' }}
              >
                <Download className="w-5 h-5" />
                {isExporting ? 'Stitching...' : 'Download Story'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate('/story-choice')}
                className="bg-[#FF6B6B] text-white px-8 py-4 rounded-full text-xl font-bold shadow-xl"
                style={{ fontFamily: 'Comic Sans MS, cursive' }}
              >
                Create Again!
              </motion.button>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="size-full bg-white flex flex-col items-center justify-center p-8 overflow-hidden border-[24px] border-[#E63946]">
      {/* Header */}
      <div className="w-full max-w-6xl mb-4 flex justify-between items-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/')}
          className="bg-gray-200 text-gray-700 px-6 py-3 rounded-full font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
        >
          <Home className="w-5 h-5" />
          Home
        </motion.button>

        <h2 className="text-3xl font-bold text-[#FF6B6B]" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
          Story Theatre! 🎬
        </h2>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/gallery')}
          className="bg-yellow-400 text-gray-800 px-6 py-3 rounded-full font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
        >
          <ImageIcon className="w-5 h-5" />
          Gallery
        </motion.button>
      </div>

      {/* Story guide */}
      <div className="mb-4">
        <StoryGuide message={storyGuideMessage} isAnimating={true} />
      </div>

      {/* Theatre Frame */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="relative"
      >
        <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-3xl shadow-2xl">
          {/* Inner gold border */}
          <div
            className="absolute inset-4 border-8 border-[#FFD700] rounded-2xl pointer-events-none"
            style={{ boxShadow: 'inset 0 0 20px rgba(255, 215, 0, 0.3), 0 0 20px rgba(255, 215, 0, 0.2)' }}
          />

          {/* Screen area */}
          <div className="relative bg-black rounded-2xl overflow-hidden shadow-inner" style={{ width: '800px', height: '450px' }}>
            {renderScreenContent()}
          </div>

          {/* Theatre lights */}
          <div className="absolute -top-4 left-1/4 w-6 h-6 rounded-full bg-yellow-300 shadow-lg shadow-yellow-300/50" />
          <div className="absolute -top-4 left-1/2 w-6 h-6 rounded-full bg-yellow-300 shadow-lg shadow-yellow-300/50" />
          <div className="absolute -top-4 left-3/4 w-6 h-6 rounded-full bg-yellow-300 shadow-lg shadow-yellow-300/50" />
        </div>

        {/* Bottom stage */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="absolute -bottom-8 left-0 right-0 h-8 bg-gradient-to-t from-[#654321] to-[#8B4513] rounded-b-2xl shadow-2xl"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FFD700] via-[#FFA500] to-[#FFD700]" />
        </motion.div>
      </motion.div>

      {/* Parental approval overlay */}
      {approvalPending && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-10 max-w-md w-full mx-4 text-center shadow-2xl"
          >
            <div className="text-5xl mb-4">🔒</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
              Parent Check
            </h3>
            <p className="text-gray-600 mb-2 text-sm leading-relaxed">{approvalReason}</p>
            <p className="text-gray-400 text-sm mb-8">A parent or guardian needs to approve this before the story continues.</p>
            <div className="flex gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleApprove}
                className="bg-[#4ECDC4] text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg"
                style={{ fontFamily: 'Comic Sans MS, cursive' }}
              >
                ✓ Approve
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDeny}
                className="bg-gray-200 text-gray-700 px-8 py-4 rounded-full font-bold text-lg shadow-lg"
                style={{ fontFamily: 'Comic Sans MS, cursive' }}
              >
                ✗ Try Again
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
