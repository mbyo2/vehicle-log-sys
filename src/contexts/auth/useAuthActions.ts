
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

  const signUp = async (email: string, password: string, fullName: string, isFirstUser: boolean, companyName?: string, subscriptionType?: string): Promise<AuthResult> => {
    try {
      setLoadingState(true);
      console.log("Starting signup process with isFirstUser =", isFirstUser);
      
      // Prepare metadata for the user
      const metadata: any = {
        full_name: fullName,
      };

      // For first user (super admin), don't add role to metadata - let the trigger handle it
      if (!isFirstUser) {
        metadata.role = 'company_admin';
        if (companyName) {
          metadata.company_name = companyName;
        }
        if (subscriptionType) {
          metadata.subscription_type = subscriptionType;
        }
      }
      
      console.log("Creating account with metadata:", metadata);
      
      // Sign up the user with metadata that will be used by the trigger
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        },
      });

      if (error) {
        console.error("Signup error:", error);
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
        isFirstUser,
        timestamp: new Date().toISOString()
      });

      // For the first user (super admin), they should get automatically signed in
      if (isFirstUser && data.session) {
        console.log("First user created and signed in automatically");
        
        // Set the auth state
        authState.user.set(data.user);
        
        // Wait for the database trigger to create the profile
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Try to fetch the profile multiple times
        let profileAttempts = 0;
        let profile = null;
        
        while (profileAttempts < 5 && !profile) {
          try {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .single();

            if (profileData) {
              profile = profileData;
              authState.profile.set(profile);
              console.log('Super admin profile loaded:', profile);
              break;
            } else {
              console.log('Profile not ready yet, attempt', profileAttempts + 1);
              profileAttempts++;
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } catch (profileErr) {
            console.error('Error fetching profile attempt', profileAttempts + 1, ':', profileErr);
            profileAttempts++;
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        if (profile) {
          toast({
            title: 'Welcome!',
            description: 'Super admin account created successfully.',
          });
          navigate('/dashboard');
        } else {
          console.error('Could not load profile after multiple attempts');
          toast({
            title: 'Account created',
            description: 'Please sign in with your new super admin account.',
          });
          navigate('/signin');
        }
      } else {
        // For regular users or if first user didn't get auto-signed in
        const message = isFirstUser 
          ? 'Super admin account created. Please sign in to continue.' 
          : companyName 
            ? `Account and company "${companyName}" created successfully. Please sign in.`
            : 'Your account has been created successfully. Please sign in.';
            
        toast({
          title: 'Account created',
          description: message,
        });
        navigate('/signin');
      }
      
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
