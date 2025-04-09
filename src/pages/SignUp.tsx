
import { SignUpForm } from '@/components/auth/SignUpForm';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/ui/icons';

export default function SignUp() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  const [isFirstUser, setIsFirstUser] = useState<boolean | null>(null);
  const [checkingFirstUser, setCheckingFirstUser] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const locationIsFirstUser = location.state?.isFirstUser;

  // Use callback to prevent recreation of the function on each render
  const checkFirstUser = useCallback(async () => {
    if (locationIsFirstUser !== undefined) {
      console.log("Using location state for first user:", locationIsFirstUser);
      setIsFirstUser(locationIsFirstUser);
      setCheckingFirstUser(false);
      return;
    }
    
    try {
      console.log("Checking if first user exists...");
      // Add a small delay to ensure Supabase connection is ready
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error("Error checking profiles:", error);
        setError(`Error checking if you're the first user: ${error.message}`);
        
        // If there's an error, let's check if it's because the table doesn't exist
        if (error.message.includes("does not exist")) {
          console.log("Profiles table doesn't exist, assuming first user");
          setIsFirstUser(true);
        } else {
          // For other errors, assume it's not the first user for safety
          setIsFirstUser(false);
        }
      } else {
        // Convert count to number
        const profileCount = count === null ? 0 : Number(count);
        console.log("Profile count:", profileCount);
        setIsFirstUser(profileCount === 0);
        
        // If there's already a superadmin, show a message
        if (profileCount > 0) {
          const { data: superAdminData, error: superAdminError } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'super_admin')
            .maybeSingle();
          
          if (!superAdminError && superAdminData) {
            console.log("Super admin already exists");
            toast({
              title: "Super Admin Already Exists",
              description: "A super admin account has already been created. Please sign in instead.",
              variant: "default"
            });
          }
        }
      }
    } catch (err: any) {
      console.error("Error checking profiles:", err);
      setError(`Error checking user status: ${err instanceof Error ? err.message : String(err)}`);
      // Assume first user if we can't check
      setIsFirstUser(true);
    } finally {
      setCheckingFirstUser(false);
    }
  }, [locationIsFirstUser, toast, retryCount]);

  // Effect to run the check only once on mount
  useEffect(() => {
    checkFirstUser();
  }, [checkFirstUser]);

  // Store these values in variables to avoid using hooks in conditionals
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
        <LoadingSpinner />
        <span className="ml-2 text-muted-foreground">Checking application status...</span>
      </div>
    );
  }

  // If there's an error, show it
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md mb-4 max-w-md">
          <h2 className="font-semibold mb-2">Error</h2>
          <p className="mb-2">{error}</p>
          <p className="text-sm text-muted-foreground">
            This could be due to a connection issue with the database or because the database tables haven't been set up yet.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              setError(null);
              setCheckingFirstUser(true);
              setRetryCount(prev => prev + 1);
            }} 
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 flex items-center"
          >
            <Icons.refresh className="mr-2 h-4 w-4" />
            Try Again
          </button>
          <button 
            onClick={() => { 
              setError(null);
              setIsFirstUser(true);
            }} 
            className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/90"
          >
            Continue as First User
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <SignUpForm isFirstUser={isFirstUser || false} />
    </div>
  );
}
