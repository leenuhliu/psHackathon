import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { StoryGuide } from './StoryGuide';
import { BookOpen, Sparkles, ArrowLeft } from 'lucide-react';
import { useNarration } from '../hooks/useNarration';

export function StoryChoiceScreen() {
  const navigate = useNavigate();
  useNarration("Great! Now, how would you like to create your story?");

  return (
    <div className="size-full bg-white flex flex-col items-center justify-center p-12 overflow-hidden">
      {/* Back button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/setting-selection')}
        className="absolute top-8 left-8 bg-white text-gray-700 px-6 py-3 rounded-full text-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 border-4 border-gray-300 z-10"
        style={{ fontFamily: 'Comic Sans MS, cursive' }}
      >
        <ArrowLeft className="w-6 h-6" />
        Back
      </motion.button>

      {/* Floating decorative sparkles */}
      <motion.div
        className="absolute top-24 left-32"
        animate={{
          y: [0, -15, 0],
          rotate: [0, 10, 0]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Sparkles className="w-10 h-10 text-[#FFD93D]" fill="#FFD93D" />
      </motion.div>

      <motion.div
        className="absolute top-32 right-40"
        animate={{
          y: [0, 15, 0],
          rotate: [0, -10, 0]
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5
        }}
      >
        <Sparkles className="w-8 h-8 text-[#4ECDC4]" fill="#4ECDC4" />
      </motion.div>

      <motion.div
        className="absolute bottom-32 left-48"
        animate={{
          y: [0, -10, 0],
          rotate: [0, 15, 0]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      >
        <Sparkles className="w-9 h-9 text-[#FF6B6B]" fill="#FF6B6B" />
      </motion.div>

      {/* Main content */}
      <div className="flex flex-col items-center gap-12 max-w-4xl">
        {/* Story guide with message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <StoryGuide
            message="Great! Now, how would you like to create your story?"
            isAnimating={true}
          />
        </motion.div>

        {/* Choice buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex gap-12 w-full justify-center"
        >
          {/* Choose A Story Line button */}
          <motion.button
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/storyline-selection')}
            className="bg-[#FF6B6B] text-white px-12 py-12 rounded-3xl shadow-2xl hover:bg-[#FF5252] transition-colors flex flex-col items-center gap-6 min-w-[320px] border-8 border-[#E63946]"
          >
            <motion.div
              animate={{
                rotate: [0, -5, 5, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="bg-white rounded-full p-6 shadow-lg"
            >
              <BookOpen className="w-20 h-20 text-[#FF6B6B]" />
            </motion.div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-4xl font-bold" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                Choose A
              </span>
              <span className="text-4xl font-bold" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                Story Line
              </span>
            </div>
            <span className="text-xl opacity-90" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
              Pick from ready stories!
            </span>
          </motion.button>

          {/* Make My Own button */}
          <motion.button
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/drawing', { state: { flowType: 'make-my-own' } })}
            className="bg-[#4ECDC4] text-white px-12 py-12 rounded-3xl shadow-2xl hover:bg-[#3DBDB3] transition-colors flex flex-col items-center gap-6 min-w-[320px] border-8 border-[#3DBDB3]"
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="bg-white rounded-full p-6 shadow-lg"
            >
              <Sparkles className="w-20 h-20 text-[#4ECDC4]" fill="#4ECDC4" />
            </motion.div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-4xl font-bold" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                Make My Own
              </span>
            </div>
            <span className="text-xl opacity-90" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
              Create your own adventure!
            </span>
          </motion.button>
        </motion.div>

        {/* Helpful hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-2xl text-gray-600 text-center mt-0"
          style={{ fontFamily: 'Comic Sans MS, cursive' }}
        >
          Tap either option to continue! 🎨✨
        </motion.p>
      </div>
    </div>
  );
}