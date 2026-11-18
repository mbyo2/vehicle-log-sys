
import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { SignInForm } from '@/components/auth/SignInForm';
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
import { Navigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { authRouteState } from '@/contexts/auth/routeState';
import { Button } from '@/components/ui/button';

export default function SignIn() {
  const { user, profile, loading, refetchProfile, signOut } = useEnhancedAuth();
  const routeState = authRouteState(user, profile, loading);

  useEffect(() => {
    document.title = 'Sign In to Fleet Manager';
  }, []);

  if (routeState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background animate-fade-in">
        <div className="flex flex-col items-center space-y-4">
          <LoadingSpinner size={24} className="text-primary" />
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  if (routeState === 'ready') {
    return <Navigate to="/dashboard" replace />;
  }

  if (routeState === 'profile-error') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background p-4">
        <h1 className="text-xl font-semibold">Your account could not be loaded</h1>
        <p className="text-muted-foreground text-center">Check your connection and try again.</p>
        <div className="flex gap-3">
          <Button onClick={() => void refetchProfile()}>Try again</Button>
          <Button variant="outline" onClick={() => void signOut()}>Sign out</Button>
        </div>
      </main>
    );
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
