
import { SignInForm } from '@/components/auth/SignInForm';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function SignIn() {
  const { user, loading } = useAuth();
  
  // If still loading, show a spinner
  if (loading.get()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner />
        <span className="ml-2 text-muted-foreground">Loading...</span>
      </div>
    );
  }

  // If user is authenticated, redirect to dashboard
  if (user.get()) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <SignInForm />
    </div>
  );
}
