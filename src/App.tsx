
import { useEffect } from 'react';
import { supabase } from './integrations/supabase/client';
import { useNavigate, Outlet } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { ErrorBoundary } from '@/components/ui/error-boundary';

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
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <Outlet />
        <Toaster />
      </div>
    </ErrorBoundary>
  );
}

export default App;
