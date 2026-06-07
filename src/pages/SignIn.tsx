
import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { SignInForm } from '@/components/auth/SignInForm';
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
import { Navigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function SignIn() {
  const { user, loading } = useEnhancedAuth();

  useEffect(() => {
    document.title = 'Sign In to Fleet Manager';
  }, []);

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

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <Helmet>
        <title>Sign In to Fleet Manager</title>
        <meta name="description" content="Sign in to your Fleet Manager account to manage vehicles, drivers, trips and maintenance." />
        <link rel="canonical" href="https://vehicle-log-sys.lovable.app/signin" />
        <meta property="og:title" content="Sign In to Fleet Manager" />
        <meta property="og:description" content="Sign in to your Fleet Manager account." />
        <meta property="og:url" content="https://vehicle-log-sys.lovable.app/signin" />
      </Helmet>
      <main className="min-h-screen flex flex-col items-center justify-center bg-background p-4 animate-fade-in">
        <h1 className="sr-only">Sign in to Fleet Manager</h1>
        <SignInForm />
      </main>
    </>
  );
}
