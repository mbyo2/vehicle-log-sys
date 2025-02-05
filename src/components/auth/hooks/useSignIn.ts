import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { observable } from '@legendapp/state';
import type { SignInFormValues } from '../schemas/signInSchema';

const signInState = observable({
  loading: false,
  resetPasswordOpen: false,
  attempts: 0,
  showTwoFactor: false,
  tempEmail: "",
  isFirstUser: false
});

export function useSignIn() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const checkFirstUser = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      if (error) throw error;
      signInState.isFirstUser.set(!data || data.length === 0);
    } catch (error) {
      console.error("Error checking first user:", error);
    }
  };

  const handleSuccessfulLogin = (profile: any, rememberMe: boolean) => {
    if (rememberMe) {
      localStorage.setItem("rememberMe", "true");
    }
    
    toast({
      title: "Welcome back!",
      description: "Successfully signed in",
    });

    const from = location.state?.from?.pathname || getDefaultRoute(profile.role);
    navigate(from, { replace: true });
  };

  const getDefaultRoute = (role: string) => {
    switch (role) {
      case 'super_admin':
        return '/companies';
      case 'company_admin':
        return '/fleet';
      case 'supervisor':
        return '/fleet';
      case 'driver':
        return '/documents';
      default:
        return '/documents';
    }
  };

  const handleSignIn = async (values: SignInFormValues) => {
    try {
      const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (signInError) {
        if (signInError.message.includes("Invalid login credentials")) {
          throw new Error("Invalid email or password");
        }
        throw signInError;
      }

      if (!user) {
        throw new Error("No user returned after sign in");
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, company_id, two_factor_enabled')
        .eq('id', user.id)
        .single();

      if (profileError) {
        throw new Error("Error fetching user profile");
      }

      if (!profile) {
        throw new Error("No profile found for user");
      }

      if (profile.two_factor_enabled) {
        signInState.tempEmail.set(values.email);
        signInState.showTwoFactor.set(true);
        return;
      }

      handleSuccessfulLogin(profile, values.rememberMe);
    } catch (error: any) {
      console.error("Sign in error:", error);
      throw error;
    }
  };

  const handleSubmit = async (values: SignInFormValues) => {
    if (signInState.attempts.get() >= 5) {
      toast({
        variant: "destructive",
        title: "Too many attempts",
        description: "Please try again later or reset your password",
      });
      return;
    }

    signInState.loading.set(true);
    try {
      if (signInState.isFirstUser.get()) {
        const { data: { user }, error: signUpError } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            data: {
              role: 'super_admin'
            }
          }
        });

        if (signUpError) throw signUpError;

        if (user) {
          toast({
            title: "Account Created",
            description: "Please check your email to verify your account.",
          });
          navigate('/signin');
        }
      } else {
        await handleSignIn(values);
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      signInState.attempts.set(prev => prev + 1);
      
      let errorMessage = "An error occurred during authentication";
      if (error.message === "Invalid email or password") {
        errorMessage = error.message;
      } else if (error.message.includes("User already registered")) {
        errorMessage = "This email is already registered. Please sign in instead.";
      }

      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: errorMessage,
      });
    } finally {
      signInState.loading.set(false);
    }
  };

  return {
    state: signInState,
    handleSubmit,
    checkFirstUser,
    handleSuccessfulLogin
  };
}