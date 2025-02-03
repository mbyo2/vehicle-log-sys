import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    const checkFirstUser = async () => {
      if (!loading.get()) {
        if (user.get()) {
          navigate('/dashboard');
        } else {
          // Check if there are any users in the system
          const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

          if (count === 0) {
            // No users exist, redirect to signup to create super admin
            navigate('/signup');
          } else {
            // Users exist, redirect to signin
            navigate('/signin');
          }
        }
      }
    };

    checkFirstUser();
  }, [navigate, user, loading]);

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