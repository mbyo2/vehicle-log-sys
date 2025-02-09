
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { observable } from '@legendapp/state';
import { observer } from '@legendapp/state/react';
import { toast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { PostgrestResponse } from '@supabase/supabase-js';

interface IndexState {
  checkingFirstUser: boolean;
  attempts: number;
}

const indexState = observable<IndexState>({
  checkingFirstUser: true,
  attempts: 0
});

const Index = observer(() => {
  const navigate = useNavigate();
  const { user, loading, profile } = useAuth();

  // Memoize the route based on role to prevent unnecessary recalculations
  const getDefaultRoute = useMemo(() => (role: string): string => {
    switch (role) {
      case 'super_admin':
        return '/companies';
      case 'company_admin':
        return '/fleet';
      case 'supervisor':
        return '/fleet';
      case 'driver':
        return '/documents';
      default:
        return '/documents';
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const checkFirstUser = async () => {
      try {
        // Get all state values at the start to ensure consistent access
        const loadingState = loading.get();
        const userState = user.get();
        const profileState = profile.get();
        const currentAttempts = indexState.attempts.get();

        // Debug logging
        console.log('Index state:', {
          loadingState,
          userState,
          profileState,
          currentAttempts,
          mounted
        });

        // Only proceed if component is still mounted
        if (!mounted) return;

        // If we've tried too many times, redirect to signin
        if (currentAttempts >= 3) {
          console.log('Maximum attempts reached, redirecting to signin');
          navigate('/signin', { replace: true });
          return;
        }

        // Increment attempts counter
        indexState.attempts.set(currentAttempts + 1);

        // Only proceed if not loading
        if (loadingState) {
          return;
        }

        // Handle authenticated user with profile
        if (userState && profileState) {
          const defaultRoute = getDefaultRoute(profileState.role);
          console.log('Redirecting to default route:', defaultRoute);
          navigate(defaultRoute, { replace: true });
          return;
        }

        // Handle authenticated user without profile
        if (userState && !profileState) {
          console.log('User exists but no profile, redirecting to signin');
          navigate('/signin', { replace: true });
          return;
        }

        // Check for first user scenario
        const { data, error, count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        if (error) throw error;

        if (count === 0) {
          console.log('No users exist, redirecting to first user signup');
          navigate('/signup', { state: { isFirstUser: true }, replace: true });
        } else {
          console.log('Users exist but not logged in, redirecting to signin');
          navigate('/signin', { replace: true });
        }
      } catch (error: any) {
        console.error('Error in checkFirstUser:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to initialize application. Please try again."
        });
        navigate('/signin', { replace: true });
      }
    };

    // Set a timeout to ensure we don't get stuck
    timeoutId = setTimeout(() => {
      if (mounted && indexState.attempts.get() < 3) {
        checkFirstUser();
      }
    }, 1000);

    // Run initial check
    checkFirstUser();

    // Cleanup function to prevent state updates after unmount
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [navigate, user, loading, profile, getDefaultRoute]);

  // Render loading spinner while authentication is being checked
  return (
    <div className="flex h-screen items-center justify-center">
      <LoadingSpinner />
    </div>
  );
});

export default Index;
