import { RouterProvider } from 'react-router';
import { router } from './routes';

export default function App() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900">
      <div 
        className="relative bg-white overflow-hidden shadow-2xl"
        style={{ 
          width: '1024px', 
          height: '768px',
          maxWidth: '100vw',
          maxHeight: '100vh'
        }}
      >
        <RouterProvider router={router} />
      </div>
    </div>
  );
}