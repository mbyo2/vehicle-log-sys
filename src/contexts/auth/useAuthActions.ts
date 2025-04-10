
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
      
      // If this is the first user setup, try to create the profiles table first
      if (isFirstUser) {
        console.log("Attempting to create profiles table for first user...");
        try {
          // Call the edge function to set up the database
          const createProfilesResponse = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-profiles-table`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
              }
            }
          );
          
          if (!createProfilesResponse.ok) {
            const result = await createProfilesResponse.json();
            console.warn("Warning: Database setup might not be complete:", result);
            toast({
              variant: "default",
              title: 'Database Setup',
              description: 'Setup operation completed with potential issues. Continuing with signup.',
            });
          } else {
            console.log("Database setup successful");
          }
        } catch (setupErr) {
          console.error("Error during database setup:", setupErr);
          toast({
            variant: "default",
            title: 'Database Setup',
            description: 'Unable to connect to setup service. Continuing with signup.',
          });
          // Continue despite errors - we'll try to create the user anyway
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
          // Wait a moment for the database trigger to run
          await new Promise(resolve => setTimeout(resolve, 1000));
          
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
            toast({
              variant: "default",
              title: 'Account Created',
              description: 'Your account was created, but automatic login failed. Please sign in manually.',
            });
            
            // Navigate to sign in page
            setTimeout(() => navigate('/signin'), 1500);
            
            return {
              success: true
            };
          } 
          
          if (signInData.user) {
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
            
            toast({
              title: 'Welcome',
              description: 'You have been logged in as the Super Admin.',
            });
            
            navigate('/dashboard');
            return {
              success: true,
              user: signInData.user
            };
          }
        } catch (loginErr: any) {
          console.error("Error during auto-login:", loginErr);
          return {
            success: true,
            error: `Account created but auto-login failed. Please sign in manually.`
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
