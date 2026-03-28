import { motion } from 'motion/react';

interface StoryGuideProps {
  message?: string;
  isAnimating?: boolean;
  hideMessage?: boolean;
}

export function StoryGuide({ message, isAnimating = false, hideMessage = false }: StoryGuideProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Cute rounded jellycat-style star character */}
      <motion.div
        className="relative"
        animate={isAnimating ? {
          scale: [1, 1.05, 1],
          rotate: [0, 2, -2, 0],
        } : {}}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <svg width="120" height="120" viewBox="0 0 200 200" className="drop-shadow-xl">
          {/* Rounded star body - using curves for softer points */}
          <motion.path className="rounded-[50px]"
            d="M 100 30 
               Q 107 55, 115 70 
               Q 145 73, 175 80 
               Q 150 105, 140 120 
               Q 142 145, 150 175 
               Q 120 157, 100 147 
               Q 80 157, 50 175 
               Q 58 145, 60 120 
               Q 50 105, 25 80 
               Q 55 73, 85 70 
               Q 93 55, 100 30 Z"
            fill="#FFD93D"
            stroke="#000000"
            strokeWidth="5"
            strokeLinejoin="round"
            strokeLinecap="round"
            initial={{ scale: 0 }}
            animate={{ scale: 0.7 }}
            transition={{ duration: 0.5, type: "spring" }}
          />
          
          {/* Adorable jellycat-style face */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {/* Big sparkly eyes - larger and more expressive */}
            <g>
              {/* Left eye */}
              <circle cx="85" cy="90" r="8" fill="#000000" />
              <circle cx="87" cy="88" r="3" fill="#FFFFFF" />
              
              {/* Right eye */}
              <circle cx="115" cy="90" r="8" fill="#000000" />
              <circle cx="117" cy="88" r="3" fill="#FFFFFF" />
            </g>
            
            {/* Rosy cheeks - more prominent */}
            <ellipse cx="70" cy="105" rx="12" ry="9" fill="#FFB6B9" opacity="0.6" />
            <ellipse cx="130" cy="105" rx="12" ry="9" fill="#FFB6B9" opacity="0.6" />
            
            {/* Sweet curved smile - bigger and more expressive */}
            <path
              d="M 80 110 Q 100 125 120 110"
              stroke="#000000"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
            
            {/* Tiny sparkle on star for extra cuteness */}
            <motion.g
              animate={{
                opacity: [1, 0.3, 1],
                scale: [1, 0.8, 1]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <path
                d="M 140 60 L 142 65 L 147 67 L 142 69 L 140 74 L 138 69 L 133 67 L 138 65 Z"
                fill="#FFFFFF"
                stroke="#FFD93D"
                strokeWidth="1"
              />
            </motion.g>
          </motion.g>
        </svg>
      </motion.div>
      
      {/* Speech bubble */}
      {!hideMessage && message && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl px-8 py-4 shadow-lg relative max-w-md text-center"
        >
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-r-[12px] border-b-[12px] border-l-transparent border-r-transparent border-b-white" />
          <p className="text-xl text-gray-700">{message}</p>
        </motion.div>
      )}
    </div>
  );
}