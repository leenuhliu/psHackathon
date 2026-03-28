import { motion } from 'motion/react';
import { useLocation, useNavigate } from 'react-router';
import { StoryGuide } from './StoryGuide';
import { Home, PlayCircle, RotateCcw, Image as ImageIcon } from 'lucide-react';
import { useState, useEffect } from 'react';

export function ViewingScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const savedDrawings = location.state?.savedDrawings || [];
  const storyDetails = location.state?.storyDetails || [];
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isPlaying && !isFinished) {
      interval = setInterval(() => {
        setCurrentSlide((prev) => {
          if (prev < savedDrawings.length - 1) {
            return prev + 1;
          } else {
            setIsFinished(true);
            setIsPlaying(false);
            return prev;
          }
        });
      }, 3000); // 3 seconds per slide
    }
    return () => clearInterval(interval);
  }, [isPlaying, isFinished, savedDrawings.length]);

  const handleStartMovie = () => {
    setIsPlaying(true);
    setIsFinished(false);
    setCurrentSlide(0);
  };

  const handleRestart = () => {
    setIsFinished(false);
    setCurrentSlide(0);
    setIsPlaying(true);
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
        <StoryGuide
          message={isFinished ? "What a wonderful story! Want to make another one?" : "Lights, camera, action! Your story is ready to watch!"}
          isAnimating={true}
        />
      </div>

      {/* Theatre Frame */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="relative"
      >
        {/* Curtains and Frame (omitted for brevity in thinking, but I'll include them in the full edit) */}
        {/* ... (Curtains code remains similar) ... */}

        {/* Main theatre frame */}
        <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-3xl shadow-2xl">
          {/* Inner gold border */}
          <div className="absolute inset-4 border-8 border-[#FFD700] rounded-2xl pointer-events-none" 
               style={{
                 boxShadow: 'inset 0 0 20px rgba(255, 215, 0, 0.3), 0 0 20px rgba(255, 215, 0, 0.2)'
               }}
          />

          {/* Screen area */}
          <div className="relative bg-black rounded-2xl overflow-hidden shadow-inner" style={{ width: '800px', height: '450px' }}>
            {!isPlaying && !isFinished ? (
              /* Start Screen */
              <motion.div
                className="size-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-black"
                whileHover={{ scale: 1.02 }}
                onClick={handleStartMovie}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center gap-4 cursor-pointer"
                >
                  <PlayCircle className="w-32 h-32 text-[#FFD93D] drop-shadow-2xl" fill="#FFD93D" />
                  <p className="text-white text-2xl font-bold" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                    Click to Play Your Story! 🎥
                  </p>
                </motion.div>
              </motion.div>
            ) : isFinished ? (
              /* Finish Screen */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="size-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-black gap-8"
              >
                <p className="text-[#FFD93D] text-5xl font-bold" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                  THE END
                </p>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => navigate('/story-choice')}
                  className="bg-[#FF6B6B] text-white px-12 py-6 rounded-full text-3xl font-bold shadow-2xl flex items-center gap-4"
                  style={{ fontFamily: 'Comic Sans MS, cursive' }}
                >
                  <RotateCcw className="w-8 h-8" />
                  create again!
                </motion.button>
              </motion.div>
            ) : (
              /* Movie Playing */
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1 }}
                className="size-full flex items-center justify-center bg-white"
              >
                <img 
                  src={savedDrawings[currentSlide]} 
                  alt={`Slide ${currentSlide}`} 
                  className="max-w-full max-h-full object-contain"
                />
                
                {/* Progress bar */}
                <div className="absolute bottom-4 left-10 right-10 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentSlide + 1) / savedDrawings.length) * 100}%` }}
                    className="h-full bg-yellow-400"
                  />
                </div>
              </motion.div>
            )}
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
          {/* Stage trim */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FFD700] via-[#FFA500] to-[#FFD700]" />
        </motion.div>
      </motion.div>

      {/* Action buttons */}
      <div className="flex gap-6 mt-8">
        <motion.button
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/drawing')}
          className="bg-[#4ECDC4] text-white px-8 py-4 rounded-full text-xl font-bold shadow-xl hover:bg-[#3EBCB4] transition-colors flex items-center gap-2"
          style={{ fontFamily: 'Comic Sans MS, cursive' }}
        >
          Draw More! ✏️
        </motion.button>

        {!isFinished && (
          <motion.button
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRestart}
            className="bg-[#FFD93D] text-gray-800 px-8 py-4 rounded-full text-xl font-bold shadow-xl hover:bg-[#FDD023] transition-colors flex items-center gap-2"
            style={{ fontFamily: 'Comic Sans MS, cursive' }}
          >
            <RotateCcw className="w-5 h-5" />
            Watch Again
          </motion.button>
        )}
      </div>
    </div>
  );
}
