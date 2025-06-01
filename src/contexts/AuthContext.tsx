
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { enableReactTracking } from "@legendapp/state/config/enableReactTracking";
import { authState } from './auth/AuthState';
import { useToast } from '@/hooks/use-toast';

enableReactTracking({
  auto: true
});

interface AuthContextType {
  user: typeof authState.user;
  profile: typeof authState.profile;
  loading: typeof authState.loading;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [initialized, setInitialized] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const signOut = async () => {
    try {
      console.log('Signing out user...');
      await supabase.auth.signOut();
      authState.user.set(null);
      authState.profile.set(null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      navigate('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign out"
      });
    }
  };

  const fetchUserProfile = async (userId: string, maxRetries = 3) => {
    let attempts = 0;
    
    while (attempts < maxRetries) {
      try {
        console.log(`Fetching profile for user ${userId}, attempt ${attempts + 1}`);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
      
        if (error) {
          console.error('Profile fetch error:', error);
          if (attempts === maxRetries - 1) {
            console.error('Max retries reached for profile fetch');
            return null;
          }
        } else if (data) {
          console.log('Profile loaded successfully:', data.role);
          return data;
        } else {
          console.warn('No profile found for user:', userId);
          return null;
        }
        
        attempts++;
        if (attempts < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      } catch (err) {
        console.error('Profile fetch attempt failed:', err);
        attempts++;
        if (attempts < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }
    }
    
    return null;
  };

  useEffect(() => {
    let mounted = true;
    let sessionTimeout: NodeJS.Timeout;
    
    const initializeAuth = async () => {
      if (!mounted) return;
      
      try {
        console.log('Initializing auth system...');
        authState.loading.set(true);
        
        // Set a timeout for session check
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => {
          sessionTimeout = setTimeout(() => reject(new Error('Session check timeout')), 8000);
        });
        
        const result = await Promise.race([sessionPromise, timeoutPromise]) as any;
        
        if (sessionTimeout) clearTimeout(sessionTimeout);
        
        const { data: { session }, error: sessionError } = result;
        
        if (sessionError) {
          console.error('Session error:', sessionError);
        } else if (session?.user && mounted) {
          console.log('Found existing session for user:', session.user.id);
          authState.user.set(session.user);
          
          // Fetch profile
          const profileData = await fetchUserProfile(session.user.id);
          if (mounted) {
            authState.profile.set(profileData);
          }
        } else {
          console.log('No existing session found');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (retryCount < 2) {
          console.log('Retrying auth initialization...');
          setRetryCount(prev => prev + 1);
          setTimeout(() => {
            if (mounted) initializeAuth();
          }, 2000);
          return;
        }
      } finally {
        if (mounted) {
          authState.loading.set(false);
          authState.initialized.set(true);
          setInitialized(true);
        }
        if (sessionTimeout) clearTimeout(sessionTimeout);
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('Auth state changed:', event, session?.user?.id || 'no user');
      
      if (event === 'SIGNED_OUT' || !session) {
        authState.user.set(null);
        authState.profile.set(null);
        return;
      }
      
      authState.user.set(session.user);

      if (session.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        // Defer profile fetch to avoid blocking auth state change
        setTimeout(async () => {
          if (!mounted) return;
          
          const profileData = await fetchUserProfile(session.user.id);
          if (mounted) {
            authState.profile.set(profileData);
          }
        }, 100);
      }
    });

    initializeAuth();

    return () => {
      mounted = false;
      if (sessionTimeout) clearTimeout(sessionTimeout);
      subscription.unsubscribe();
    };
  }, [retryCount]);

  return (
    <AuthContext.Provider 
      value={{
        user: authState.user,
        profile: authState.profile,
        loading: authState.loading,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
