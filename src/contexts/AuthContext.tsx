
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

let authInitialized = false;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { toast } = useToast();

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
      
      // Add retries for profile fetching
      let retries = 3;
      while (retries > 0) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
      
        if (error) {
          console.error('Profile fetch error:', error);
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
          return null;
        }
        
        if (data) {
          // Fetch user role from user_roles table
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userId)
            .order('role')
            .limit(1)
            .maybeSingle();
          
          const userRole = roleData?.role || 'driver';
          console.log('Profile loaded successfully with role:', userRole);
          return { ...data, role: userRole };
        }
        
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      console.warn('No profile found for user after retries:', userId);
      return null;
    } catch (err) {
      console.error('Profile fetch failed:', err);
      return null;
    }
  };

  useEffect(() => {
    if (authInitialized) {
      console.log('Auth already initialized, skipping...');
      return;
    }
    
    let mounted = true;
    
    const initializeAuth = async () => {
      if (!mounted || authInitialized) return;
      
      try {
        console.log('Initializing auth system...');
        authInitialized = true;
        authState.loading.set(true);
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
        } else if (session?.user && mounted) {
          console.log('Found existing session for user:', session.user.id);
          authState.user.set(session.user);
          
          // Fetch profile with delay to avoid race conditions
          setTimeout(async () => {
            if (!mounted) return;
            const profileData = await fetchUserProfile(session.user.id);
            if (mounted) {
              authState.profile.set(profileData);
            }
          }, 500);
        } else {
          console.log('No existing session found');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        if (mounted) {
          authState.loading.set(false);
          authState.initialized.set(true);
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
        }, 200);
      }
    });

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

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
