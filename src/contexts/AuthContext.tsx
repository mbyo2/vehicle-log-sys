
import { createContext, useContext, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { enableReactTracking } from "@legendapp/state/config/enableReactTracking";
import { authState } from './auth/AuthState';
import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '@/types/auth';

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
  const location = useLocation();

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      authState.user.set(null);
      authState.profile.set(null);
      navigate('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          authState.user.set(session.user);
          
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
          
          if (error) {
            console.error('Error fetching profile:', error);
          }
          
          if (profileData) {
            authState.profile.set(profileData);
          } else {
            console.warn('No profile found for user:', session.user.id);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        authState.loading.set(false);
        authState.initialized.set(true);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session);
      
      authState.loading.set(true);
      authState.user.set(session?.user ?? null);

      if (session?.user) {
        try {
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
          
          if (error) {
            console.error('Error fetching profile:', error);
          }
          
          authState.profile.set(profileData ?? null);
        } catch (error) {
          console.error('Error fetching profile:', error);
          authState.profile.set(null);
        }
      } else {
        authState.profile.set(null);
      }
      
      authState.loading.set(false);
    });

    return () => {
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
