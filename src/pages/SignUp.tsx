
import { SignUpForm } from '@/components/auth/SignUpForm';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function SignUp() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  const [isFirstUser, setIsFirstUser] = useState<boolean | null>(null);
  const [checkingFirstUser, setCheckingFirstUser] = useState(true);
  const [settingUpDatabase, setSettingUpDatabase] = useState(false);
  
  const locationIsFirstUser = location.state?.isFirstUser;

  const setupDatabase = async () => {
    try {
      setSettingUpDatabase(true);
      
      console.log("Setting up database tables...");
      
      const { data, error } = await supabase.functions.invoke('create-profiles-table', {
        body: { force_setup: true }
      });
      
      if (error) {
        console.error("Database setup error:", error);
        toast({
          variant: "destructive",
          title: "Database Setup Failed",
          description: error.message || "Failed to set up database tables"
        });
        return;
      }
      
      console.log("Database setup successful:", data);
      toast({
        title: "Database Setup Completed",
        description: "Database tables have been set up successfully."
      });
      
      setIsFirstUser(true);
    } catch (err: any) {
      console.error("Error setting up database:", err);
      toast({
        variant: "destructive",
        title: "Database Setup Failed",
        description: err.message || "Failed to set up database tables"
      });
    } finally {
      setSettingUpDatabase(false);
    }
  };

  useEffect(() => {
    const checkFirstUserStatus = async () => {
      if (locationIsFirstUser !== undefined) {
        console.log("Using location state for first user:", locationIsFirstUser);
        setIsFirstUser(locationIsFirstUser);
        setCheckingFirstUser(false);
        return;
      }
      
      try {
        // Check if any profiles exist
        const { count, error } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
          
        if (error) {
          console.error("Error checking profiles:", error);
          // If error suggests table doesn't exist, assume first user
          if (error.message?.includes('relation "profiles" does not exist')) {
            setIsFirstUser(true);
          } else {
            // For other errors, assume not first user but allow setup
            setIsFirstUser(false);
          }
        } else {
          const profileCount = count === null ? 0 : Number(count);
          setIsFirstUser(profileCount === 0);
        }
      } catch (err) {
        console.error("Error in first user check:", err);
        setIsFirstUser(true); // Default to first user on error
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
            <p className="text-sm text-muted-foreground mb-3">
              You're setting up the application for the first time. Create a super admin account to get started.
            </p>
            <Button
              onClick={setupDatabase}
              disabled={settingUpDatabase}
              variant="outline"
              className="w-full"
            >
              {settingUpDatabase ? 
                <>
                  <LoadingSpinner size={16} className="mr-2" />
                  Setting up database...
                </> : 
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Setup Database Tables
                </>
              }
            </Button>
          </div>
        </div>
      )}
      <SignUpForm isFirstUser={isFirstUser || false} />
    </div>
  );
}
