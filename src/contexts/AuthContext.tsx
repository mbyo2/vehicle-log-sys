
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

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        authState.loading.set(true);
        
        // Get current session with timeout
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Session check timeout')), 10000);
        });
        
        const { data: { session }, error: sessionError } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;
        
        clearTimeout(timeoutId);
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          authState.loading.set(false);
          authState.initialized.set(true);
          setInitialized(true);
          return;
        }
        
        if (session?.user) {
          console.log('Found existing session for user:', session.user.id);
          authState.user.set(session.user);
          
          // Fetch profile with retry logic
          let retries = 3;
          let profileData = null;
          
          while (retries > 0 && !profileData) {
            try {
              const { data, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();
            
              if (profileError) {
                console.error('Error fetching profile:', profileError);
                if (retries === 1) {
                  // Last retry failed, continue without profile
                  break;
                }
              } else if (data) {
                console.log('Profile found:', data.role);
                profileData = data;
                authState.profile.set(data);
                break;
              } else {
                console.warn('No profile found for user:', session.user.id);
                break;
              }
              
              retries--;
              if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            } catch (profileError) {
              console.error('Failed to fetch profile:', profileError);
              retries--;
              if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
          }
        } else {
          console.log('No session found');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        clearTimeout(timeoutId);
      } finally {
        authState.loading.set(false);
        authState.initialized.set(true);
        setInitialized(true);
      }
    };

    initializeAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (event === 'SIGNED_OUT') {
        authState.user.set(null);
        authState.profile.set(null);
        return;
      }
      
      authState.user.set(session?.user ?? null);

      if (session?.user) {
        // Use setTimeout to prevent potential issues with auth state change
        setTimeout(async () => {
          try {
            const { data: profileData, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();
            
            if (error) {
              console.error('Error fetching profile during auth change:', error);
              authState.profile.set(null);
            } else {
              authState.profile.set(profileData ?? null);
              if (profileData) {
                console.log('Profile loaded during auth change:', profileData.role);
              }
            }
          } catch (error) {
            console.error('Error in auth state change handler:', error);
            authState.profile.set(null);
          }
        }, 100);
      } else {
        authState.profile.set(null);
      }
    });

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [navigate]);

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
