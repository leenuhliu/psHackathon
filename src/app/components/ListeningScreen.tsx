import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { StoryGuide } from './StoryGuide';
import { Mic, Type, Check, ChevronRight, ArrowLeft } from 'lucide-react';
import { useState } from 'react';

const storyPrompts = [
  "What is the setting of this story?",
  "Who is the main character?",
  "What adventure will they go on?",
  "How does the story end?"
];

export function ListeningScreen() {
  const navigate = useNavigate();
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [inputMode, setInputMode] = useState<'voice' | 'text' | null>(null);
  const [userInput, setUserInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [storyDetails, setStoryDetails] = useState<string[]>([]);

  const currentPrompt = storyPrompts[currentPromptIndex];

  const handleVoiceInput = () => {
    setInputMode('voice');
    setIsListening(true);
    
    // Mock voice input - in a real app, this would use Web Speech API
    setTimeout(() => {
      const mockInputs = [
        "In a magical forest with tall trees and colorful flowers",
        "A brave little bunny named Fluffy",
        "They will find a hidden treasure",
        "Everyone celebrates with a big party"
      ];
      setUserInput(mockInputs[currentPromptIndex]);
      setIsListening(false);
      setShowConfirmation(true);
    }, 2000);
  };

  const handleTextSubmit = () => {
    if (userInput.trim()) {
      setShowConfirmation(true);
    }
  };

  const handleConfirm = () => {
    const newStoryDetails = [...storyDetails, userInput];
    setStoryDetails(newStoryDetails);
    
    if (currentPromptIndex < storyPrompts.length - 1) {
      // Move to next prompt
      setCurrentPromptIndex(currentPromptIndex + 1);
      setUserInput('');
      setInputMode(null);
      setShowConfirmation(false);
    } else {
      // All prompts completed, go to drawing
      navigate('/drawing', { state: { storyDetails: newStoryDetails } });
    }
  };

  const handleTryAgain = () => {
    setUserInput('');
    setShowConfirmation(false);
    setInputMode(null);
  };

  return (
    <div className="size-full bg-white flex flex-col items-center justify-between p-8 overflow-hidden">
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

      {/* Progress indicator */}
      <div className="w-full max-w-4xl">
        <div className="flex gap-2 justify-center">
          {storyPrompts.map((_, index) => (
            <motion.div
              key={index}
              className={`h-3 rounded-full ${
                index <= currentPromptIndex ? 'bg-[#FF6B6B]' : 'bg-gray-300'
              }`}
              initial={{ width: 0 }}
              animate={{ width: index <= currentPromptIndex ? 80 : 60 }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>
        <p className="text-center text-gray-700 mt-2 text-lg">
          Question {currentPromptIndex + 1} of {storyPrompts.length}
        </p>
      </div>

      {/* Main content */}
      <div className="flex flex-col items-center gap-8 max-w-3xl">
        {/* Story guide with current prompt */}
        <StoryGuide
          message={currentPrompt}
          isAnimating={true}
        />

        {/* Input section */}
        {!showConfirmation ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            {inputMode === null ? (
              <div className="flex flex-col gap-6 items-center">
                <p className="text-2xl text-white text-center mb-4">
                  How would you like to answer?
                </p>
                <div className="flex gap-6">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleVoiceInput}
                    className="bg-[#4ECDC4] text-white px-10 py-8 rounded-3xl text-2xl font-bold shadow-xl hover:bg-[#3DBDB3] transition-colors flex flex-col items-center gap-3 min-w-[200px]"
                  >
                    <Mic className="w-16 h-16" />
                    Speak
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setInputMode('text')}
                    className="bg-[#FFD93D] text-white px-10 py-8 rounded-3xl text-2xl font-bold shadow-xl hover:bg-[#FFC91D] transition-colors flex flex-col items-center gap-3 min-w-[200px]"
                  >
                    <Type className="w-16 h-16" />
                    Type
                  </motion.button>
                </div>
              </div>
            ) : inputMode === 'voice' ? (
              <div className="flex flex-col items-center gap-6">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                  }}
                  className="bg-[#FF6B6B] rounded-full p-8 shadow-2xl"
                >
                  <Mic className="w-20 h-20 text-white" />
                </motion.div>
                <p className="text-3xl text-white font-bold">
                  {isListening ? "Listening..." : "Processing..."}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-6 items-center w-full">
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full max-w-2xl p-6 rounded-3xl text-2xl border-4 border-[#4ECDC4] focus:outline-none focus:border-[#FF6B6B] min-h-[200px] resize-none"
                  style={{ fontFamily: 'Comic Sans MS, cursive' }}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleTextSubmit}
                  disabled={!userInput.trim()}
                  className="bg-[#4ECDC4] text-white px-12 py-6 rounded-full text-2xl font-bold shadow-xl hover:bg-[#3DBDB3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-3"
                >
                  Next <ChevronRight className="w-8 h-8" />
                </motion.button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col gap-6 items-center"
          >
            <div className="bg-white rounded-3xl p-8 shadow-xl max-w-2xl">
              <p className="text-2xl text-gray-700 mb-4 text-center">
                You said:
              </p>
              <p className="text-3xl text-[#4ECDC4] font-bold text-center">
                "{userInput}"
              </p>
            </div>

            <p className="text-2xl text-white text-center">
              Is this correct?
            </p>

            <div className="flex gap-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleTryAgain}
                className="bg-[#FFAAA5] text-white px-12 py-6 rounded-full text-2xl font-bold shadow-xl hover:bg-[#FF9A95] transition-colors"
              >
                Try Again
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleConfirm}
                className="bg-[#A8E6CF] text-white px-12 py-6 rounded-full text-2xl font-bold shadow-xl hover:bg-[#98D6BF] transition-colors flex items-center gap-3"
              >
                <Check className="w-8 h-8" />
                Yes! Continue
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>

      <div className="h-8" /> {/* Spacer */}
    </div>
  );
}