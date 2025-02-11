
import { useLocation, Navigate } from 'react-router-dom';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { useAuth } from '@/contexts/AuthContext';

export default function SignUp() {
  const location = useLocation();
  const { user, loading } = useAuth();
  const isFirstUser = location.state?.isFirstUser;

  // If user is already logged in, redirect to default route
  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <SignUpForm />
    </div>
  );
}
