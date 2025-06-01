
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

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log(`Fetching profile for user ${userId}`);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
    
      if (error) {
        console.error('Profile fetch error:', error);
        return null;
      }
      
      if (data) {
        console.log('Profile loaded successfully:', data.role);
        return data;
      }
      
      console.warn('No profile found for user:', userId);
      return null;
    } catch (err) {
      console.error('Profile fetch failed:', err);
      return null;
    }
  };

  useEffect(() => {
    if (initialized) return;
    
    let mounted = true;
    
    const initializeAuth = async () => {
      if (!mounted) return;
      
      try {
        console.log('Initializing auth system...');
        authState.loading.set(true);
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
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
      } finally {
        if (mounted) {
          authState.loading.set(false);
          authState.initialized.set(true);
          setInitialized(true);
        }
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
        // Fetch profile with delay to avoid blocking
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
      subscription.unsubscribe();
    };
  }, [initialized]);

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
