
import { SignUpForm } from '@/components/auth/SignUpForm';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function SignUp() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [isFirstUser, setIsFirstUser] = useState<boolean | null>(null);
  const [checkingFirstUser, setCheckingFirstUser] = useState(true);
  
  const locationIsFirstUser = location.state?.isFirstUser;

  // Check if this is the first user (if not specified in location state)
  useEffect(() => {
    const checkFirstUser = async () => {
      if (locationIsFirstUser !== undefined) {
        setIsFirstUser(locationIsFirstUser);
        setCheckingFirstUser(false);
        return;
      }
      
      try {
        console.log("Checking if first user exists...");
        const { count, error } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.error("Error checking profiles:", error);
          // If there's an error, it might be that the table doesn't exist yet
          setIsFirstUser(true);
        } else {
          // Convert count to number
          const profileCount = count === null ? 0 : Number(count);
          console.log("Profile count:", profileCount);
          setIsFirstUser(profileCount === 0);
        }
      } catch (err) {
        console.error("Error checking profiles:", err);
        // Assume first user if we can't check
        setIsFirstUser(true);
      } finally {
        setCheckingFirstUser(false);
      }
    };
    
    checkFirstUser();
  }, [locationIsFirstUser]);

  // If already logged in and not first user, redirect to dashboard
  if (!loading.get() && user.get() && !isFirstUser) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Show loading while checking first user status
  if (checkingFirstUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
        <span className="ml-2 text-muted-foreground">Checking application status...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <SignUpForm isFirstUser={isFirstUser || false} />
    </div>
  );
}
