
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
  const [initError, setInitError] = useState<string | null>(null);

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
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('Found existing session for user:', session.user.id);
          authState.user.set(session.user);
          
          try {
            const { data: profileData, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();
          
            if (error && !error.message.includes("profiles")) {
              console.error('Error fetching profile:', error);
            }
            
            if (profileData) {
              console.log('Profile found:', profileData.role);
              authState.profile.set(profileData);
            } else {
              console.warn('No profile found for user:', session.user.id);
            }
          } catch (profileError) {
            console.error('Failed to fetch profile:', profileError);
            // Continue with auth flow even if profile fetch fails
          }
        } else {
          console.log('No session found');
        }
        setInitialized(true);
      } catch (error) {
        console.error('Error initializing auth:', error);
        setInitError('Failed to initialize authentication');
        // Ensure we mark as initialized even on error
        setInitialized(true);
        authState.loading.set(false);
      } finally {
        authState.loading.set(false);
        authState.initialized.set(true);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      authState.loading.set(true);
      authState.user.set(session?.user ?? null);

      if (session?.user) {
        try {
          // Use setTimeout to prevent potential deadlocks with Supabase auth state change handlers
          setTimeout(async () => {
            try {
              const { data: profileData, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();
              
              if (error && !error.message.includes("does not exist")) {
                console.error('Error fetching profile:', error);
              }
              
              authState.profile.set(profileData ?? null);
              
              if (profileData) {
                console.log('Profile loaded:', profileData.role);
              } else {
                console.warn('No profile found after auth state change');
              }
            } catch (error) {
              console.error('Error fetching profile:', error);
              authState.profile.set(null);
            } finally {
              authState.loading.set(false);
            }
          }, 0);
        } catch (error) {
          console.error('Error in auth state change handler:', error);
          authState.profile.set(null);
          authState.loading.set(false);
        }
      } else {
        authState.profile.set(null);
        authState.loading.set(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Show initialization error if there is one
  if (initialized && initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full p-6 bg-card rounded-lg border shadow-sm text-center">
          <h2 className="text-xl font-semibold mb-4">Authentication Error</h2>
          <p className="text-muted-foreground mb-4">{initError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

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
