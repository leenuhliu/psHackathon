import { motion } from 'motion/react';
import { useLocation, useNavigate } from 'react-router';
import { StoryGuide } from './StoryGuide';
import { Home, PlayCircle } from 'lucide-react';
import { useState } from 'react';

const MOODS = [
  { id: 'happy',     label: '🎵 Happy',     description: 'Cheerful and playful',   color: 'bg-green-500'  },
  { id: 'calm',      label: '🎻 Calm',      description: 'Peaceful and gentle',    color: 'bg-blue-400'   },
  { id: 'adventure', label: '🎸 Adventure', description: 'Exciting and energetic', color: 'bg-orange-500' },
];

const DURATIONS = [
  { id: '30s', label: '30 seconds' },
  { id: '1m',  label: '1 minute'  },
  { id: '2m',  label: '2 minutes' },
];

export function SettingsScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const savedDrawings = location.state?.savedDrawings || [];
  const storyDetails = location.state?.storyDetails || [];
  const showId = location.state?.showId;

  const [selectedMood, setSelectedMood] = useState('happy');
  const [selectedDuration, setSelectedDuration] = useState('30s');

  return (
    <div className="size-full bg-white flex flex-col items-center justify-center p-4 overflow-hidden">
      <div className="w-full max-w-5xl mb-4 flex justify-between items-center px-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/')}
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-full font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 text-sm"
          style={{ fontFamily: 'Comic Sans MS, cursive' }}
        >
          <Home className="w-4 h-4" />
          Home
        </motion.button>
        <StoryGuide message="Choose your video settings!" isAnimating={true} />
        <div className="w-24" />
      </div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-3xl shadow-2xl p-8 max-w-2xl w-full"
      >
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-800" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
          Video Settings
        </h2>

        <div className="space-y-6">
          {savedDrawings.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-lg">
              <h3 className="text-lg font-bold text-gray-700 mb-3" style={{ fontFamily: 'Comic Sans MS, cursive' }}>Your Drawings:</h3>
              <div className="flex gap-3 flex-wrap justify-center">
                {savedDrawings.map((drawing: string, index: number) => (
                  <div key={index} className="relative">
                    <img src={drawing} alt={`Drawing ${index + 1}`} className="w-24 h-24 object-contain bg-gray-100 rounded-lg border-2 border-gray-300" />
                    <div className="absolute -top-2 -right-2 bg-yellow-400 text-gray-800 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">{index + 1}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl p-4 shadow-lg">
            <h3 className="text-lg font-bold text-gray-700 mb-3" style={{ fontFamily: 'Comic Sans MS, cursive' }}>Video Duration:</h3>
            <div className="flex gap-3 justify-center">
              {DURATIONS.map(d => (
                <motion.button
                  key={d.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedDuration(d.id)}
                  className={`px-6 py-3 rounded-xl font-bold shadow-md transition-all border-4 ${selectedDuration === d.id ? 'bg-blue-500 text-white border-transparent scale-105' : 'bg-gray-200 text-gray-700 border-transparent'}`}
                  style={{ fontFamily: 'Comic Sans MS, cursive' }}
                >
                  {d.label}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-lg">
            <h3 className="text-lg font-bold text-gray-700 mb-4" style={{ fontFamily: 'Comic Sans MS, cursive' }}>Background Music:</h3>
            <div className="flex gap-3 justify-center">
              {MOODS.map(mood => (
                <motion.button
                  key={mood.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedMood(mood.id)}
                  className={`flex flex-col items-center gap-1 px-6 py-4 rounded-2xl font-bold shadow-md transition-all border-4 ${selectedMood === mood.id ? `${mood.color} text-white border-transparent scale-105` : 'bg-gray-100 text-gray-700 border-gray-200'}`}
                  style={{ fontFamily: 'Comic Sans MS, cursive' }}
                >
                  <span className="text-2xl">{mood.label}</span>
                  <span className="text-xs font-normal">{mood.description}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/viewing', { state: { savedDrawings, storyDetails, showId, musicMood: selectedMood, videoDuration: selectedDuration } })}
          className="w-full mt-8 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-10 py-4 rounded-full text-xl font-bold shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2"
          style={{ fontFamily: 'Comic Sans MS, cursive' }}
        >
          <PlayCircle className="w-6 h-6" />
          Create My Video! 🎬
        </motion.button>
      </motion.div>
    </div>
  );
}
