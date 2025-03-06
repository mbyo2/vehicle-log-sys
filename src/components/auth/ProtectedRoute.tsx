
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useEffect } from 'react';
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

export const DEFAULT_ROUTES: Record<UserRole, string> = {
  super_admin: '/companies',
  company_admin: '/fleet',
  supervisor: '/fleet',
  driver: '/documents'
};

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const isVerifying = loading.get();
    const currentAttempts = routeState.attempts.get();
    
    routeState.isVerifying.set(isVerifying);
    if (isVerifying && currentAttempts < 2) {
      routeState.attempts.set(currentAttempts + 1);
    }
  }, [loading]);

  const isVerifying = routeState.isVerifying.get();
  const attempts = routeState.attempts.get();
  const currentUser = user.get();
  const currentProfile = profile.get();

  if (isVerifying && attempts < 2) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!currentUser || !currentProfile) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentProfile.role)) {
    const defaultRoute = DEFAULT_ROUTES[currentProfile.role] || '/documents';
    return <Navigate to={defaultRoute} replace />;
  }

  return <>{children}</>;
}
