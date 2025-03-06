
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { observable } from '@legendapp/state';
import type { SignInFormValues } from '../schemas/signInSchema';

const signInState = observable({
  loading: false,
  attempts: 0,
});

export function useSignIn() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const checkFirstUser = async () => {
    // Skip the check if we're having database issues
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });
      
      if (error) {
        console.error("Error checking first user:", error);
        return; // Just return without redirecting on error
      }
      
      if (count === 0) {
        navigate('/signup', { state: { isFirstUser: true }, replace: true });
      }
    } catch (error: any) {
      console.error("Error checking first user:", error);
      // Don't show error toast for this operation, just log it
      // The user can still try to sign in
    }
  };

  const handleSignIn = async (values: SignInFormValues) => {
    try {
      const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (signInError) throw signInError;

      if (!user) {
        throw new Error("No user returned after sign in");
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      toast({
        title: "Welcome back!",
        description: "Successfully signed in",
      });

      navigate('/dashboard', { replace: true });
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
        description: "Please try again later",
      });
      return;
    }

    signInState.loading.set(true);
    try {
      await handleSignIn(values);
    } catch (error: any) {
      console.error("Authentication error:", error);
      signInState.attempts.set(prev => prev + 1);
      
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: error.message,
      });
    } finally {
      signInState.loading.set(false);
    }
  };

  return {
    state: signInState,
    handleSubmit,
    checkFirstUser,
  };
}
