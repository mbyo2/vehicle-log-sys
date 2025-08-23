
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
      try {
        setCheckingFirstUser(true);
        
        // If we have location state, use it
        if (locationIsFirstUser !== undefined) {
          console.log("Using location state for first user:", locationIsFirstUser);
          setIsFirstUser(locationIsFirstUser);
          setCheckingFirstUser(false);
          return;
        }
        
        console.log("Checking first user status...");
        
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
