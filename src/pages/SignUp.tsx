
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
          // If we can't determine, check profiles table directly
          const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .limit(1);
          
          if (profileError) {
            console.error("Error checking profiles:", profileError);
            setIsFirstUser(true); // Assume first user if we can't check
          } else {
            setIsFirstUser(profiles.length === 0);
          }
        } else {
          console.log("First user check result:", data);
          setIsFirstUser(data === true);
        }
        
      } catch (err: any) {
        console.error("Error checking first user status:", err);
        // Default to true for first time setup
        setIsFirstUser(true);
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
