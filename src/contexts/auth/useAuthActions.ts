
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
        throw error;
      }

      if (data?.user) {
        console.log('Sign in successful for user:', data.user.id);
        authState.user.set(data.user);
        authState.loading.set(true);

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
      console.log("useAuthActions: Starting signup process with isFirstUser =", isFirstUser);
      
      // If this is the first user setup, ensure database is ready
      if (isFirstUser) {
        console.log("Setting up database for first user...");
        try {
          const { error: setupError } = await supabase.functions.invoke('create-profiles-table', {
            body: { force_setup: true }
          });
          
          if (setupError) {
            console.warn("Database setup warning:", setupError);
          }
        } catch (setupErr) {
          console.warn("Database setup failed, continuing with signup:", setupErr);
        }
      }
      
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
      
      // For first user setup, attempt automatic login
      if (isFirstUser && data.user) {
        console.log("First user created, attempting automatic login");
        
        try {
          // Wait a moment for the database trigger to create the profile
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          
          if (signInError) {
            console.error("Auto login error:", signInError);
            toast({
              title: 'Account Created',
              description: 'Your account was created successfully. Please sign in.',
            });
            
            setTimeout(() => navigate('/signin'), 1500);
            return { success: true };
          } 
          
          if (signInData.user) {
            // Set auth state for logged in user
            authState.user.set(signInData.user);
            
            // Fetch user profile data
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', signInData.user.id)
              .single();

            if (profileError) {
              console.error('Error fetching profile after signup:', profileError);
              toast({
                title: 'Account Created',
                description: 'Account created but profile loading failed. Please sign in.',
              });
              navigate('/signin');
              return { success: true };
            } else if (profileData) {
              authState.profile.set(profileData);
              console.log("Auto login successful, navigating to default route");
              
              const defaultRoute = DEFAULT_ROUTES[profileData.role] || '/dashboard';
              navigate(defaultRoute);
              
              toast({
                title: 'Welcome!',
                description: `You have been logged in as ${profileData.role.replace('_', ' ')}.`,
              });
              
              return {
                success: true,
                user: signInData.user
              };
            }
          }
        } catch (loginErr: any) {
          console.error("Error during auto-login:", loginErr);
          toast({
            title: 'Account Created',
            description: 'Account created successfully. Please sign in.',
          });
          navigate('/signin');
          return { success: true };
        }
      }
      
      // For non-first users or if auto-login failed
      toast({
        title: 'Account created',
        description: 'Your account has been created successfully. Please sign in.',
      });
      
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
