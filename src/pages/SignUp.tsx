
import { SignUpForm } from '@/components/auth/SignUpForm';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { supabase } from '@/integrations/supabase/client';

export default function SignUp() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [isFirstUser, setIsFirstUser] = useState<boolean | null>(null);
  const [checkingFirstUser, setCheckingFirstUser] = useState(true);

  const locationIsFirstUser = location.state?.isFirstUser;

  useEffect(() => {
    document.title = 'Create your Fleet Manager account';
  }, []);

  useEffect(() => {
    const checkFirstUserStatus = async () => {
      try {
        setCheckingFirstUser(true);
        
        // If we have location state, use it but verify it
        if (locationIsFirstUser !== undefined) {
          console.log("Location state indicates first user:", locationIsFirstUser);
          
          // Double check with database if location says it's first user
          if (locationIsFirstUser) {
            const { data, error } = await supabase.rpc('check_if_first_user');
            if (!error && data === false) {
              // Location state is wrong, there's already a super admin
              console.log("Location state incorrect, super admin already exists");
              setIsFirstUser(false);
            } else {
              setIsFirstUser(locationIsFirstUser);
            }
          } else {
            setIsFirstUser(locationIsFirstUser);
          }
          setCheckingFirstUser(false);
          return;
        }
        
        console.log("Checking first user status directly...");
        
        // Use the database function to check if this is the first user
        const { data, error } = await supabase.rpc('check_if_first_user');
        
        if (error) {
          console.error("Error checking first user status:", error);
          // Default to false if there's an error (assume there are users)
          setIsFirstUser(false);
        } else {
          console.log("First user check result:", data);
          setIsFirstUser(data === true);
        }
        
      } catch (err: any) {
        console.error("Error checking first user status:", err);
        // Default to false if we can't check (assume there are users)
        setIsFirstUser(false);
      } finally {
        setCheckingFirstUser(false);
      }
    };

    checkFirstUserStatus();
  }, [locationIsFirstUser]);

  const isUserLoading = loading.get();
  const currentUser = user.get();

  // If already logged in, redirect to dashboard
  if (!isUserLoading && currentUser) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Show loading while checking first user status
  if (checkingFirstUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <LoadingSpinner className="mb-4" />
          <span className="ml-2 text-muted-foreground">Checking application status...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Create your Fleet Manager account</title>
        <meta name="description" content="Create a Fleet Manager account to start tracking vehicles, drivers, trips and maintenance for your team." />
        <link rel="canonical" href="https://vehicle-log-sys.lovable.app/signup" />
        <meta property="og:title" content="Create your Fleet Manager account" />
        <meta property="og:description" content="Sign up for Fleet Manager and start tracking your fleet in minutes." />
        <meta property="og:url" content="https://vehicle-log-sys.lovable.app/signup" />
      </Helmet>
      <main className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <h1 className="sr-only">Create your Fleet Manager account</h1>
        {isFirstUser && (
          <div className="w-full max-w-md mb-6">
            <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 mb-4">
              <h2 className="text-lg font-semibold mb-2">Welcome to Fleet Manager</h2>
              <p className="text-sm text-muted-foreground">
                You're setting up the application for the first time. Create a super admin account to get started.
              </p>
            </div>
          </div>
        )}
        <SignUpForm isFirstUser={isFirstUser || false} />
      </main>
    </>
  );
}
