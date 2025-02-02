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

      if (error) throw error;
      
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
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (role === 'company_admin' && companyName && user) {
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .insert({
            name: companyName,
            subscription_type: subscriptionType || 'trial',
            trial_start_date: new Date().toISOString(),
            trial_end_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
            created_by: user.id,
          })
          .select()
          .single();

        if (companyError) throw companyError;

        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            company_id: company.id,
            role: role,
          })
          .eq('id', user.id);

        if (profileError) throw profileError;
      }

      toast({
        title: "Success!",
        description: "Please check your email to verify your account.",
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