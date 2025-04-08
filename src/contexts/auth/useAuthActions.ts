
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { authState } from './AuthState';

export const useAuthActions = () => {
  const [loadingState, setLoadingState] = useState<boolean>(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const signIn = async (email: string, password: string) => {
    try {
      setLoadingState(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data?.user) {
        toast({
          title: 'Success',
          description: 'Signed in successfully.',
        });
        
        authState.user.set(data.user);
        authState.loading.set(true);

        // Fetch user profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
        } else if (profileData) {
          authState.profile.set(profileData);
        }

        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Error signing in:', error.message);
      toast({
        variant: "destructive",
        title: 'Error',
        description: error.message,
      });
    } finally {
      setLoadingState(false);
      authState.loading.set(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, isFirstUser: boolean) => {
    try {
      setLoadingState(true);
      console.log("useAuthActions: Starting signup process with isFirstUser =", isFirstUser);
      
      // Determine the role based on whether this is the first user
      const role = isFirstUser ? 'super_admin' : 'company_admin';
      
      // If this is the first user, check if a super_admin already exists
      if (isFirstUser) {
        try {
          console.log("Checking if super_admin exists in profiles table...");
          const { count, error: countError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'super_admin');
            
          if (!countError && count && count > 0) {
            console.error("A super admin account already exists");
            throw new Error("A super admin account already exists. Please sign in instead.");
          }
        } catch (countErr: any) {
          console.log("Error checking for super_admin:", countErr);
          // If the error is about the table not existing, we can proceed
          if (!countErr.message?.includes("does not exist")) {
            throw countErr;
          }
        }
      }
      
      console.log("Creating account with role:", role);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role, // This will be used by the handle_new_user trigger
          },
        },
      });

      if (error) {
        console.error("Signup error:", error);
        throw error;
      }

      if (!data.user) {
        console.error("No user returned from signUp");
        throw new Error("Failed to create user account");
      }

      console.log("Account created successfully:", data.user.id);
      
      toast({
        title: 'Account created',
        description: 'Your account has been created successfully.',
      });

      // If this is the first user, they'll be automatically verified and logged in
      if (isFirstUser && data.user) {
        console.log("First user created, logging in automatically");
        
        // For first user, attempt automatic login
        try {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          
          if (signInError) {
            console.error("Auto login error:", signInError);
            // Don't throw here, just log the error
          } else if (signInData.user) {
            // Set auth state for logged in user
            authState.user.set(signInData.user);
            
            // Fetch user profile data
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', signInData.user.id)
              .maybeSingle();

            if (profileError) {
              console.error('Error fetching profile:', profileError);
            } else if (profileData) {
              authState.profile.set(profileData);
            }

            console.log("Auto login successful, navigating to dashboard");
            navigate('/dashboard');
            return;
          }
        } catch (loginErr) {
          console.error("Error during auto-login:", loginErr);
        }
      }
      
      // If we didn't auto-login or it failed, go to signin page
      navigate('/signin');
      
    } catch (error: any) {
      console.error('Error signing up:', error.message);
      toast({
        variant: "destructive",
        title: 'Error',
        description: error.message,
      });
      throw error; // Re-throw to allow the component to handle the error
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
