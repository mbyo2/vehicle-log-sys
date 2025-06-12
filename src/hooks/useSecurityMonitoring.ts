
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SecurityEvent {
  eventType: string;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  eventData?: Record<string, any>;
}

interface ErrorEvent {
  errorType: string;
  errorMessage: string;
  stackTrace?: string;
  url?: string;
  errorData?: Record<string, any>;
}

export function useSecurityMonitoring() {
  const { user, profile } = useAuth();

  const logSecurityEvent = useMutation({
    mutationFn: async ({ eventType, riskLevel = 'low', eventData = {} }: SecurityEvent) => {
      const currentUser = user?.get();
      const currentProfile = profile?.get();
      
      const { data, error } = await supabase.rpc('log_security_event', {
        p_event_type: eventType,
        p_user_id: currentUser?.id || null,
        p_company_id: currentProfile?.company_id || null,
        p_ip_address: null, // Would be set by edge function in real implementation
        p_user_agent: navigator.userAgent,
        p_event_data: eventData,
        p_risk_level: riskLevel,
      });

      if (error) throw error;
      return data;
    },
  });

  const logError = useMutation({
    mutationFn: async ({ errorType, errorMessage, stackTrace, url, errorData = {} }: ErrorEvent) => {
      const currentUser = user?.get();
      const currentProfile = profile?.get();
      
      const { data, error } = await supabase.rpc('log_error', {
        p_error_type: errorType,
        p_error_message: errorMessage,
        p_stack_trace: stackTrace || null,
        p_user_id: currentUser?.id || null,
        p_company_id: currentProfile?.company_id || null,
        p_url: url || window.location.href,
        p_user_agent: navigator.userAgent,
        p_error_data: errorData,
      });

      if (error) throw error;
      return data;
    },
  });

  const createBackup = useMutation({
    mutationFn: async (backupType: string = 'manual') => {
      const currentProfile = profile?.get();
      
      const { data, error } = await supabase.rpc('create_backup', {
        p_company_id: currentProfile?.company_id || null,
        p_backup_type: backupType,
      });

      if (error) throw error;
      return data;
    },
  });

  // Helper functions for common security events
  const logLogin = (success: boolean, additionalData?: Record<string, any>) => {
    logSecurityEvent.mutate({
      eventType: success ? 'user_login_success' : 'user_login_failure',
      riskLevel: success ? 'low' : 'medium',
      eventData: { success, ...additionalData },
    });
  };

  const logLogout = () => {
    logSecurityEvent.mutate({
      eventType: 'user_logout',
      riskLevel: 'low',
    });
  };

  const logPasswordChange = () => {
    logSecurityEvent.mutate({
      eventType: 'password_change',
      riskLevel: 'medium',
    });
  };

  const logDataAccess = (resource: string, action: string) => {
    logSecurityEvent.mutate({
      eventType: 'data_access',
      riskLevel: 'low',
      eventData: { resource, action },
    });
  };

  const logSuspiciousActivity = (activity: string, details?: Record<string, any>) => {
    logSecurityEvent.mutate({
      eventType: 'suspicious_activity',
      riskLevel: 'high',
      eventData: { activity, ...details },
    });
  };

  return {
    logSecurityEvent: logSecurityEvent.mutate,
    logError: logError.mutate,
    createBackup: createBackup.mutate,
    // Helper functions
    logLogin,
    logLogout,
    logPasswordChange,
    logDataAccess,
    logSuspiciousActivity,
    // Status
    isLogging: logSecurityEvent.isPending || logError.isPending,
  };
}
