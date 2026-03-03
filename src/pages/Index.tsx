
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { DEFAULT_ROUTES } from '@/components/auth/ProtectedRoute';

export default function Index() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  // Read observables reactively in render
  const currentUser = user.get();
  const currentProfile = profile.get();
  const isLoading = loading.get();

  useEffect(() => {
    if (isLoading) return; // Still loading, wait

    if (currentUser && currentProfile) {
      const defaultRoute = DEFAULT_ROUTES[currentProfile.role] || '/dashboard';
      navigate(defaultRoute, { replace: true });
    } else {
      navigate('/signin', { replace: true });
    }
  }, [isLoading, currentUser, currentProfile, navigate]);

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background animate-fade-in">
      <div className="flex flex-col items-center space-y-6">
        <LoadingSpinner size={32} className="text-primary" />
        <div className="text-center space-y-2">
          <h1 className="text-xl font-semibold">Fleet Manager</h1>
          <p className="text-muted-foreground animate-pulse">Loading...</p>
        </div>
      </div>
    </div>
  );
}
