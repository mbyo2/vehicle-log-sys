import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { observable } from '@legendapp/state';

interface IndexState {
  checkingFirstUser: boolean;
  attempts: number;
}

const indexState = observable<IndexState>({
  checkingFirstUser: true,
  attempts: 0
});

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    const checkFirstUser = async () => {
      try {
        const loadingState = loading.get();
        const userState = user.get();
        const currentAttempts = indexState.attempts.get();

        if (!loadingState) {
          if (userState) {
            navigate('/fleet');
          } else {
            const { count, error } = await supabase
              .from('profiles')
              .select('*', { count: 'exact', head: true });

            if (error) {
              console.error('Error checking for first user:', error);
              navigate('/signin');
              return;
            }

            // If no users exist, redirect to signup for super admin creation
            if (count === 0) {
              navigate('/signup');
            } else {
              navigate('/signin');
            }
          }
        } else {
          indexState.attempts.set(currentAttempts + 1);
        }
      } catch (error) {
        console.error('Error in checkFirstUser:', error);
        navigate('/signin');
      }
    };

    checkFirstUser();
  }, [navigate, user, loading]);

  const attempts = indexState.attempts.get();
  if (loading.get() && attempts < 3) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Welcome to Vehicle Log</h1>
        <p className="text-muted-foreground">
          Please wait while we redirect you...
        </p>
      </div>
    </div>
  );
};

export default Index;