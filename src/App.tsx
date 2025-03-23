
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
          console.log('Auth event: SIGNED_IN - redirecting to dashboard');
          navigate('/dashboard', { replace: true });
        } else if (event === 'SIGNED_OUT') {
          console.log('Auth event: SIGNED_OUT - redirecting to signin');
          navigate('/signin', { replace: true });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Add viewport meta tag for better mobile experience
  useEffect(() => {
    // Check if viewport meta tag exists, add if not
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.setAttribute('name', 'viewport');
      viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
      document.head.appendChild(viewportMeta);
    } else {
      viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
  }, []);

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
