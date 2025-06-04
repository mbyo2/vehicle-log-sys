
import { SignUpForm } from '@/components/auth/SignUpForm';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { supabase } from '@/integrations/supabase/client';

export default function SignUp() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [isFirstUser, setIsFirstUser] = useState<boolean | null>(null);
  const [checkingFirstUser, setCheckingFirstUser] = useState(true);
  
  const locationIsFirstUser = location.state?.isFirstUser;

  useEffect(() => {
    const checkFirstUserStatus = async () => {
      // If we have location state, use it
      if (locationIsFirstUser !== undefined) {
        console.log("Using location state for first user:", locationIsFirstUser);
        setIsFirstUser(locationIsFirstUser);
        setCheckingFirstUser(false);
        return;
      }
      
      try {
        console.log("Checking first user status via database setup...");
        
        // Use the database setup function to check status
        const { data: setupResult, error: setupError } = await supabase.functions.invoke('create-profiles-table', {
          body: { check_only: true }
        });
        
        if (setupError) {
          console.error("Setup function error:", setupError);
          // Fallback to direct database check
          try {
            const { count, error: countError } = await supabase
              .from('profiles')
              .select('*', { count: 'exact', head: true });
              
            if (countError) {
              console.error("Direct count error:", countError);
              // If we can't check, assume first user for safety
              setIsFirstUser(true);
            } else {
              setIsFirstUser((count || 0) === 0);
            }
          } catch (fallbackErr) {
            console.error("Fallback check failed:", fallbackErr);
            setIsFirstUser(true);
          }
        } else if (setupResult?.success) {
          const profileCount = setupResult.profileCount || 0;
          console.log("Profile count from setup function:", profileCount);
          setIsFirstUser(profileCount === 0);
        } else {
          console.warn("Setup function returned unsuccessful result");
          setIsFirstUser(true);
        }
        
      } catch (err: any) {
        console.error("Error checking first user status:", err);
        // Default to first user to allow setup
        setIsFirstUser(true);
      } finally {
        setCheckingFirstUser(false);
      }
    };

    checkFirstUserStatus();
  }, [locationIsFirstUser]);

  const isUserLoading = loading.get();
  const currentUser = user.get();

  // If already logged in and not first user, redirect to dashboard
  if (!isUserLoading && currentUser && !isFirstUser) {
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
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
    </div>
  );
}
