
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useEffect, useMemo } from 'react';
import { observable } from '@legendapp/state';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

interface RouteState {
  isVerifying: boolean;
  attempts: number;
}

const routeState = observable<RouteState>({
  isVerifying: true,
  attempts: 0
});

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // Memoize the default route calculation
  const getDefaultRoute = useMemo(() => (role: UserRole): string => {
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
  }, []);

  useEffect(() => {
    const isVerifying = loading.get();
    const currentAttempts = routeState.attempts.get();
    
    routeState.isVerifying.set(isVerifying);
    if (isVerifying && currentAttempts < 2) {
      routeState.attempts.set(currentAttempts + 1);
    }
  }, [loading]);

  // Move these outside of any conditions
  const isVerifying = routeState.isVerifying.get();
  const attempts = routeState.attempts.get();
  const currentUser = user.get();
  const currentProfile = profile.get();

  // Show loading spinner for a brief moment
  if (isVerifying && attempts < 2) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Handle unauthenticated users
  if (!currentUser) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // Handle missing profile
  if (!currentProfile) {
    return <Navigate to="/signin" replace />;
  }

  // Check role access
  if (allowedRoles && !allowedRoles.includes(currentProfile.role)) {
    return <Navigate to={getDefaultRoute(currentProfile.role)} replace />;
  }

  return <>{children}</>;
}
