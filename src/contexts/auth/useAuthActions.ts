
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { authState } from './AuthState';
import { fetchUserProfile } from './fetchUserProfile';
import { DEFAULT_ROUTES } from '@/components/auth/ProtectedRoute';
import { SecurityUtils } from '@/lib/security';

interface AuthResult {
  success: boolean;
  error?: string;
  user?: any;
}

const logSecurityEvent = async (eventType: string, riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low', eventData: Record<string, any> = {}) => {
  try {
    await supabase.rpc('log_security_event', {
      p_event_type: eventType,
      p_user_id: eventData.user_id || null,
      p_company_id: null,
      p_ip_address: null,
      p_user_agent: navigator.userAgent,
      p_event_data: {
        ...eventData,
        timestamp: new Date().toISOString(),
        url: window.location.href
      },
      p_risk_level: riskLevel,
    });
  } catch (error) {
    console.error('[Auth] Failed to log security event:', error);
  }
};

export const useAuthActions = () => {
  const [loadingState, setLoadingState] = useState<boolean>(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const signIn = async (email: string, password: string) => {
    try {
      setLoadingState(true);
      console.log('[Auth] Signing in:', email);

      // Rate limiting check
      const canProceed = await supabase.rpc('check_rate_limit', {
        p_identifier: email,
        p_action_type: 'login',
        p_max_attempts: 5,
        p_window_minutes: 15
      });

      if (!canProceed.data) {
        await logSecurityEvent('rate_limit_exceeded', 'high', { email, action: 'login' });
        throw new Error("Too many login attempts. Please try again in 15 minutes.");
      }

      // Input validation
      const emailValidation = SecurityUtils.validateEmail(email);
      if (!emailValidation.isValid) {
        throw new Error("Invalid email format");
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailValidation.sanitized,
        password,
      });

      if (error) {
        await logSecurityEvent('user_login_failure', 'high', { email, error: error.message });
        throw error;
      }

      if (!data?.user) {
        throw new Error('Sign in failed - no user returned');
      }

      console.log('[Auth] Sign in successful:', data.user.id);
      authState.user.set(data.user);

      // Log successful login (fire and forget)
      logSecurityEvent('user_login_success', 'low', {
        user_id: data.user.id,
        email: data.user.email,
      });

      // Fetch profile and navigate
      const profileData = await fetchUserProfile(data.user.id);
      
      if (!profileData) {
        throw new Error('Unable to load user profile. Please contact support.');
      }

      authState.profile.set(profileData);
      
      const defaultRoute = DEFAULT_ROUTES[profileData.role as keyof typeof DEFAULT_ROUTES] || '/dashboard';
      console.log('[Auth] Navigating to:', defaultRoute, 'with role:', profileData.role);
      
      toast({
        title: 'Success',
        description: 'Signed in successfully.',
      });

      navigate(defaultRoute);
    } catch (error: any) {
      console.error('[Auth] Sign in error:', error.message);
      toast({
        variant: "destructive",
        title: 'Sign In Error',
        description: error.message || 'Failed to sign in.',
      });
      throw error;
    } finally {
      setLoadingState(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, isFirstUser: boolean, companyName?: string, subscriptionType?: string): Promise<AuthResult> => {
    try {
      setLoadingState(true);
      console.log("[Auth] Starting signup, isFirstUser =", isFirstUser);

      // Rate limiting
      const canProceed = await supabase.rpc('check_rate_limit', {
        p_identifier: email,
        p_action_type: 'signup',
        p_max_attempts: 3,
        p_window_minutes: 60
      });

      if (!canProceed.data) {
        await logSecurityEvent('rate_limit_exceeded', 'high', { email, action: 'signup' });
        return { success: false, error: "Too many signup attempts. Please try again in 1 hour." };
      }

      const emailValidation = SecurityUtils.validateEmail(email);
      if (!emailValidation.isValid) {
        return { success: false, error: "Invalid email format" };
      }

      const passwordValidation = SecurityUtils.validatePassword(password);
      if (!passwordValidation.isValid) {
        return { success: false, error: `Password requirements not met: ${passwordValidation.feedback.join(', ')}` };
      }

      const sanitizedEmail = emailValidation.sanitized;
      const sanitizedFullName = SecurityUtils.sanitizeString(fullName);
      const sanitizedCompanyName = companyName ? SecurityUtils.sanitizeString(companyName) : undefined;

      const suspiciousCheck = SecurityUtils.detectSuspiciousActivity(email + fullName + (companyName || ''));
      if (suspiciousCheck.isSuspicious) {
        await logSecurityEvent('suspicious_signup_attempt', 'critical', { 
          email: sanitizedEmail, 
          reasons: suspiciousCheck.reasons 
        });
        return { success: false, error: "Signup blocked due to security concerns." };
      }
      
      const metadata: any = { full_name: sanitizedFullName };

      if (!isFirstUser) {
        metadata.role = 'company_admin';
        if (sanitizedCompanyName) metadata.company_name = sanitizedCompanyName;
        if (subscriptionType) metadata.subscription_type = subscriptionType;
      }
      
      const { data, error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/`
        },
      });

      if (error) {
        await logSecurityEvent('user_signup_failure', 'medium', { email, error: error.message });
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: "Failed to create user account" };
      }

      console.log("[Auth] Account created:", data.user.id);
      await logSecurityEvent('user_signup_success', 'low', { user_id: data.user.id, email: data.user.email });

      // Send verification email (fire and forget)
      supabase.functions.invoke('send-email', {
        body: {
          type: 'verification',
          email: sanitizedEmail,
          data: { confirmationUrl: `${window.location.origin}/`, userEmail: sanitizedEmail }
        }
      }).catch(err => console.error('[Auth] Verification email failed:', err));

      // For first user (super admin) with auto-session
      if (isFirstUser && data.session) {
        authState.user.set(data.user);
        
        // Wait for trigger to create profile
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        let profile = null;
        for (let i = 0; i < 5; i++) {
          profile = await fetchUserProfile(data.user.id);
          if (profile) break;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        if (profile) {
          authState.profile.set(profile);
          authState.loading.set(false);
          toast({ title: 'Welcome!', description: 'Super admin account created successfully.' });
          navigate('/dashboard');
        } else {
          toast({ title: 'Account created', description: 'Please sign in with your new account.' });
          navigate('/signin');
        }
      } else {
        const message = isFirstUser 
          ? 'Super admin account created. Please sign in.'
          : companyName 
            ? `Account and company "${companyName}" created. Please sign in.`
            : 'Account created. Please sign in.';
        toast({ title: 'Account created', description: message });
        navigate('/signin');
      }
      
      return { success: true, user: data.user };
    } catch (error: any) {
      console.error('[Auth] Signup error:', error.message);
      toast({
        variant: "destructive",
        title: 'Registration Error',
        description: error.message || 'Failed to create account.',
      });
      return { success: false, error: error.message };
    } finally {
      setLoadingState(false);
    }
  };

  const signOut = async () => {
    try {
      setLoadingState(true);
      const currentUser = authState.user.get();
      if (currentUser) {
        logSecurityEvent('user_logout', 'low', { user_id: currentUser.id });
      }
      
      await supabase.auth.signOut();
      authState.user.set(null);
      authState.profile.set(null);
      authState.loading.set(false);
      
      navigate('/signin');
      toast({ title: 'Signed out', description: 'You have been signed out successfully.' });
    } catch (error: any) {
      console.error('[Auth] Sign out error:', error.message);
      toast({ variant: "destructive", title: 'Error', description: error.message });
    } finally {
      setLoadingState(false);
    }
  };

  return { signIn, signUp, signOut, loading: loadingState };
};
