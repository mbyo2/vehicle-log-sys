import { createContext, useContext, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, UserRole } from '@/types/auth';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { observable } from '@legendapp/state';
import { enableReactTracking } from "@legendapp/state/config/enableReactTracking";

// Enable React tracking for Legend State
enableReactTracking({
  auto: true
});

// Create observable state
const authState = observable({
  user: null as User | null,
  profile: null as UserProfile | null,
  loading: true,
  initialized: false
});

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  signUp: (email: string, password: string, role: string, fullName: string, companyName?: string, subscriptionType?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check active sessions and get user profile
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

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session);
      
      authState.loading.set(true);
      authState.user.set(session?.user ?? null);

      if (session?.user) {
        await getProfile(session.user.id);
        // Redirect based on role
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
  }, [navigate]);

  async function getProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      if (data) {
        const userProfile: UserProfile = {
          id: data.id,
          email: data.email,
          role: data.role as UserRole,
          full_name: data.full_name || undefined,
          company_id: data.company_id || undefined
        };
        authState.profile.set(userProfile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      authState.loading.set(false);
    }
  }

  const signUp = async (email: string, password: string, role: string, fullName: string, companyName?: string, subscriptionType?: string) => {
    try {
      authState.loading.set(true);
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (role === 'company_admin' && companyName && user) {
        // Create company
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .insert({
            name: companyName,
            subscription_type: subscriptionType || 'trial',
            trial_start_date: new Date().toISOString(),
            trial_end_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
            created_by: user.id,
          })
          .select()
          .single();

        if (companyError) throw companyError;

        // Update profile with company_id
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            company_id: company.id,
            role: role as UserRole,
          })
          .eq('id', user.id);

        if (profileError) throw profileError;
      }

      toast({
        title: "Success!",
        description: "Please check your email to verify your account.",
      });
      
      navigate('/signin');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      authState.loading.set(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      authState.loading.set(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "Successfully signed in.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      authState.loading.set(false);
    }
  };

  const signOut = async () => {
    try {
      authState.loading.set(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Signed out",
        description: "Successfully signed out.",
      });
      navigate('/signin');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      authState.loading.set(false);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user: authState.user.get(), 
        profile: authState.profile.get(), 
        signUp, 
        signIn, 
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
}