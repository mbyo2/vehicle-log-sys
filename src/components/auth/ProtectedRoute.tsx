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

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // If not authenticated and not on auth pages, redirect to signin
  if (!user && !location.pathname.startsWith('/signin') && !location.pathname.startsWith('/signup')) {
    // Save the attempted URL to redirect back after login
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // If authenticated but no profile, something went wrong
  if (user && !profile && !location.pathname.startsWith('/signin')) {
    console.error('User authenticated but no profile found');
    return <Navigate to="/signin" replace />;
  }

  // Check role-based access
  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    // Redirect based on role
    if (profile.role === 'super_admin') {
      return <Navigate to="/companies" replace />;
    } else if (profile.role === 'company_admin') {
      return <Navigate to="/fleet" replace />;
    } else {
      return <Navigate to="/documents" replace />;
    }
  }

  return <>{children}</>;
}