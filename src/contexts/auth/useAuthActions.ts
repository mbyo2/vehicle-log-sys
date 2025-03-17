
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { authState } from './AuthState';

export function useAuthActions() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const getProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        return;
      }
      
      if (data) {
        authState.profile.set({
          id: data.id,
          email: data.email,
          role: data.role,
          full_name: data.full_name || undefined,
          company_id: data.company_id || undefined
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      authState.loading.set(false);
    }
  };

  const signUp = async (email: string, password: string, role: string, fullName: string, companyName?: string, subscriptionType?: string) => {
    try {
      authState.loading.set(true);
      
      // Ensure role is set in the user metadata
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
            company_name: companyName,
            subscription_type: subscriptionType
          },
        },
      });

      if (signUpError) throw signUpError;

      if (!data.user) {
        throw new Error("Failed to create user account");
      }

      toast({
        title: "Success!",
        description: "Please check your email to verify your account.",
      });
      
      navigate('/signin');
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      authState.loading.set(false);
    }
  };

  const signOut = async () => {
    try {
      authState.loading.set(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Signed out",
        description: "Successfully signed out.",
      });
      navigate('/signin');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      authState.loading.set(false);
    }
  };

  return {
    getProfile,
    signUp,
    signOut
  };
}
