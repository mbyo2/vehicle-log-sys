import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    const checkFirstUser = async () => {
      try {
        if (!loading.get()) {
          if (user.get()) {
            // If user is logged in, redirect to dashboard
            navigate('/dashboard');
          } else {
            // Check if there are any users in the system
            const { count, error } = await supabase
              .from('profiles')
              .select('*', { count: 'exact', head: true });

            if (error) {
              console.error('Error checking for first user:', error);
              navigate('/signin');
              return;
            }

            if (count === 0) {
              // No users exist, redirect to signup to create super admin
              navigate('/signup');
            } else {
              // Users exist, redirect to signin
              navigate('/signin');
            }
          }
        }
      } catch (error) {
        console.error('Error in checkFirstUser:', error);
        navigate('/signin');
      }
    };

    checkFirstUser();
  }, [navigate, user, loading]);

  // Show loading spinner while checking auth state
  if (loading.get()) {
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