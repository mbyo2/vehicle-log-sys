
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { DEFAULT_ROUTES } from '@/components/auth/ProtectedRoute';

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
        const defaultRoute = DEFAULT_ROUTES[currentProfile.role] || '/documents';
        navigate(defaultRoute, { replace: true });
        return;
      }
      
      // User has no auth or profile, redirect to signin
      if (!currentUser || !currentProfile) {
        navigate('/signin', { replace: true });
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
