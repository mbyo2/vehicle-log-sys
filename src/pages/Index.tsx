import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
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
              .select('*', { count: 'exact', head: true })
              .eq('role', 'super_admin');

            if (error) {
              console.error('Error checking for first user:', error);
              navigate('/signin');
              return;
            }

            if (count === 0) {
              navigate('/signup', { state: { isFirstUser: true } });
            } else {
              navigate('/signin');
            }
          }
        } else if (currentAttempts < 2) {
          indexState.attempts.set(currentAttempts + 1);
        }
      } catch (error) {
        console.error('Error in checkFirstUser:', error);
        navigate('/signin');
      }
    };

    // Execute immediately
    checkFirstUser();
  }, [navigate, user, loading]);

  // Return null to avoid any flash of content
  return null;
};

export default Index;