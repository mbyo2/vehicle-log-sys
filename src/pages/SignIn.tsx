
import { SignInForm } from '@/components/auth/SignInForm';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function SignIn() {
  const { user, loading } = useAuth();

  // If user is authenticated, redirect to dashboard
  if (!loading.get() && user.get()) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <SignInForm />
    </div>
  );
}
