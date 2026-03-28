import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { StoryGuide } from './StoryGuide';
import { Sparkles, Image as ImageIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

export function WelcomeScreen() {
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Show content after initial animation
    const timer = setTimeout(() => setShowContent(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="size-full bg-white flex flex-col items-center justify-center overflow-hidden border-[12px] border-[#E63946] p-[50px]">
      {/* Floating decorative elements */}
      {/* ... (existing decorative elements) ... */}
      
      {/* Top Gallery Button */}
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/gallery')}
        className="absolute top-8 right-8 bg-yellow-400 text-gray-800 px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 z-10"
        style={{ fontFamily: 'Comic Sans MS, cursive' }}
      >
        <ImageIcon className="w-5 h-5" />
        My Sketches
      </motion.button>

      {/* Main content */}
      <div className="flex flex-col items-center gap-12 max-w-2xl">
        {/* Logo and title - Etch-A-Sketch style */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.5 }}
          className="flex flex-col items-center gap-6"
        >
          {/* Logo */}

          {/* App name - Etch-A-Sketch inspired with red background and yellow text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative bg-[#E63946] px-12 py-6 rounded-3xl shadow-2xl border-8 border-gray-800"
          >
            <h1
              className="text-7xl font-bold text-[#FFD93D] text-center relative"
              style={{
                textShadow: '4px 4px 0px rgba(0,0,0,0.3), -2px -2px 0px rgba(255,255,255,0.1)',
                fontFamily: "'Petite Formal Script', cursive",
                letterSpacing: '0.05em',
                transform: 'rotate(-2deg)'
              }}
            >
              Tell-A-Sketch
              {/* Decorative stars */}
              <span className="absolute -top-4 -left-4 text-4xl">✨</span>
              <span className="absolute -bottom-4 -right-4 text-4xl">✨</span>
            </h1>
            {/* Etch-A-Sketch knob decorations */}
            <div className="absolute -bottom-4 left-8 w-8 h-8 rounded-full bg-gray-800 border-4 border-gray-600" />
            <div className="absolute -bottom-4 right-8 w-8 h-8 rounded-full bg-gray-800 border-4 border-gray-600" />
          </motion.div>
        </motion.div>

        {/* Story guide with welcome message */}
        {showContent && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <StoryGuide
              message="Hi there! I'm Simon the Story Star! Let's create an amazing story together!"
              isAnimating={true}
            />
          </motion.div>
        )}

        {/* Start button */}
        {showContent && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/story-choice')}
            className="bg-[#FF6B6B] text-white px-16 py-6 rounded-full text-3xl font-bold shadow-2xl hover:bg-[#FF5252] transition-colors"
            style={{ fontFamily: 'Comic Sans MS, cursive' }}
          >
            Let's Start! 🎨
          </motion.button>
        )}
      </div>
    </div>
  );
}