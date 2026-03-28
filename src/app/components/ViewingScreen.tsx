import { motion } from 'motion/react';
import { useLocation, useNavigate } from 'react-router';
import { StoryGuide } from './StoryGuide';
import { Home, PlayCircle, RotateCcw, Image as ImageIcon, ChevronRight } from 'lucide-react';
import { useState, useRef, useCallback } from 'react';

const TOTAL_SCENES = 3;

type ScreenState = 'ready' | 'challenge' | 'generating' | 'playing' | 'replay' | 'done';

interface Challenge {
  challenge_text: string;
  challenge_short: string;
  challenge_image_url?: string;
}

export function ViewingScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const storyDetails: string[] = location.state?.storyDetails || [];
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

  const storyName = storyDetails[0] || 'My Adventure';

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
  }, [storyName]);

  const submitSolution = async () => {
    if (!solution.trim()) return;
    setError(null);
    setProgressLabel('Starting your scene...');
    setScreenState('generating');

    try {
      const resp = await fetch('/api/generate-scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          show_id: showIdRef.current,
          scene_number: currentScene,
          solution: solution.trim(),
          challenge_text: challenge?.challenge_text,
          story_name: storyName,
          parent_approved: true,
        }),
      });
      if (!resp.ok) throw new Error('Failed to start scene generation');
      const { job_id } = await resp.json();

      // Skip voice moment immediately so the pipeline isn't blocked
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
          setVideoUrls(prev => [...prev, job.result.video_url]);
          setAudioUrls(prev => [...prev, job.result.audio_url]);
          setEpisodeTitles(prev => [...prev, job.result.episode_title || `Scene ${currentScene}`]);
          if (job.result.closing_line) setClosingLine(job.result.closing_line);
          setScreenState('playing');
          break;
        } else if (job.status === 'error') {
          throw new Error(job.error || 'Scene generation failed');
        } else if (job.status === 'needs_approval') {
          throw new Error('That idea needs a parent to approve it. Try a different one!');
        }
      }
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Try again!');
      setScreenState('challenge');
    }
  };

  const handleVideoEnded = () => {
    if (currentScene < TOTAL_SCENES) {
      const next = currentScene + 1;
      setCurrentScene(next);
      setSolution('');
      fetchChallenge(next);
    } else {
      setScreenState('done');
    }
  };

  const handleReplayEnded = () => {
    if (replaySlide < videoUrls.length - 1) {
      setReplaySlide(prev => prev + 1);
    } else {
      setScreenState('done');
    }
  };

  const storyGuideMessage = {
    ready: "Lights, camera, action! Click to start your adventure!",
    challenge: "Here's your challenge! What will you do?",
    generating: "The magic is happening... your scene is being made!",
    playing: "Watch your story come to life!",
    replay: "Here's your story!",
    done: "What a wonderful story! Want to make another one?",
  }[screenState];

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
          <div className="size-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 to-black gap-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-20 h-20 border-4 border-[#FFD93D] border-t-transparent rounded-full"
            />
            <div className="text-center px-8">
              <p className="text-[#FFD93D] text-2xl font-bold mb-2" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                Creating Scene {currentScene}...
              </p>
              <p className="text-gray-300 text-base" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                {progressLabel || 'Working on your story magic...'}
              </p>
              <p className="text-gray-500 text-sm mt-2">This takes about a minute — hang tight!</p>
            </div>
            <div className="flex gap-3 mt-2">
              {Array.from({ length: TOTAL_SCENES }).map((_, i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full transition-colors ${
                    i < currentScene - 1 ? 'bg-green-400' : i === currentScene - 1 ? 'bg-[#FFD93D]' : 'bg-gray-600'
                  }`}
                />
              ))}
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
            className="size-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-black gap-6"
          >
            <p className="text-[#FFD93D] text-5xl font-bold" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
              THE END
            </p>
            {closingLine && (
              <p className="text-white text-xl text-center px-8" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                {closingLine}
              </p>
            )}
            {videoUrls.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => { setReplaySlide(0); setScreenState('replay'); }}
                className="bg-[#4ECDC4] text-white px-10 py-4 rounded-full text-xl font-bold shadow-xl flex items-center gap-3"
                style={{ fontFamily: 'Comic Sans MS, cursive' }}
              >
                <RotateCcw className="w-6 h-6" />
                Watch Again
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/story-choice')}
              className="bg-[#FF6B6B] text-white px-10 py-4 rounded-full text-xl font-bold shadow-xl flex items-center gap-3"
              style={{ fontFamily: 'Comic Sans MS, cursive' }}
            >
              Create Again!
            </motion.button>
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
    </div>
  );
}
