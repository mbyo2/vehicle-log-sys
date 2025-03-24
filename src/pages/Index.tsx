
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
    const timeoutId = setTimeout(async () => {
      // If authentication is still loading, we wait
      if (loading.get()) {
        console.log("Auth is still loading, waiting...");
        return;
      }
      
      const currentUser = user.get();
      const currentProfile = profile.get();
      
      console.log("Index page - Current auth state:", { 
        hasUser: !!currentUser, 
        hasProfile: !!currentProfile,
        loading: loading.get()
      });
      
      // User is authenticated with a profile
      if (currentUser && currentProfile) {
        console.log("User authenticated, navigating to default route for role:", currentProfile.role);
        const defaultRoute = DEFAULT_ROUTES[currentProfile.role] || '/dashboard';
        navigate(defaultRoute, { replace: true });
        return;
      }
      
      // Check if any users exist in the system
      try {
        console.log("Checking if any profiles exist...");
        // Fix: Using a more explicit type conversion to number for the count
        const { count, error } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.error("Error checking profiles:", error);
          navigate('/signin', { replace: true });
          return;
        }
        
        // Fix: Properly convert the count to a number before comparing
        const profileCount = count === null ? 0 : (typeof count === 'number' ? count : parseInt(String(count), 10));
        console.log("Profile count:", profileCount);
        
        if (profileCount === 0) {
          console.log("No profiles found, directing to first user signup");
          navigate('/signup', { state: { isFirstUser: true }, replace: true });
        } else {
          console.log("Profiles exist, directing to signin");
          navigate('/signin', { replace: true });
        }
      } catch (err) {
        console.error("Error checking profiles:", err);
        navigate('/signin', { replace: true });
      }
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [navigate, user, profile, loading]);

  // Simple loading screen while we determine where to navigate
  return (
    <div className="flex h-screen items-center justify-center">
      <LoadingSpinner size="lg" />
      <span className="ml-2 text-muted-foreground">Loading...</span>
    </div>
  );
}
