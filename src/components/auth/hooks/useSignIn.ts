import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { observable } from '@legendapp/state';
import type { SignInFormValues } from '../schemas/signInSchema';

const signInState = observable({
  loading: false,
  attempts: 0,
  isFirstUserChecked: false,
  isFirstUser: false
});

export function useSignIn() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const checkFirstUser = async () => {
    if (signInState.isFirstUserChecked.get()) {
      return signInState.isFirstUser.get();
    }

    signInState.loading.set(true);
    try {
      console.log("Checking if first user exists...");
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error("Error checking first user:", error);
        return false;
      }
      
      console.log("Profile count:", count);
      const isFirst = count === 0;
      
      signInState.isFirstUser.set(isFirst);
      signInState.isFirstUserChecked.set(true);
      
      if (isFirst) {
        console.log("No profiles found, directing to first user signup");
        navigate('/signup', { state: { isFirstUser: true }, replace: true });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error checking first user:", error);
      return false;
    } finally {
      signInState.loading.set(false);
    }
  };

  const handleSignIn = async (values: SignInFormValues) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error("No user returned after sign in");
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
        description: error.message || "Failed to sign in",
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
