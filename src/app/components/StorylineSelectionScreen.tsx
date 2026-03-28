import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { StoryGuide } from './StoryGuide';
import { ArrowLeft } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useNarration } from '../hooks/useNarration';

interface StoryTemplate {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  color: string;
  emoji: string;
  storyDetails: string[];
}

const storyTemplates: StoryTemplate[] = [
  {
    id: 'space',
    title: 'Space Adventure',
    description: 'Blast off to the stars!',
    imageUrl: 'https://images.unsplash.com/photo-1602212096437-d0af1ce0553e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcGFjZSUyMHJvY2tldCUyMHN0YXJzJTIwY2hpbGRyZW58ZW58MXx8fHwxNzc0NjgwMDQzfDA&ixlib=rb-4.1.0&q=80&w=1080',
    color: '#6C5CE7',
    emoji: '🚀',
    storyDetails: [
      'A colorful spaceship floating among twinkling stars',
      'Captain Stella, a brave astronaut with a shiny helmet',
      'They discover a friendly alien who needs help finding their home planet',
      'Everyone celebrates with a cosmic party under the stars'
    ]
  },
  {
    id: 'underwater',
    title: 'Underwater Quest',
    description: 'Dive into the deep blue!',
    imageUrl: 'https://images.unsplash.com/photo-1732312645795-c25b0f4f5759?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bmRlcndhdGVyJTIwb2NlYW4lMjBmaXNoJTIwY2hpbGRyZW58ZW58MXx8fHwxNzc0NjgwMDQ0fDA&ixlib=rb-4.1.0&q=80&w=1080',
    color: '#00B8D4',
    emoji: '🐠',
    storyDetails: [
      'A magical coral reef with colorful fish swimming everywhere',
      'Marina, a curious mermaid with a sparkling tail',
      'They search for the lost pearl of friendship',
      'All the sea creatures dance together at the underwater celebration'
    ]
  },
  {
    id: 'forest',
    title: 'Magical Forest',
    description: 'Explore the enchanted woods!',
    imageUrl: 'https://images.unsplash.com/photo-1733156573052-c5ccb3dda85e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWdpY2FsJTIwZm9yZXN0JTIwdHJlZXMlMjBmYWlyeXxlbnwxfHx8fDE3NzQ2ODAwNDR8MA&ixlib=rb-4.1.0&q=80&w=1080',
    color: '#4CAF50',
    emoji: '🌳',
    storyDetails: [
      'A mystical forest filled with glowing mushrooms and tall trees',
      'Felix, a friendly fox with a magic acorn necklace',
      'They help the forest animals prepare for the Great Harvest Festival',
      'Everyone shares a feast under the moonlight with fireflies twinkling'
    ]
  },
  {
    id: 'dinosaur',
    title: 'Dinosaur Discovery',
    description: 'Journey to prehistoric times!',
    imageUrl: 'https://images.unsplash.com/photo-1761549148556-a2cf3307f8b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaW5vc2F1ciUyMHByZWhpc3RvcmljJTIwanVuZ2xlfGVufDF8fHx8MTc3NDY4MDA0NXww&ixlib=rb-4.1.0&q=80&w=1080',
    color: '#8BC34A',
    emoji: '🦕',
    storyDetails: [
      'A prehistoric jungle with giant ferns and active volcanoes',
      'Dino, a small but brave triceratops',
      'They help reunite a baby pterodactyl with its family',
      'All the dinosaurs celebrate with a roaring good time'
    ]
  },
  {
    id: 'castle',
    title: 'Royal Castle',
    description: 'Rule a magical kingdom!',
    imageUrl: 'https://images.unsplash.com/photo-1595714042071-e5b0eb877980?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcmluY2VzcyUyMGNhc3RsZSUyMGZhbnRhc3l8ZW58MXx8fHwxNzc0NjgwMDQ2fDA&ixlib=rb-4.1.0&q=80&w=1080',
    color: '#E91E63',
    emoji: '👑',
    storyDetails: [
      'A grand castle with tall towers and colorful flags',
      'Prince Riley, who loves to paint and make friends',
      'They organize a grand art festival for the whole kingdom',
      'Everyone admires the beautiful artwork and crowns Riley the Royal Artist'
    ]
  },
  {
    id: 'superhero',
    title: 'Superhero City',
    description: 'Save the day!',
    imageUrl: 'https://images.unsplash.com/photo-1598472237441-b5422956195e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdXBlcmhlcm8lMjBjaXR5JTIwYWR2ZW50dXJlfGVufDF8fHx8MTc3NDY4MDA0NXww&ixlib=rb-4.1.0&q=80&w=1080',
    color: '#FF5722',
    emoji: '⚡',
    storyDetails: [
      'A bustling city with tall buildings and busy streets',
      'Super Sam, a hero with the power of kindness',
      'They help rescue a kitten stuck in a tree and bring joy to everyone',
      'The city throws a parade to celebrate their everyday heroism'
    ]
  }
];

export function StorylineSelectionScreen() {
  const navigate = useNavigate();
  useNarration("Pick a story adventure! Tap on any one you like!");

  const handleStorySelect = (story: StoryTemplate) => {
    // Navigate to drawing with predefined story details
    navigate('/drawing', { state: { storyDetails: story.storyDetails } });
  };

  return (
    <div className="size-full bg-white flex flex-col p-8 overflow-hidden">
      {/* Back button */}
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

      {/* Header with Simon */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-6 mb-8"
      >
        <StoryGuide
          message="Pick a story adventure! Tap on any one you like!"
          isAnimating={true}
        />
      </motion.div>

      {/* Story cards grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex-1 overflow-y-auto px-4"
      >
        <div className="grid grid-cols-3 gap-6 max-w-6xl mx-auto pb-8">
          {storyTemplates.map((story, index) => (
            <motion.button
              key={story.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ scale: 1.05, y: -8 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleStorySelect(story)}
              className="relative rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all border-8 bg-white"
              style={{ borderColor: story.color }}
            >
              {/* Story image */}
              <div className="relative h-48 overflow-hidden">
                <ImageWithFallback
                  src={story.imageUrl}
                  alt={story.title}
                  className="w-full h-full object-cover"
                />
                {/* Overlay gradient */}
                <div 
                  className="absolute inset-0 opacity-20"
                  style={{ background: `linear-gradient(to bottom, transparent, ${story.color})` }}
                />
                {/* Emoji badge */}
                <div 
                  className="absolute top-3 right-3 w-16 h-16 rounded-full flex items-center justify-center text-4xl shadow-lg"
                  style={{ backgroundColor: story.color }}
                >
                  {story.emoji}
                </div>
              </div>

              {/* Story details */}
              <div className="p-6 flex flex-col items-center gap-2">
                <h3 
                  className="text-2xl font-bold text-center"
                  style={{ 
                    fontFamily: 'Comic Sans MS, cursive',
                    color: story.color
                  }}
                >
                  {story.title}
                </h3>
                <p 
                  className="text-lg text-gray-600 text-center"
                  style={{ fontFamily: 'Comic Sans MS, cursive' }}
                >
                  {story.description}
                </p>
              </div>

              {/* Animated hover effect */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
              >
                <div 
                  className="absolute inset-0 opacity-10"
                  style={{ backgroundColor: story.color }}
                />
              </motion.div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
