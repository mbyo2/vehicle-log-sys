
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { DEFAULT_ROUTES } from '@/components/auth/ProtectedRoute';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Database, AlertTriangle, RefreshCw } from 'lucide-react';

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
      // Use the full Supabase URL to call the edge function
      const response = await fetch(
        `https://yyeypbfdtitxqssvnagy.supabase.co/functions/v1/create-profiles-table`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json', 
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5ZXlwYmZkdGl0eHFzc3ZuYWd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzOTI1NTgsImV4cCI6MjA0OTk2ODU1OH0.jKd7rzhCpkF76FIYUAwT7gK3YLaGtUstjM-IJmdY6As`
          }
        }
      );
      
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Unknown error");
      }
      
      const result = await response.json();
      console.log("Database setup successful:", result);
      
      // Navigate to signup page after database is set up
      navigate('/signup', { state: { isFirstUser: true }, replace: true });
    } catch (err: any) {
      console.error("Error setting up database:", err);
      setError(`Failed to set up database: ${err.message}`);
    } finally {
      setIsSettingUpDb(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      // If authentication is still loading, we wait
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
      
      // Check if any users exist in the system
      try {
        setIsCheckingDb(true);
        console.log("Checking if any profiles exist...");
        
        try {
          // Using a more explicit type conversion to number for the count
          const { count, error } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });
          
          if (error) {
            console.error("Error checking profiles:", error);
            
            // If table doesn't exist, set up database
            if (error.message.includes('relation "profiles" does not exist')) {
              navigate('/signup', { state: { isFirstUser: true }, replace: true });
              return;
            }
            
            throw error;
          }
          
          // Convert count to number before comparing
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
          console.error("Error checking profiles:", err);
          
          // Show error but don't redirect so user can try to fix
          setError(`Failed to check database: ${err.message}`);
        }
      } catch (err: any) {
        console.error("General error:", err);
        setError(`Application error: ${err.message}`);
      } finally {
        setIsCheckingDb(false);
      }
    }, 1000);
    
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
        Initializing your application and checking database status...
      </p>
    </div>
  );
}
