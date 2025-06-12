
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { authState } from './AuthState';
import { DEFAULT_ROUTES } from '@/components/auth/ProtectedRoute';

interface AuthResult {
  success: boolean;
  error?: string;
  user?: any;
}

// Helper function to log security events
const logSecurityEvent = async (eventType: string, riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low', eventData: Record<string, any> = {}) => {
  try {
    await supabase.rpc('log_security_event', {
      p_event_type: eventType,
      p_user_id: null,
      p_company_id: null,
      p_ip_address: null,
      p_user_agent: navigator.userAgent,
      p_event_data: eventData,
      p_risk_level: riskLevel,
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
};

export const useAuthActions = () => {
  const [loadingState, setLoadingState] = useState<boolean>(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const signIn = async (email: string, password: string) => {
    try {
      setLoadingState(true);
      console.log('Attempting to sign in user:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Log failed login attempt
        await logSecurityEvent('user_login_failure', 'medium', {
          email,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        throw error;
      }

      if (data?.user) {
        console.log('Sign in successful for user:', data.user.id);
        authState.user.set(data.user);
        authState.loading.set(true);

        // Log successful login
        await logSecurityEvent('user_login_success', 'low', {
          user_id: data.user.id,
          email: data.user.email,
          timestamp: new Date().toISOString()
        });

        // Fetch user profile data with retry
        let retries = 3;
        let profileData = null;
        
        while (retries > 0) {
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .single();

            if (profileError) {
              console.error('Error fetching profile:', profileError);
              if (retries === 1) {
                throw new Error('Profile not found. Please contact support.');
              }
            } else if (profile) {
              console.log('Profile loaded for role:', profile.role);
              profileData = profile;
              authState.profile.set(profile);
              break;
            }
            
            retries--;
            if (retries > 0) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } catch (err) {
            retries--;
            if (retries === 0) {
              throw err;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        if (profileData) {
          const defaultRoute = DEFAULT_ROUTES[profileData.role] || '/dashboard';
          console.log('Navigating to default route:', defaultRoute);
          navigate(defaultRoute);
        } else {
          throw new Error('Unable to load user profile');
        }

        toast({
          title: 'Success',
          description: 'Signed in successfully.',
        });
      }
    } catch (error: any) {
      console.error('Error signing in:', error.message);
      toast({
        variant: "destructive",
        title: 'Sign In Error',
        description: error.message || 'Failed to sign in. Please check your credentials.',
      });
      throw error;
    } finally {
      setLoadingState(false);
      authState.loading.set(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, isFirstUser: boolean): Promise<AuthResult> => {
    try {
      setLoadingState(true);
      console.log("Starting signup process with isFirstUser =", isFirstUser);
      
      // Determine the role based on whether this is the first user
      const role = isFirstUser ? 'super_admin' : 'company_admin';
      
      console.log("Creating account with role:", role);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          },
        },
      });

      if (error) {
        console.error("Signup error:", error);
        // Log failed signup attempt
        await logSecurityEvent('user_signup_failure', 'medium', {
          email,
          error: error.message,
          isFirstUser,
          timestamp: new Date().toISOString()
        });
        return {
          success: false,
          error: error.message
        };
      }

      if (!data.user) {
        console.error("No user returned from signUp");
        return {
          success: false,
          error: "Failed to create user account"
        };
      }

      console.log("Account created successfully:", data.user.id);
      
      // Log successful signup
      await logSecurityEvent('user_signup_success', 'low', {
        user_id: data.user.id,
        email: data.user.email,
        role,
        isFirstUser,
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: 'Account created',
        description: 'Your account has been created successfully. Please sign in.',
      });
      
      // Navigate to sign in
      navigate('/signin');
      
      return { success: true };
      
    } catch (error: any) {
      console.error('Error signing up:', error.message);
      toast({
        variant: "destructive",
        title: 'Registration Error',
        description: error.message || 'Failed to create account.',
      });
      return {
        success: false,
        error: error.message
      };
    } finally {
      setLoadingState(false);
    }
  };

  const signOut = async () => {
    try {
      setLoadingState(true);
      
      // Log logout before clearing state
      const currentUser = authState.user.get();
      if (currentUser) {
        await logSecurityEvent('user_logout', 'low', {
          user_id: currentUser.id,
          timestamp: new Date().toISOString()
        });
      }
      
      await supabase.auth.signOut();
      
      // Clear the auth state
      authState.user.set(null);
      authState.profile.set(null);
      
      navigate('/signin');
      
      toast({
        title: 'Signed out',
        description: 'You have been signed out successfully.',
      });
    } catch (error: any) {
      console.error('Error signing out:', error.message);
      toast({
        variant: "destructive",
        title: 'Error',
        description: error.message,
      });
    } finally {
      setLoadingState(false);
    }
  };

  return {
    signIn,
    signUp,
    signOut,
    loading: loadingState,
  };
};
