import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { DEFAULT_ROUTES } from '@/components/auth/ProtectedRoute';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Database, AlertTriangle, RefreshCw, CheckCircle } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isCheckingDb, setIsCheckingDb] = useState(false);
  const [isSettingUpDb, setIsSettingUpDb] = useState(false);
  const [dbSetupComplete, setDbSetupComplete] = useState(false);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  
  const setupDatabase = async () => {
    try {
      setIsSettingUpDb(true);
      setError(null);
      
      console.log("Setting up database tables...");
      
      const { data, error } = await supabase.functions.invoke('create-profiles-table', {
        body: { force_setup: true }
      });
      
      if (error) {
        console.error("Database setup error:", error);
        throw error;
      }
      
      console.log("Database setup successful:", data);
      setDbSetupComplete(true);
      
      // Wait a moment then navigate to signup
      setTimeout(() => {
        navigate('/signup', { state: { isFirstUser: true }, replace: true });
      }, 2000);
    } catch (err: any) {
      console.error("Error setting up database:", err);
      setError(`Failed to set up database: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSettingUpDb(false);
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      console.log('Starting app initialization...');
      
      // Wait for auth to stabilize with a reasonable timeout
      let authTimeout = 0;
      const maxAuthWait = 8000; // 8 seconds
      
      while (loading.get() && authTimeout < maxAuthWait) {
        await new Promise(resolve => setTimeout(resolve, 200));
        authTimeout += 200;
      }
      
      setAuthCheckComplete(true);
      
      const currentUser = user.get();
      const currentProfile = profile.get();
      
      console.log("Auth check complete:", { 
        hasUser: !!currentUser, 
        hasProfile: !!currentProfile,
        loading: loading.get()
      });
      
      // User is authenticated with a profile - redirect to appropriate page
      if (currentUser && currentProfile) {
        console.log("User authenticated, navigating to default route for role:", currentProfile.role);
        const defaultRoute = DEFAULT_ROUTES[currentProfile.role] || '/dashboard';
        navigate(defaultRoute, { replace: true });
        return;
      }
      
      // User authenticated but no profile - potential issue
      if (currentUser && !currentProfile) {
        console.log("User authenticated but no profile found");
        setError("Account setup incomplete. Please contact support or try setting up the database again.");
        return;
      }
      
      // No user - check if this is a fresh installation
      try {
        setIsCheckingDb(true);
        console.log("Checking database status...");
        
        // Try to check if profiles table exists and has data
        const { count, error: countError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        
        if (countError) {
          console.error("Database check error:", countError);
          
          // Common database setup issues
          if (countError.message?.includes('relation "profiles" does not exist') || 
              countError.message?.includes('permission denied') ||
              countError.code === 'PGRST116' ||
              countError.message === '') {
            console.log("Database needs setup");
            setError("Database setup required. Click 'Setup Database' to initialize the application.");
            return;
          }
          
          // Other connection issues
          setError(`Database connection issue: ${countError.message || 'Unable to connect'}. Please try again.`);
          return;
        }
        
        const profileCount = count || 0;
        console.log("Found profiles in database:", profileCount);
        
        if (profileCount === 0) {
          console.log("No profiles found, directing to first user signup");
          navigate('/signup', { state: { isFirstUser: true }, replace: true });
        } else {
          console.log("Profiles exist, directing to signin");
          navigate('/signin', { replace: true });
        }
        
      } catch (err: any) {
        console.error("Unexpected error during database check:", err);
        setError(`Application initialization failed: ${err.message || 'Unknown error'}. Please try setting up the database.`);
      } finally {
        setIsCheckingDb(false);
      }
    };

    initializeApp();
  }, [navigate, user, profile, loading]);

  // Show completion message
  if (dbSetupComplete) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md text-center">
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertDescription className="mt-2 text-green-800">
              Database setup completed successfully! Redirecting to create your admin account...
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Show error state with action buttons
  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md">
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-5 w-5" />
            <AlertDescription className="mt-2">{error}</AlertDescription>
          </Alert>
          
          <div className="flex flex-col gap-3">
            <Button 
              onClick={setupDatabase} 
              disabled={isSettingUpDb}
              className="flex items-center"
            >
              {isSettingUpDb ? (
                <LoadingSpinner className="mr-2" size={16} />
              ) : (
                <Database className="mr-2 h-4 w-4" />
              )}
              {isSettingUpDb ? "Setting Up..." : "Setup Database"}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()} 
              disabled={isCheckingDb || isSettingUpDb}
              className="flex items-center"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading screen
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background">
      <div className="flex items-center mb-6">
        <LoadingSpinner size={24} />
        <span className="ml-2 text-xl font-medium">Loading Fleet Manager...</span>
      </div>
      <p className="text-muted-foreground text-center max-w-md">
        {!authCheckComplete 
          ? "Initializing authentication..." 
          : isCheckingDb 
          ? "Checking database status..." 
          : "Setting up your application..."}
      </p>
    </div>
  );
}
