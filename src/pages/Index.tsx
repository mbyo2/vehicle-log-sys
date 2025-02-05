import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { observable } from '@legendapp/state';
import { observer } from '@legendapp/state/react';
import { toast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

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

  useEffect(() => {
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
          currentAttempts
        });

        // Only proceed if not loading
        if (loadingState) {
          if (currentAttempts < 2) {
            indexState.attempts.set(currentAttempts + 1);
          }
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
        const { count, error } = await supabase
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

    checkFirstUser();
  }, [navigate, user, loading, profile]);

  // Render loading spinner while authentication is being checked
  return (
    <div className="flex h-screen items-center justify-center">
      <LoadingSpinner />
    </div>
  );
});

function getDefaultRoute(role: string): string {
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
}

export default Index;