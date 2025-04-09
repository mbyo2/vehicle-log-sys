
import { SignUpForm } from '@/components/auth/SignUpForm';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/ui/icons';
import { RefreshCw, Database, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SignUp() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  const [isFirstUser, setIsFirstUser] = useState<boolean | null>(null);
  const [checkingFirstUser, setCheckingFirstUser] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'failed' | 'succeeded'>('checking');
  
  const locationIsFirstUser = location.state?.isFirstUser;

  // Function to manually set up database tables
  const setupDatabase = async () => {
    try {
      setCheckingFirstUser(true);
      
      console.log("Setting up database tables...");
      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/create-profiles-table`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabase.supabaseKey}`
          }
        }
      );
      
      const result = await response.json();
      console.log("Setup result:", result);
      
      if (!response.ok) {
        console.warn("Warning: Database setup completed with issues:", result.error);
        toast({
          variant: "warning",
          title: "Database Setup Warning",
          description: "Setup completed with issues: " + (result.error || "Unknown error")
        });
      } else {
        toast({
          title: "Database Setup Completed",
          description: "Database tables have been set up successfully."
        });
      }
      
      // Always set first user true if we're doing a manual setup
      setIsFirstUser(true);
      setError(null);
    } catch (err) {
      console.error("Error setting up database:", err);
      toast({
        variant: "destructive",
        title: "Database Setup Failed",
        description: "Failed to set up database tables. Proceeding as first user anyway."
      });
      // Even if setup fails, continue as first user
      setIsFirstUser(true);
      setError(null);
    } finally {
      setCheckingFirstUser(false);
    }
  };

  // Use callback to prevent recreation of the function on each render
  const checkFirstUser = useCallback(async () => {
    if (locationIsFirstUser !== undefined) {
      console.log("Using location state for first user:", locationIsFirstUser);
      setIsFirstUser(locationIsFirstUser);
      setCheckingFirstUser(false);
      return;
    }
    
    setConnectionStatus('checking');
    
    try {
      console.log("Checking if first user exists...");
      // Add a small delay to ensure Supabase connection is ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        // First, check if we can connect to Supabase at all
        const { data: healthCheck, error: healthError } = await supabase.rpc('pg_stat_database', {});
        
        if (healthError) {
          console.error("Supabase health check failed:", healthError);
          setConnectionStatus('failed');
          throw new Error("Unable to connect to the database");
        }
        
        // Now check if profiles table exists by attempting to count records
        const { count, error: queryError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        
        if (queryError) {
          console.error("Error checking profiles:", queryError);
          setConnectionStatus('failed');
          
          // Check if error message is empty and provide a more specific one
          const errorMessage = queryError.message || "Unable to connect to the database";
          
          // If error suggests table doesn't exist, handle appropriately
          if (queryError.message?.includes("does not exist") || queryError.code === "42P01") {
            console.log("Profiles table doesn't exist, assuming first user");
            setIsFirstUser(true);
            throw new Error("Database tables haven't been set up yet");
          } else {
            // For other errors, let the user decide what to do
            setIsFirstUser(null);
            throw new Error(errorMessage);
          }
        }
        
        setConnectionStatus('succeeded');
        
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
      } catch (supabaseError: any) {
        console.error("Supabase query error:", supabaseError);
        setConnectionStatus('failed');
        throw new Error(supabaseError.message || "Error connecting to database");
      }
    } catch (err: any) {
      console.error("General error checking profiles:", err);
      setConnectionStatus('failed');
      
      // Provide a meaningful error message even if err is not an Error object
      const errorMessage = err instanceof Error ? err.message : 
                        (typeof err === 'string' ? err : "Unknown error occurred");
      
      setError(`Error checking if you're the first user: ${errorMessage}`);
      
      // Don't automatically assume first user for all errors
      // Let the user make that decision through the UI
      setIsFirstUser(null);
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

  // If there's a connection error, show a more detailed error screen
  if (error && connectionStatus === 'failed') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="bg-destructive/10 border border-destructive text-destructive p-6 rounded-md mb-6 max-w-md">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Database Connection Error</h2>
          </div>
          
          <p className="mb-4">{error}</p>
          
          <div className="bg-background/50 p-4 rounded border border-border mb-4">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <Database className="h-4 w-4" />
              Possible causes:
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Your Supabase project is not properly configured</li>
              <li>The database tables haven't been created yet</li>
              <li>Your API keys in environment variables may be incorrect</li>
              <li>The Supabase service might be temporarily unavailable</li>
            </ul>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Since this is your first time setting up the application, you can continue as the first user to create
            the super admin account. The necessary database tables will be created automatically.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={() => {
              setError(null);
              setCheckingFirstUser(true);
              setRetryCount(prev => prev + 1);
            }} 
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          
          <Button 
            onClick={setupDatabase} 
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Database className="h-4 w-4" />
            Setup Database
          </Button>
          
          <Button 
            onClick={() => { 
              setError(null);
              setIsFirstUser(true);
              toast({
                title: "Proceeding as first user",
                description: "You'll be setting up the super admin account",
              });
            }} 
            variant="default"
            className="flex items-center gap-2"
          >
            <Icons.user className="h-4 w-4" />
            Continue as First User
          </Button>
        </div>
      </div>
    );
  }

  // If there's any other error, show it
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
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </button>
          <button 
            onClick={setupDatabase} 
            className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/90 flex items-center"
          >
            <Database className="mr-2 h-4 w-4" />
            Setup Database
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
