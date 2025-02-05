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
      title: "Welcome!",
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
        // Handle first user signup (super admin)
        const { data: { user }, error } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            data: {
              role: 'super_admin',
              full_name: 'Super Admin'
            }
          }
        });

        if (error) {
          if (error.message.includes("already registered")) {
            // If user exists, try to sign in instead
            return await handleSignIn(values);
          }
          throw error;
        }

        if (user) {
          toast({
            title: "Super Admin Account Created",
            description: "Please check your email to verify your account.",
          });
          navigate('/signin');
          return;
        }
      } else {
        // Handle regular sign in
        await handleSignIn(values);
      }
    } catch (error: any) {
      console.error("Sign in error:", error);
      toast({
        variant: "destructive",
        title: "Error signing in",
        description: error.message,
      });
      signInState.attempts.set(prev => prev + 1);
    } finally {
      signInState.loading.set(false);
    }
  };

  const handleSignIn = async (values: SignInFormValues) => {
    const { data: { user }, error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) throw error;

    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('two_factor_enabled, role, company_id')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      if (profile?.two_factor_enabled) {
        signInState.tempEmail.set(values.email);
        signInState.showTwoFactor.set(true);
        return;
      }

      handleSuccessfulLogin(profile, values.rememberMe);
    }
  };

  return {
    state: signInState,
    handleSubmit,
    checkFirstUser,
    handleSuccessfulLogin
  };
}