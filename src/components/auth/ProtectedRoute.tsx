import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/signin" />;
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    // Redirect based on role if access is denied
    if (profile.role === 'super_admin') {
      return <Navigate to="/admin/dashboard" />;
    } else if (profile.role === 'company_admin') {
      return <Navigate to="/company/dashboard" />;
    } else {
      return <Navigate to="/dashboard" />;
    }
  }

  return <>{children}</>;
}