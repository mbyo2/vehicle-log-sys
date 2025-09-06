
import { Navigate, useLocation } from 'react-router-dom';
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
import { UserRole } from '@/types/auth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const DEFAULT_ROUTES: Record<UserRole, string> = {
  super_admin: '/dashboard',
  company_admin: '/dashboard',
  supervisor: '/dashboard',
  driver: '/dashboard'
};

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading } = useEnhancedAuth();
  const location = useLocation();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // If not loading and we have user data, we can proceed
      if (!loading) {
        setIsVerifying(false);
        return;
      }
      
      // Give auth some time to initialize
      setTimeout(() => {
        setIsVerifying(false);
      }, 3000); // Increased timeout to allow for profile loading
    };

    checkAuth();
  }, [loading, user, profile]);

  const currentUser = user;
  const currentProfile = profile;
  const isLoading = loading;

  if (isVerifying || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center animate-fade-in">
        <div className="text-center space-y-4">
          <div className="relative">
            <LoadingSpinner size={24} className="text-primary" />
            <div className="absolute inset-0 animate-ping">
              <LoadingSpinner size={24} className="opacity-20 text-primary" />
            </div>
          </div>
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
    console.log(`User role ${currentProfile.role} not allowed, redirecting to dashboard`);
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
