import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SecurityUtils } from '@/lib/security';
import { useToast } from '@/hooks/use-toast';

interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export function useSecureAuth() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Check if user has 2FA enabled
  useEffect(() => {
    checkTwoFactorStatus();
  }, []);

  const checkTwoFactorStatus = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('two_factor_enabled')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();
      
      setTwoFactorEnabled(profile?.two_factor_enabled || false);
    } catch (error) {
      console.error('Error checking 2FA status:', error);
    }
  };

  const enableTwoFactor = async (): Promise<TwoFactorSetup | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('setup-totp', {
        body: {}
      });

      if (error) throw error;

      return data as TwoFactorSetup;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to enable two-factor authentication",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const verifyTwoFactor = async (code: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-totp', {
        body: { code }
      });

      if (error) throw error;

      if (data?.success) {
        setTwoFactorEnabled(true);
        toast({
          title: "Success",
          description: "Two-factor authentication enabled successfully",
        });
        return true;
      }
      return false;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to verify two-factor authentication",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const disableTwoFactor = async (): Promise<boolean> => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('disable-totp', {
        body: {}
      });

      if (error) throw error;

      setTwoFactorEnabled(false);
      toast({
        title: "Success",
        description: "Two-factor authentication disabled",
      });
      return true;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to disable two-factor authentication",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    setLoading(true);
    try {
      // Validate new password
      const validation = SecurityUtils.validatePassword(newPassword);
      if (!validation.isValid) {
        toast({
          variant: "destructive",
          title: "Invalid Password",
          description: validation.feedback.join(', '),
        });
        return false;
      }

      // Rate limit password changes
      const user = (await supabase.auth.getUser()).data.user;
      if (user?.email) {
        const canProceed = await supabase.rpc('check_rate_limit', {
          p_identifier: user.email,
          p_action_type: 'password_change',
          p_max_attempts: 3,
          p_window_minutes: 60
        });

        if (!canProceed.data) {
          toast({
            variant: "destructive",
            title: "Rate Limited",
            description: "Too many password change attempts. Please try again in 1 hour.",
          });
          return false;
        }
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password updated successfully",
      });
      return true;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update password",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    twoFactorEnabled,
    loading,
    enableTwoFactor,
    verifyTwoFactor,
    disableTwoFactor,
    changePassword,
    checkTwoFactorStatus
  };
}