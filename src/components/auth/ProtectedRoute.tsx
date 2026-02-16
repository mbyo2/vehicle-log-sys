
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

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
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  const currentUser = user.get();
  const currentProfile = profile.get();
  const isLoading = loading.get();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center animate-fade-in">
        <div className="text-center space-y-4">
          <LoadingSpinner size={24} className="text-primary" />
          <p className="text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  if (!currentProfile) {
    return <Navigate to="/signin" state={{ from: location, error: 'Profile not found' }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentProfile.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
