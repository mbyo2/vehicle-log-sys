
import { SignInForm } from '@/components/auth/SignInForm';
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
import { Navigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function SignIn() {
  const { user, loading } = useEnhancedAuth();
  
  // If still loading, show a spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background animate-fade-in">
        <div className="flex flex-col items-center space-y-4">
          <LoadingSpinner size={24} className="text-primary" />
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  // If user is authenticated, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 animate-fade-in">
      <SignInForm />
    </div>
  );
}
