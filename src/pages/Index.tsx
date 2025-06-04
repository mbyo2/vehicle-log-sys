
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { DEFAULT_ROUTES } from '@/components/auth/ProtectedRoute';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Wait for auth to stabilize
        let attempts = 0;
        const maxAttempts = 15; // 3 seconds max
        
        while (loading.get() && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 200));
          attempts++;
        }
        
        const currentUser = user.get();
        const currentProfile = profile.get();
        
        console.log("Auth check complete:", { 
          hasUser: !!currentUser, 
          hasProfile: !!currentProfile
        });
        
        // User is authenticated with a profile
        if (currentUser && currentProfile) {
          console.log("User authenticated, navigating to default route");
          const defaultRoute = DEFAULT_ROUTES[currentProfile.role] || '/dashboard';
          navigate(defaultRoute, { replace: true });
          return;
        }
        
        // User authenticated but no profile
        if (currentUser && !currentProfile) {
          console.log("User authenticated but no profile found");
          setError("Account setup incomplete. Please contact support.");
          setIsChecking(false);
          return;
        }
        
        // No user - check if this is first user setup
        try {
          console.log("Checking if first user setup...");
          
          const { count, error: countError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });
          
          if (countError) {
            console.error("Database check error:", countError);
            
            // If profiles table doesn't exist, setup database
            if (countError.message?.includes('relation "profiles" does not exist') || 
                countError.code === 'PGRST116') {
              console.log("Setting up database...");
              
              const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-profiles-table`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
                  },
                  body: JSON.stringify({ force_setup: true })
                }
              );
              
              if (!response.ok) {
                throw new Error(`Setup failed: ${response.status}`);
              }
              
              const setupResult = await response.json();
              console.log("Database setup result:", setupResult);
              
              if (setupResult.success) {
                navigate('/signup', { state: { isFirstUser: true }, replace: true });
              } else {
                throw new Error(setupResult.error || 'Database setup failed');
              }
              return;
            }
            
            throw countError;
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
          console.error("Database check failed:", err);
          setError(`Failed to initialize application: ${err.message || 'Unknown error'}`);
        }
      } catch (error: any) {
        console.error("App initialization error:", error);
        setError(`Application initialization failed: ${error.message || 'Unknown error'}`);
      } finally {
        setIsChecking(false);
      }
    };

    initializeApp();
  }, [navigate, user, profile, loading]);

  // Show error state
  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md">
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-5 w-5" />
            <AlertDescription className="mt-2">{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Show loading screen
  if (isChecking) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background">
        <div className="flex items-center mb-6">
          <LoadingSpinner size={24} />
          <span className="ml-2 text-xl font-medium">Loading Fleet Manager...</span>
        </div>
        <p className="text-muted-foreground text-center max-w-md">
          Initializing your application...
        </p>
      </div>
    );
  }

  return null;
}
