import { AppRoutes } from './routes';
import { Toaster } from '@/components/ui/toaster';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-background">
      <AppRoutes />
      <Toaster />
    </div>
  );
}

export default App;