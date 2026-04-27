
import { createContext, useContext, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { enableReactTracking } from "@legendapp/state/config/enableReactTracking";
import { authState } from './auth/AuthState';
import { fetchUserProfile } from './auth/fetchUserProfile';
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

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      authState.user.set(null);
      authState.profile.set(null);
      authState.loading.set(false);
      toast({ title: "Logged out", description: "You have been successfully logged out" });
      navigate('/signin');
    } catch (error) {
      console.error('[Auth] Sign out error:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to sign out" });
    }
  };

  useEffect(() => {
    let mounted = true;

    // Step 1: Restore session from storage
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (!mounted) return;
      
      if (error) {
        console.error('[Auth] getSession error:', error);
        authState.loading.set(false);
        return;
      }

      if (session?.user) {
        console.log('[Auth] Restored session for:', session.user.id);
        authState.user.set(session.user);
        
        try {
          const profileData = await fetchUserProfile(session.user.id);
          if (mounted) {
            authState.profile.set(profileData);
          }
        } catch (err) {
          console.error('[Auth] Profile fetch error:', err);
        }
      } else {
        console.log('[Auth] No existing session');
      }

      if (mounted) {
        authState.loading.set(false);
      }
    });

    // Step 2: Listen for subsequent auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        console.log('[Auth] State changed:', event);

        if (event === 'SIGNED_OUT' || !session) {
          authState.user.set(null);
          authState.profile.set(null);
          authState.loading.set(false);
          return;
        }

        authState.user.set(session.user);

        // Re-fetch profile on any auth state change that yields a session
        // (SIGNED_IN, TOKEN_REFRESHED, USER_UPDATED, INITIAL_SESSION).
        // We only skip the very first INITIAL_SESSION since the getSession()
        // bootstrap above already handles it.
        if (event !== 'INITIAL_SESSION') {
          fetchUserProfile(session.user.id).then(profileData => {
            if (mounted && profileData) {
              authState.profile.set(profileData);
            }
            if (mounted) {
              authState.loading.set(false);
            }
          }).catch(err => {
            console.error('[Auth] Profile re-fetch error:', err);
            if (mounted) authState.loading.set(false);
          });
        }
      }
    );

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
