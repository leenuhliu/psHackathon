import { motion } from 'motion/react';
import { useLocation, useNavigate } from 'react-router';
import { StoryGuide } from './StoryGuide';
import { Home, Trash2, Eraser as EraserIcon, Undo as UndoIcon } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

const colors = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#FDE047', // Yellow
  '#22C55E', // Green
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#8B4513', // Brown
  '#1F2937', // Dark gray (almost black)
  '#FFFFFF', // White
];

export function DrawingScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const storyDetails = location.state?.storyDetails || [];
  const charNameFromState: string = location.state?.charName || storyDetails[1] || '';
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState(colors[0]);
  const [lineWidth, setLineWidth] = useState(5);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [currentStage, setCurrentStage] = useState(0); // 0 = char1, 1 = char2, 2 = setting
  const [savedDrawings, setSavedDrawings] = useState<string[]>([]);
  const [isShaking, setIsShaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const showIdRef = useRef<string>(crypto.randomUUID());

  // Define the drawing stages
  const stages = [
    { label: 'Character 1', instruction: 'Draw your Character' },
    { label: 'Character 2', instruction: 'Draw your Character' },
    { label: 'Setting', instruction: 'Draw your Setting' }
  ];

  const currentStageInfo = stages[currentStage];
  const isLastStage = currentStage >= stages.length - 1;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      if (ctx) {
        // Match the aspect ratio to the new container size precisely
        canvas.width = 752;
        canvas.height = 384;
        
        // Set white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Set drawing properties for smooth lines
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        setContext(ctx);
        
        // Save initial state
        setHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)]);
      }
    }
  }, [currentStage]);

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!context || isShaking) return;
    
    e.preventDefault();
    setIsDrawing(true);
    const { x, y } = getCanvasCoordinates(e);
    
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x, y);
    context.strokeStyle = currentColor;
    context.lineWidth = lineWidth;
    context.stroke();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context || isShaking) return;
    
    e.preventDefault();
    const { x, y } = getCanvasCoordinates(e);
    
    context.strokeStyle = currentColor;
    context.lineWidth = lineWidth;
    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing && context && canvasRef.current && !isShaking) {
      setIsDrawing(false);
      context.closePath();
      
      // Save to history
      const imageData = context.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
      setHistory([...history, imageData]);
    }
  };

  const handleUndo = () => {
    if (history.length > 1 && context && canvasRef.current && !isShaking) {
      const newHistory = history.slice(0, -1);
      setHistory(newHistory);
      context.putImageData(newHistory[newHistory.length - 1], 0, 0);
    }
  };

  const resetCanvas = () => {
    if (context && canvasRef.current) {
      context.fillStyle = '#FFFFFF';
      context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setHistory([context.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)]);
    }
  };

  const handleClear = () => {
    if (!context || !canvasRef.current || isShaking) return;
    setIsShaking(true);
    setIsDrawing(false);
    
    const canvas = canvasRef.current;
    const ctx = context;
    let frame = 0;
    const maxFrames = 45; // Approximately 0.75 seconds

    const animateSand = () => {
      // End animation after max frames or if it's done naturally
      if (frame > maxFrames) {
        resetCanvas();
        setIsShaking(false);
        return;
      }

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      const newImgData = ctx.createImageData(canvas.width, canvas.height);
      const newData = newImgData.data;

      // Pre-fill the new image data with pure white
      for (let i = 0; i < newData.length; i += 4) {
        newData[i] = 255;     // R
        newData[i + 1] = 255; // G
        newData[i + 2] = 255; // B
        newData[i + 3] = 255; // A
      }

      let hasSand = false;

      // Scan from bottom to top to calculate falling pixels
      for (let y = canvas.height - 1; y >= 0; y--) {
        for (let x = 0; x < canvas.width; x++) {
          const idx = (y * canvas.width + x) * 4;
          
          // Check if pixel is not fully white (meaning it's drawn)
          if (data[idx] < 250 || data[idx + 1] < 250 || data[idx + 2] < 250) {
            hasSand = true;
            
            // Random downward fall speed that accelerates slightly over time
            const fallSpeed = Math.floor(Math.random() * 15) + 5 + Math.floor(frame * 1.5);
            
            // Random horizontal drift to make it look scattered
            const shiftX = Math.floor(Math.random() * 7) - 3; // -3 to 3
            
            const newY = y + fallSpeed;
            let newX = x + shiftX;

            // If the sand particle hasn't fallen off the bottom
            if (newY < canvas.height) {
              // Constrain horizontal bounds
              newX = Math.max(0, Math.min(canvas.width - 1, newX));
              const newIdx = (newY * canvas.width + newX) * 4;
              
              // Move the color data to the new pixel location
              newData[newIdx] = data[idx];
              newData[newIdx + 1] = data[idx + 1];
              newData[newIdx + 2] = data[idx + 2];
              newData[newIdx + 3] = data[idx + 3];
            }
          }
        }
      }

      // Apply the newly calculated frame
      ctx.putImageData(newImgData, 0, 0);

      // Continue the loop if there's still sand visible
      if (hasSand) {
        frame++;
        requestAnimationFrame(animateSand);
      } else {
        resetCanvas();
        setIsShaking(false);
      }
    };

    // Start the sand falling loop
    requestAnimationFrame(animateSand);
  };

  const handleBack = () => {
    if (currentStage > 0) {
      setCurrentStage(currentStage - 1);
      setSavedDrawings(savedDrawings.slice(0, -1));
      resetCanvas();
    } else {
      navigate(-1);
    }
  };

  const handleNext = async () => {
    if (context && canvasRef.current) {
      const drawingData = canvasRef.current.toDataURL('image/png');
      const newSavedDrawings = [...savedDrawings, drawingData];
      setSavedDrawings(newSavedDrawings);
      resetCanvas();

      if (!isLastStage) {
        setCurrentStage(currentStage + 1);
      } else {
        // All stages complete — save characters to backend then navigate
        setIsProcessing(true);
        const showId = showIdRef.current;

        // Send character drawings (stages 0 and 1) to backend for AI styling
        // Use the character name from the story the child described (storyDetails[1]),
        // falling back to the stage label if not available
        const charNames = [
          charNameFromState || stages[0].label,
          storyDetails[3] || stages[1].label,
        ];

        await Promise.all(
          [0, 1].map(async (stageIdx) => {
            if (newSavedDrawings[stageIdx]) {
              try {
                await fetch('/api/add-character', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    show_id: showId,
                    name: charNames[stageIdx],
                    image_data: newSavedDrawings[stageIdx],
                  }),
                });
              } catch (e) {
                console.error(`add-character failed for stage ${stageIdx}:`, e);
              }
            }
          })
        );

        setIsProcessing(false);

        const newStory = {
          id: showId,
          date: new Date().toISOString(),
          drawings: newSavedDrawings,
          title: storyDetails.length > 0 ? `Story: ${storyDetails[0]}` : 'My Adventure',
        };
        const existingStories = JSON.parse(localStorage.getItem('tell-a-sketch-stories') || '[]');
        localStorage.setItem('tell-a-sketch-stories', JSON.stringify([newStory, ...existingStories]));

        navigate('/viewing', {
          state: {
            savedDrawings: newSavedDrawings,
            storyDetails,
            showId,
            charName: location.state?.charName,
            characterTraits: location.state?.characterTraits,
          },
        });
      }
    }
  };

  return (
    <div className="size-full bg-white flex flex-col items-center justify-center overflow-y-auto">
      {/* Etch-A-Sketch container */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={isShaking ? {
          scale: 1,
          opacity: 1,
          x: [0, -20, 20, -20, 20, -15, 15, -10, 10, -5, 5, 0],
          y: [0, 15, -15, 15, -15, 10, -10, 5, -5, 2, -2, 0],
          rotate: [0, -3, 3, -3, 3, -2, 2, -1, 1, -0.5, 0.5, 0]
        } : { scale: 1, opacity: 1, x: 0, y: 0, rotate: 0 }}
        transition={isShaking ? { duration: 0.75, ease: "easeInOut" } : { duration: 0.3 }}
        className="relative bg-gradient-to-br from-red-600 via-red-600 to-red-700 rounded-3xl shadow-2xl p-[24px] mt-[60px] mb-4"
        style={{ width: '880px', height: '620px' }}
      >
        {/* Simon hovering above instruction */}
        <div className="absolute -top-[100px] left-1/2 transform -translate-x-1/2 z-20 pointer-events-none drop-shadow-xl">
          <StoryGuide
            isAnimating={true}
            hideMessage={true}
          />
        </div>

        {/* Home button moved onto the top left of the red frame */}
        <div className="absolute top-5 left-6 z-30">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="bg-gray-100 text-gray-800 px-4 py-2 rounded-full font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-sm border-2 border-gray-300"
          >
            <Home className="w-4 h-4" />
            Home
          </motion.button>
        </div>

        {/* Stage indicator moved slightly to fit with Home button balance */}
        <div className="absolute top-5 right-6 bg-yellow-400 px-4 py-2 rounded-full shadow-md z-30 border-2 border-yellow-500">
          <p className="text-sm font-bold text-gray-800" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
            Step {currentStage + 1} of {stages.length}
          </p>
        </div>

        {/* Drawing instruction centered at top */}
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-10 w-full text-center">
          <p 
            className="text-2xl text-yellow-300 font-bold"
            style={{ 
              fontFamily: 'Comic Sans MS, cursive',
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
            }}
          >
            {currentStageInfo.instruction}!
          </p>
        </div>

        {/* Main canvas area */}
        <div className="absolute top-20 left-16 right-16 bottom-36 bg-white border-8 border-red-800 rounded-lg shadow-inner overflow-hidden">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className={`w-full h-full touch-none absolute inset-0 ${isShaking ? 'cursor-not-allowed' : 'cursor-crosshair'}`}
            style={{ imageRendering: 'auto' }}
          />
        </div>

        {/* Bottom control panel */}
        <div className="absolute bottom-6 left-16 right-16 flex items-center justify-between h-28">
          {/* Back knob (Previously Undo) */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBack}
              disabled={isShaking}
              className={`bg-white rounded-full w-20 h-20 shadow-lg flex items-center justify-center border-4 border-gray-300 ${isShaking ? 'opacity-50' : ''}`}
            >
              <span className="text-lg font-bold text-gray-700" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                Back
              </span>
            </motion.button>
          </div>

          {/* Color palette and controls */}
          <div className="flex-1 mx-6 space-y-3">
            {/* Color palette */}
            <div className="flex items-center justify-center gap-2">
              {colors.map((color) => (
                <motion.button
                  key={color}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setCurrentColor(color)}
                  disabled={isShaking}
                  className={`w-10 h-10 rounded-full shadow-md transition-all ${currentColor === color ? 'ring-4 ring-white scale-110' : ''} ${isShaking ? 'opacity-50' : ''}`}
                  style={{ 
                    backgroundColor: color,
                    border: color === '#FFFFFF' ? '3px solid #666' : '2px solid #333'
                  }}
                />
              ))}
            </div>

            {/* Size and tool controls */}
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                  Size
                </span>
                {[3, 5, 8].map((size, idx) => (
                  <motion.button
                    key={size}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setLineWidth(size)}
                    disabled={isShaking}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      lineWidth === size ? 'bg-yellow-400 scale-110' : 'bg-white'
                    } ${isShaking ? 'opacity-50' : ''}`}
                  >
                    <div 
                      className="rounded-full bg-gray-700"
                      style={{ 
                        width: idx === 0 ? '6px' : idx === 1 ? '10px' : '14px',
                        height: idx === 0 ? '6px' : idx === 1 ? '10px' : '14px'
                      }}
                    />
                  </motion.button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentColor('#FFFFFF')}
                  disabled={isShaking}
                  className={`px-3 py-1.5 rounded-full bg-gray-200 text-gray-800 text-sm font-bold shadow-md flex items-center gap-1.5 ${isShaking ? 'opacity-50' : ''}`}
                  style={{ fontFamily: 'Comic Sans MS, cursive' }}
                >
                  <EraserIcon className="w-4 h-4" />
                  Eraser
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleUndo}
                  disabled={isShaking}
                  className={`px-3 py-1.5 rounded-full bg-gray-200 text-gray-800 text-sm font-bold shadow-md flex items-center gap-1.5 ${isShaking ? 'opacity-50' : ''}`}
                  style={{ fontFamily: 'Comic Sans MS, cursive' }}
                >
                  <UndoIcon className="w-4 h-4" />
                  Undo
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClear}
                  disabled={isShaking}
                  className={`px-3 py-1.5 rounded-full bg-gray-200 text-gray-800 text-sm font-bold shadow-md flex items-center gap-1.5 ${isShaking ? 'opacity-50' : ''}`}
                  style={{ fontFamily: 'Comic Sans MS, cursive' }}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                  Clear
                </motion.button>
              </div>
            </div>
          </div>

          {/* Next knob */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNext}
              disabled={isShaking || isProcessing}
              className={`bg-white rounded-full w-20 h-20 shadow-lg flex items-center justify-center border-4 border-gray-300 ${isShaking || isProcessing ? 'opacity-50' : ''}`}
            >
              <span className="text-lg font-bold text-gray-700" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                {isProcessing ? '...' : 'Next'}
              </span>
            </motion.button>
          </div>
        </div>
        {/* Processing overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black/70 rounded-3xl flex flex-col items-center justify-center gap-4 z-50">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 border-4 border-[#FFD93D] border-t-transparent rounded-full"
            />
            <p className="text-[#FFD93D] text-2xl font-bold" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
              Styling your characters...
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
