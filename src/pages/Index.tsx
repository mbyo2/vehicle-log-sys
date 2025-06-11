
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { DEFAULT_ROUTES } from '@/components/auth/ProtectedRoute';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [initializationStep, setInitializationStep] = useState('Starting...');
  
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setInitializationStep('Checking authentication...');
        
        // Wait for auth to stabilize
        let attempts = 0;
        const maxAttempts = 5;
        
        while (loading.get() && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 500));
          attempts++;
        }
        
        const currentUser = user.get();
        const currentProfile = profile.get();
        
        console.log("Auth check complete:", { 
          hasUser: !!currentUser, 
          hasProfile: !!currentProfile,
          attempts 
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
          console.log("User authenticated but no profile found, signing out");
          await supabase.auth.signOut();
          navigate('/signin', { replace: true });
          return;
        }
        
        // No user - check first user status
        setInitializationStep('Checking setup status...');
        console.log("No user found, checking first user status...");
        
        try {
          // Simple direct check for profiles
          const { count, error: countError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });
          
          if (countError) {
            console.error("Profile count check failed:", countError);
            // If profiles table doesn't exist, assume first user
            navigate('/signup', { state: { isFirstUser: true }, replace: true });
            return;
          }
          
          const profileCount = count || 0;
          console.log("Profile count:", profileCount);
          
          if (profileCount === 0) {
            console.log("First user detected, redirecting to signup");
            navigate('/signup', { state: { isFirstUser: true }, replace: true });
          } else {
            console.log("Existing users found, redirecting to signin");
            navigate('/signin', { replace: true });
          }
          
        } catch (setupErr: any) {
          console.error("Setup check failed:", setupErr);
          // Default to first user to allow setup
          navigate('/signup', { state: { isFirstUser: true }, replace: true });
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
          <button 
            onClick={() => window.location.reload()} 
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Retry
          </button>
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
          {initializationStep}
        </p>
      </div>
    );
  }

  return null;
}
