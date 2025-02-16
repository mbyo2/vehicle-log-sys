
import { SignUpForm } from '@/components/auth/SignUpForm';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

export default function SignUp() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const isFirstUser = location.state?.isFirstUser;

  if (!loading && user && !isFirstUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <SignUpForm isFirstUser={isFirstUser} />
    </div>
  );
}
