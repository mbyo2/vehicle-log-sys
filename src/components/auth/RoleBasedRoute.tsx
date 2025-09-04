import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

interface RoleBasedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
  requiredPermission?: { resource: string; action: string };
  fallbackPath?: string;
}

export function RoleBasedRoute({
  children,
  allowedRoles = [],
  requiredPermission,
  fallbackPath = '/signin'
}: RoleBasedRouteProps) {
  const { user, profile, loading, hasPermission } = useEnhancedAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={fallbackPath} replace />;
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert className="max-w-md">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Loading user profile. If this persists, please contact support.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Check role-based access
  if (allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert className="max-w-md">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access this page. Required role: {allowedRoles.join(', ')}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Check permission-based access
  if (requiredPermission && !hasPermission(requiredPermission.resource, requiredPermission.action)) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert className="max-w-md">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to perform this action. Required: {requiredPermission.resource}:{requiredPermission.action}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}