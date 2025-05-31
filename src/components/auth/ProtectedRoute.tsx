
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const DEFAULT_ROUTES: Record<UserRole, string> = {
  super_admin: '/companies',
  company_admin: '/dashboard',
  supervisor: '/dashboard',
  driver: '/dashboard'
};

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  const [isVerifying, setIsVerifying] = useState(true);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      const maxAttempts = 3;
      const isLoading = loading.get();
      
      if (isLoading && attempts < maxAttempts) {
        setAttempts(prev => prev + 1);
        // Wait a bit more for auth to complete
        setTimeout(() => {
          setIsVerifying(isLoading);
        }, 1000);
      } else {
        setIsVerifying(false);
      }
    };

    checkAuth();
  }, [loading, attempts]);

  const currentUser = user.get();
  const currentProfile = profile.get();

  if (isVerifying && attempts < 3) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <LoadingSpinner className="mb-4" />
          <p className="text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    console.log('No user found, redirecting to signin');
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  if (!currentProfile) {
    console.log('No profile found for user, redirecting to signin');
    return <Navigate to="/signin" state={{ from: location, error: 'Profile not found' }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentProfile.role)) {
    console.log(`User role ${currentProfile.role} not allowed, redirecting to default route`);
    const defaultRoute = DEFAULT_ROUTES[currentProfile.role] || '/dashboard';
    return <Navigate to={defaultRoute} replace />;
  }

  return <>{children}</>;
}
