
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { authState } from './AuthState';

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

  const signUp = async (email: string, password: string, fullName: string, isFirstUser: boolean): Promise<AuthResult> => {
    try {
      setLoadingState(true);
      console.log("useAuthActions: Starting signup process with isFirstUser =", isFirstUser);
      
      // Determine the role based on whether this is the first user
      const role = isFirstUser ? 'super_admin' : 'company_admin';
      
      // If this is the first user, check if a super_admin already exists
      // But only if we can connect to the database successfully
      if (isFirstUser && !location.pathname.includes('first-setup')) {
        try {
          console.log("Checking if super_admin exists in profiles table...");
          const { count, error: countError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'super_admin');
            
          if (!countError && count && count > 0) {
            console.error("A super admin account already exists");
            return {
              success: false,
              error: "A super admin account already exists. Please sign in instead."
            };
          }
        } catch (countErr: any) {
          console.log("Error checking for super_admin:", countErr);
          // If the error is about the table not existing, we can proceed
          if (!countErr.message?.includes("does not exist") && countErr.code !== "42P01") {
            console.log("Continuing despite error - might be first setup");
            // Don't return error here, proceed with signup
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
      
      toast({
        title: 'Account created',
        description: 'Your account has been created successfully.',
      });

      // For first user setup, attempt to create the profiles table and insert the admin
      if (isFirstUser && data.user) {
        console.log("Attempting to handle first user setup manually if needed");
        
        try {
          // Try to create the profiles table if it doesn't exist
          const { error: createTableError } = await supabase.rpc('create_profiles_table_if_not_exists');
          
          if (createTableError && !createTableError.message.includes('does not exist')) {
            console.error("Error creating profiles table:", createTableError);
          }
          
          // Try to insert the profile manually if needed
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: email,
              full_name: fullName,
              role: 'super_admin'
            })
            .single();
            
          if (insertError && !insertError.message.includes('already exists')) {
            console.error("Error inserting profile:", insertError);
          }
        } catch (setupErr) {
          console.error("Error during manual first-user setup:", setupErr);
          // Continue despite errors - the auth trigger might handle it
        }
      }

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

            if (profileError && !profileError.message?.includes("does not exist")) {
              console.error('Error fetching profile:', profileError);
            } else if (profileData) {
              authState.profile.set(profileData);
            }

            console.log("Auto login successful, navigating to dashboard");
            navigate('/dashboard');
            return {
              success: true,
              user: signInData.user
            };
          }
        } catch (loginErr: any) {
          console.error("Error during auto-login:", loginErr);
          return {
            success: false,
            error: `Account created but auto-login failed: ${loginErr.message}`
          };
        }
      }
      
      // If we didn't auto-login or it failed, return success but without user
      return {
        success: true
      };
      
    } catch (error: any) {
      console.error('Error signing up:', error.message);
      toast({
        variant: "destructive",
        title: 'Error',
        description: error.message,
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
