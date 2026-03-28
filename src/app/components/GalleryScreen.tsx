import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { Home, Trash2, Play, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';

interface SavedStory {
  id: string;
  date: string;
  drawings: string[];
  title: string;
}

export function GalleryScreen() {
  const navigate = useNavigate();
  const [stories, setStories] = useState<SavedStory[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('tell-a-sketch-stories');
    if (saved) {
      setStories(JSON.parse(saved));
    }
  }, []);

  const handleDelete = (id: string) => {
    const newStories = stories.filter(s => s.id !== id);
    setStories(newStories);
    localStorage.setItem('tell-a-sketch-stories', JSON.stringify(newStories));
  };

  const handleContinue = (story: SavedStory) => {
    // Continue from this story - for now just view it
    navigate('/viewing', { state: { savedDrawings: story.drawings } });
  };

  return (
    <div className="size-full bg-white flex flex-col items-center p-8 overflow-hidden border-[24px] border-[#E63946]">
      {/* Header */}
      <div className="w-full max-w-6xl mb-8 flex justify-between items-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/')}
          className="bg-gray-200 text-gray-700 px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2"
        >
          <Home className="w-5 h-5" />
          Home
        </motion.button>
        
        <h2 className="text-4xl font-bold text-[#FF6B6B] flex-1 text-center" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
          My Sketch Gallery 🎨
        </h2>
        
        
      </div>

      {stories.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <div className="w-64 h-64 bg-gray-100 rounded-3xl flex items-center justify-center text-gray-400">
            <Plus className="w-32 h-32 opacity-20" />
          </div>
          <p className="text-2xl text-gray-500 font-bold" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
            No sketches yet. Let's make one!
          </p>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/story-choice')}
            className="bg-[#FF6B6B] text-white px-10 py-5 rounded-full text-2xl font-bold shadow-xl"
            style={{ fontFamily: 'Comic Sans MS, cursive' }}
          >
            Start Drawing!
          </motion.button>
        </div>
      ) : (
        <div className="flex-1 w-full max-w-6xl overflow-y-auto pr-4 custom-scrollbar">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 pb-8">
            {stories.map((story) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white border-8 border-yellow-400 rounded-3xl shadow-xl overflow-hidden flex flex-col"
              >
                {/* Preview image (first drawing) */}
                <div className="aspect-[4/3] bg-gray-100 relative group cursor-pointer" onClick={() => handleContinue(story)}>
                  <img src={story.drawings[0]} alt="Sketch" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-16 h-16 text-white" fill="white" />
                  </div>
                </div>
                
                <div className="p-4 flex flex-col gap-2">
                  <h3 className="text-xl font-bold text-gray-800" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                    {story.title || "My Adventure"}
                  </h3>
                  <p className="text-sm text-gray-500">{new Date(story.date).toLocaleDateString()}</p>
                  
                  <div className="flex justify-between items-center mt-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleContinue(story)}
                      className="bg-[#4ECDC4] text-white px-4 py-2 rounded-full font-bold flex items-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      View
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05, color: '#FF0000' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDelete(story.id)}
                      className="p-2 text-gray-400 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 12px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #FFD93D;
          border-radius: 10px;
          border: 3px solid #f1f1f1;
        }
      `}</style>
    </div>
  );
}
