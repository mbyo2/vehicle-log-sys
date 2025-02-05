import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { observable } from '@legendapp/state';
import { toast } from '@/hooks/use-toast';

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
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', userState.id)
              .single();

            if (profileError) throw profileError;

            const defaultRoute = getDefaultRoute(profile.role);
            navigate(defaultRoute);
          } else {
            const { count, error } = await supabase
              .from('profiles')
              .select('*', { count: 'exact', head: true });

            if (error) throw error;

            if (count === 0) {
              navigate('/signup', { state: { isFirstUser: true } });
            } else {
              navigate('/signin');
            }
          }
        } else if (currentAttempts < 2) {
          indexState.attempts.set(currentAttempts + 1);
        }
      } catch (error: any) {
        console.error('Error in checkFirstUser:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to initialize application"
        });
        navigate('/signin');
      }
    };

    checkFirstUser();
  }, [navigate, user, loading]);

  return null;
};

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