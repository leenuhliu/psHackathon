import { RouterProvider } from 'react-router';
import { router } from './routes';
import { useState, useEffect } from 'react';
import { ApiShowcase } from './components/ApiShowcase';

const APP_W = 1024;
const APP_H = 768;

const BEZEL = 28;   // 14px each side
const MARGIN = 32;  // breathing room inside panel

function useTabletScale() {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const update = () => {
      const panelW = window.innerWidth / 2;
      const panelH = window.innerHeight;
      const s = Math.min(
        (panelW - BEZEL - MARGIN) / APP_W,
        (panelH - BEZEL - MARGIN) / APP_H,
      );
      setScale(Math.max(0.25, s));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return scale;
}

export default function App() {
  const scale = useTabletScale();

  return (
    <div className="fixed inset-0 flex bg-[#010409]">
      {/* Left half — API showcase */}
      <div className="w-1/2 h-full border-r border-gray-800 overflow-hidden">
        <ApiShowcase />
      </div>

      {/* Right half — tablet frame */}
      <div className="w-1/2 h-full flex items-center justify-center bg-gray-950">
        {/* iPad-style bezel */}
        <div
          className="relative flex items-center justify-center"
          style={{
            background: 'linear-gradient(145deg, #3a3a3c, #2a2a2c)',
            borderRadius: Math.round(40 * Math.min(1, scale)),
            padding: 14,
            boxShadow: '0 0 0 1px #555, 0 30px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.08)',
            width: APP_W * scale + BEZEL,
            height: APP_H * scale + BEZEL,
          }}
        >
          {/* Front camera */}
          <div
            className="absolute top-4 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-gray-700"
            style={{ boxShadow: 'inset 0 0 2px rgba(0,0,0,0.8)' }}
          />
          {/* Screen */}
          <div
            style={{
              width: APP_W * scale,
              height: APP_H * scale,
              borderRadius: 4,
              overflow: 'hidden',
              position: 'relative',
            }}
            className="bg-white shadow-inner"
          >
            <div
              style={{
                width: APP_W,
                height: APP_H,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                position: 'absolute',
                top: 0,
                left: 0,
              }}
            >
              <RouterProvider router={router} />
            </div>
          </div>
          {/* Home indicator */}
          <div
            className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-gray-600"
            style={{ width: 60, height: 4 }}
          />
        </div>
      </div>
    </div>
  );
}
