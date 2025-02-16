
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { supabase } from './integrations/supabase/client';
import { AppRoutes } from './routes';
import { Toaster } from '@/components/ui/toaster';

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check auth state on app load
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN') {
          navigate('/dashboard');
        } else if (event === 'SIGNED_OUT') {
          navigate('/signin');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <AppRoutes />
      <Toaster />
    </div>
  );
}

export default App;
