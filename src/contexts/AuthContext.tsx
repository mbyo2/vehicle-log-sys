import { createContext, useContext, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { enableReactTracking } from "@legendapp/state/config/enableReactTracking";
import { authState } from './auth/AuthState';
import { useAuthActions } from './auth/useAuthActions';

// Enable React tracking for Legend State
enableReactTracking({
  auto: true
});

interface AuthContextType {
  user: typeof authState.user.get;
  profile: typeof authState.profile.get;
  signUp: ReturnType<typeof useAuthActions>['signUp'];
  signOut: ReturnType<typeof useAuthActions>['signOut'];
  loading: typeof authState.loading.get;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { getProfile, signUp, signOut } = useAuthActions();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        authState.user.set(session?.user ?? null);
        
        if (session?.user) {
          await getProfile(session.user.id);
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
        await getProfile(session.user.id);
        if (authState.profile.get()?.role === 'super_admin') {
          navigate('/companies');
        } else if (authState.profile.get()?.role === 'company_admin') {
          navigate('/fleet');
        } else {
          navigate('/documents');
        }
      } else {
        authState.profile.set(null);
        navigate('/signin');
      }
      authState.loading.set(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, getProfile]);

  return (
    <AuthContext.Provider 
      value={{ 
        user: authState.user.get(), 
        profile: authState.profile.get(), 
        signUp, 
        signOut, 
        loading: authState.loading.get() 
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