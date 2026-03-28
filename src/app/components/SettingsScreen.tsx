import { motion } from 'motion/react';
import { useLocation, useNavigate } from 'react-router';
import { StoryGuide } from './StoryGuide';
import { Home, PlayCircle } from 'lucide-react';
import { useState } from 'react';

export function SettingsScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const savedDrawings = location.state?.savedDrawings || [];
  const storyDetails = location.state?.storyDetails || [];

  return (
    <div className="size-full bg-white flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Header with Home button and Simon */}
      <div className="w-full max-w-5xl mb-4 flex justify-between items-center px-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/')}
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-full font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 text-sm"
        >
          <Home className="w-4 h-4" />
          Home
        </motion.button>
        
        <StoryGuide
          message="Choose your video settings!"
          isAnimating={true}
        />
        
        <div className="w-24" /> {/* Spacer for centering */}
      </div>

      {/* Settings panel */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-3xl shadow-2xl p-8 max-w-2xl w-full"
      >
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">
          Video Settings
        </h2>

        <div className="space-y-6">
          {/* Preview of drawings */}
          <div className="bg-white rounded-2xl p-4 shadow-lg">
            <h3 className="text-lg font-bold text-gray-700 mb-3">Your Drawings:</h3>
            <div className="flex gap-3 flex-wrap justify-center">
              {savedDrawings.map((drawing: string, index: number) => (
                <div key={index} className="relative">
                  <img
                    src={drawing}
                    alt={`Drawing ${index + 1}`}
                    className="w-24 h-24 object-contain bg-gray-100 rounded-lg border-2 border-gray-300"
                  />
                  <div className="absolute -top-2 -right-2 bg-yellow-400 text-gray-800 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Video duration setting */}
          <div className="bg-white rounded-2xl p-4 shadow-lg">
            <h3 className="text-lg font-bold text-gray-700 mb-3">Video Duration:</h3>
            <div className="flex gap-3 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-blue-500 text-white px-6 py-3 rounded-xl font-bold shadow-md"
              >
                30 seconds
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold shadow-md"
              >
                1 minute
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold shadow-md"
              >
                2 minutes
              </motion.button>
            </div>
          </div>

          {/* Music setting */}
          <div className="bg-white rounded-2xl p-4 shadow-lg">
            <h3 className="text-lg font-bold text-gray-700 mb-3">Background Music:</h3>
            <div className="flex gap-3 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-green-500 text-white px-6 py-3 rounded-xl font-bold shadow-md"
              >
                🎵 Happy
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold shadow-md"
              >
                🎻 Calm
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold shadow-md"
              >
                🎸 Adventure
              </motion.button>
            </div>
          </div>
        </div>

        {/* Create video button */}
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/viewing', { state: { savedDrawings, storyDetails } })}
          className="w-full mt-8 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-10 py-4 rounded-full text-xl font-bold shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2"
        >
          <PlayCircle className="w-6 h-6" />
          Create My Video! 🎬
        </motion.button>
      </motion.div>
    </div>
  );
}
