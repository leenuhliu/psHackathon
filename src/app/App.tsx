import { RouterProvider } from 'react-router';
import { router } from './routes';
import { useState, useEffect } from 'react';

// ── Demo split-screen layout (API showcase + tablet frame) is saved in:
// ── src/app/components/ApiShowcase.tsx
// ── To re-enable: replace this file's contents with the demo version in git (commit 68e841d)

const APP_W = 1024;
const APP_H = 768;

function useAppScale() {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const update = () => {
      const s = Math.min(1, window.innerWidth / APP_W, window.innerHeight / APP_H);
      setScale(s);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return scale;
}

export default function App() {
  const scale = useAppScale();

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900">
      <div
        style={{
          width: APP_W,
          height: APP_H,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
        }}
        className="bg-white shadow-2xl"
      >
        <RouterProvider router={router} />
      </div>
    </div>
  );
}
