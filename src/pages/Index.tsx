
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { DEFAULT_ROUTES } from '@/components/auth/ProtectedRoute';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Database, AlertTriangle, RefreshCw } from 'lucide-react';
import { getSupabaseConfig } from '@/lib/supabase-config';

export default function Index() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isCheckingDb, setIsCheckingDb] = useState(false);
  const [isSettingUpDb, setIsSettingUpDb] = useState(false);
  
  const setupDatabase = async () => {
    try {
      setIsSettingUpDb(true);
      setError(null);
      
      console.log("Setting up database tables...");
      
      const { data, error } = await supabase.functions.invoke('create-profiles-table');
      
      if (error) {
        console.error("Database setup error:", error);
        throw error;
      }
      
      console.log("Database setup successful:", data);
      
      // Navigate to signup page after database is set up
      navigate('/signup', { state: { isFirstUser: true }, replace: true });
    } catch (err: any) {
      console.error("Error setting up database:", err);
      setError(`Failed to set up database: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSettingUpDb(false);
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      // Wait for auth to initialize
      if (loading.get()) {
        console.log("Auth is still loading, waiting...");
        return;
      }
      
      const currentUser = user.get();
      const currentProfile = profile.get();
      
      console.log("Index page - Current auth state:", { 
        hasUser: !!currentUser, 
        hasProfile: !!currentProfile,
        loading: loading.get()
      });
      
      // User is authenticated with a profile
      if (currentUser && currentProfile) {
        console.log("User authenticated, navigating to default route for role:", currentProfile.role);
        const defaultRoute = DEFAULT_ROUTES[currentProfile.role] || '/dashboard';
        navigate(defaultRoute, { replace: true });
        return;
      }
      
      // If user is authenticated but no profile, there might be a setup issue
      if (currentUser && !currentProfile) {
        console.log("User authenticated but no profile found, checking database");
        setError("Authentication issue: User account found but profile missing. Please contact support.");
        return;
      }
      
      // Check if any users exist in the system
      try {
        setIsCheckingDb(true);
        console.log("Checking if any profiles exist...");
        
        const { count, error: countError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        
        if (countError) {
          console.error("Error checking profiles:", countError);
          
          // If table doesn't exist or connection issues, offer to set up database
          if (countError.message?.includes('relation "profiles" does not exist') || 
              countError.message?.includes('connection') ||
              countError.message === '') {
            console.log("Database setup needed");
            navigate('/signup', { state: { isFirstUser: true }, replace: true });
            return;
          }
          
          throw countError;
        }
        
        const profileCount = count === null ? 0 : Number(count);
        console.log("Profile count:", profileCount);
        
        if (profileCount === 0) {
          console.log("No profiles found, directing to first user signup");
          navigate('/signup', { state: { isFirstUser: true }, replace: true });
        } else {
          console.log("Profiles exist, directing to signin");
          navigate('/signin', { replace: true });
        }
      } catch (err: any) {
        console.error("Error during database check:", err);
        const errorMessage = err.message || 'Unknown database error';
        setError(`Database connection issue: ${errorMessage}`);
      } finally {
        setIsCheckingDb(false);
      }
    };

    // Add a small delay to ensure auth state is properly initialized
    const timeoutId = setTimeout(initializeApp, 500);
    
    return () => clearTimeout(timeoutId);
  }, [navigate, user, profile, loading]);

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
                <LoadingSpinner className="mr-2" />
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
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Simple loading screen while we determine where to navigate
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background">
      <div className="flex items-center mb-6">
        <LoadingSpinner size={24} />
        <span className="ml-2 text-xl font-medium">Loading Fleet Manager...</span>
      </div>
      <p className="text-muted-foreground text-center max-w-md">
        {isCheckingDb ? "Checking database status..." : "Initializing your application..."}
      </p>
    </div>
  );
}
