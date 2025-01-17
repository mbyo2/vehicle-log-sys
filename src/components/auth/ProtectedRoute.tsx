import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Exclude /signup from the authentication check
  if (!user && location.pathname !== '/signup') {
    return <Navigate to="/signin" replace />;
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    // Redirect based on role if access is denied
    if (profile.role === 'super_admin') {
      return <Navigate to="/dashboard" replace />;
    } else if (profile.role === 'company_admin') {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
