
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
        
        // Wait for auth to stabilize with timeout
        let attempts = 0;
        const maxAttempts = 10;
        
        while (loading.get() && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 300));
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
          console.log("User authenticated but no profile found");
          setError("Account setup incomplete. Please contact support.");
          setIsChecking(false);
          return;
        }
        
        // No user - set up database and check first user status
        setInitializationStep('Setting up database...');
        console.log("No user found, setting up database...");
        
        try {
          const { data: setupResult, error: setupError } = await supabase.functions.invoke('create-profiles-table', {
            body: { force_setup: true }
          });
          
          if (setupError) {
            console.error("Database setup error:", setupError);
            throw new Error(`Database setup failed: ${setupError.message}`);
          }
          
          console.log("Database setup result:", setupResult);
          
          if (setupResult?.success) {
            const isFirstUser = setupResult.isFirstUser || setupResult.profileCount === 0;
            console.log("Setup successful, isFirstUser:", isFirstUser);
            
            if (isFirstUser) {
              console.log("Directing to first user signup");
              navigate('/signup', { state: { isFirstUser: true }, replace: true });
            } else {
              console.log("Directing to signin");
              navigate('/signin', { replace: true });
            }
          } else {
            throw new Error(setupResult?.error || 'Database setup failed');
          }
          
        } catch (setupErr: any) {
          console.error("Failed to setup database:", setupErr);
          
          // Fallback: try to check profiles directly
          setInitializationStep('Checking existing setup...');
          try {
            const { count, error: countError } = await supabase
              .from('profiles')
              .select('*', { count: 'exact', head: true });
            
            if (countError) {
              console.error("Direct profile check failed:", countError);
              // If we can't check profiles, assume first user
              navigate('/signup', { state: { isFirstUser: true }, replace: true });
            } else {
              const profileCount = count || 0;
              console.log("Direct check - profile count:", profileCount);
              
              if (profileCount === 0) {
                navigate('/signup', { state: { isFirstUser: true }, replace: true });
              } else {
                navigate('/signin', { replace: true });
              }
            }
          } catch (finalErr: any) {
            console.error("Final fallback failed:", finalErr);
            setError(`Failed to initialize: ${finalErr.message || 'Unknown error'}`);
          }
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
          {initializationStep}
        </p>
      </div>
    );
  }

  return null;
}
