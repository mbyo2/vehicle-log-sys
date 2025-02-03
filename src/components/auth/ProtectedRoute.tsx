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

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const isVerifying = loading.get();
    const currentAttempts = routeState.attempts.get();
    
    routeState.isVerifying.set(isVerifying);
    if (isVerifying) {
      routeState.attempts.set(currentAttempts + 1);
    }
  }, [loading]);

  const isVerifying = routeState.isVerifying.get();
  const attempts = routeState.attempts.get();

  if (isVerifying && attempts < 3) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user.get() && !location.pathname.startsWith('/signin') && !location.pathname.startsWith('/signup')) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  if (user.get() && !profile.get() && !location.pathname.startsWith('/signin')) {
    console.error('User authenticated but no profile found');
    return <Navigate to="/signin" replace />;
  }

  const userProfile = profile.get();
  if (allowedRoles && userProfile && !allowedRoles.includes(userProfile.role)) {
    const defaultRoute = getDefaultRoute(userProfile.role);
    return <Navigate to={defaultRoute} replace />;
  }

  return <>{children}</>;
}

function getDefaultRoute(role: UserRole): string {
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