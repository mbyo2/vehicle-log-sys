
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { DEFAULT_ROUTES } from '@/components/auth/ProtectedRoute';
import { supabase } from '@/integrations/supabase/client';

export default function Index() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    // Simple timeout to prevent infinite loop/recursion
    const timeoutId = setTimeout(() => {
      // If authentication is still loading, we wait
      if (loading.get()) return;
      
      const currentUser = user.get();
      const currentProfile = profile.get();
      
      // User is authenticated with a profile
      if (currentUser && currentProfile) {
        const defaultRoute = DEFAULT_ROUTES[currentProfile.role] || '/dashboard';
        navigate(defaultRoute, { replace: true });
        return;
      }
      
      // If there's no user profile, check if any users exist
      const checkFirstUser = async () => {
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        
        if (count === 0) {
          navigate('/signup', { state: { isFirstUser: true }, replace: true });
        } else {
          navigate('/signin', { replace: true });
        }
      };
      
      // User has no auth or profile, check if first user
      if (!currentUser || !currentProfile) {
        checkFirstUser().catch(err => {
          console.error("Error checking first user:", err);
          navigate('/signin', { replace: true });
        });
        return;
      }
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [navigate, user, profile, loading]);

  // Simple loading screen while we determine where to navigate
  return (
    <div className="flex h-screen items-center justify-center">
      <LoadingSpinner />
    </div>
  );
}
