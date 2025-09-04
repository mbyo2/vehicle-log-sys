import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User, Session } from '@supabase/supabase-js';

interface EnhancedAuthState {
  user: User | null;
  session: Session | null;
  profile: any | null;
  loading: boolean;
  permissions: string[];
}

interface AuthError {
  message: string;
  code?: string;
}

export function useEnhancedAuth() {
  const [authState, setAuthState] = useState<EnhancedAuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
    permissions: []
  });
  
  const { toast } = useToast();

  // Fetch user permissions based on role
  const fetchUserPermissions = async (userRole: string, companyId?: string) => {
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('resource, action')
        .eq('role', userRole)
        .eq('is_granted', true);

      if (error) {
        console.error('Error fetching permissions:', error);
        return [];
      }

      return data?.map(p => `${p.resource}:${p.action}`) || [];
    } catch (error) {
      console.error('Permission fetch failed:', error);
      return [];
    }
  };

  // Enhanced session management with security logging
  const logSecurityEvent = async (eventType: string, details: any = {}) => {
    try {
      await supabase.from('security_events').insert({
        event_type: eventType,
        event_details: details,
        ip_address: await getClientIP(),
        user_agent: navigator.userAgent
      });
    } catch (error) {
      console.error('Security logging failed:', error);
    }
  };

  const getClientIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  };

  // Enhanced sign up with proper validation
  const signUp = async (email: string, password: string, userData: any = {}) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: userData
        }
      });

      if (error) {
        await logSecurityEvent('signup_failed', { 
          email, 
          error: error.message,
          userData: { ...userData, password: undefined }
        });
        
        return { error: { message: error.message, code: error.message } };
      }

      await logSecurityEvent('signup_success', { 
        email,
        userData: { ...userData, password: undefined }
      });

      toast({
        title: "Account created",
        description: "Please check your email to verify your account",
      });

      return { data, error: null };
    } catch (error: any) {
      const authError: AuthError = { 
        message: error.message || 'Signup failed',
        code: error.code 
      };
      return { error: authError };
    } finally {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  };

  // Enhanced sign in with security measures
  const signIn = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        await logSecurityEvent('signin_failed', { 
          email, 
          error: error.message 
        });
        
        // Rate limiting check
        const failedAttempts = await supabase
          .from('security_events')
          .select('id')
          .eq('event_type', 'signin_failed')
          .gte('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString())
          .limit(5);

        if (failedAttempts.data && failedAttempts.data.length >= 5) {
          return { 
            error: { 
              message: 'Too many failed attempts. Please try again later.',
              code: 'rate_limited' 
            } 
          };
        }

        return { error: { message: error.message, code: error.message } };
      }

      await logSecurityEvent('signin_success', { email });

      return { data, error: null };
    } catch (error: any) {
      const authError: AuthError = { 
        message: error.message || 'Sign in failed',
        code: error.code 
      };
      return { error: authError };
    } finally {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  };

  // Enhanced sign out with session cleanup
  const signOut = async () => {
    try {
      await logSecurityEvent('signout_initiated');
      
      // Clean up user sessions
      if (authState.user) {
        await supabase
          .from('user_sessions')
          .update({ is_active: false })
          .eq('user_id', authState.user.id);
      }

      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        return { error: { message: error.message } };
      }

      setAuthState({
        user: null,
        session: null,
        profile: null,
        loading: false,
        permissions: []
      });

      toast({
        title: "Signed out",
        description: "You have been successfully signed out",
      });

      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message || 'Sign out failed' } };
    }
  };

  // Check if user has specific permission
  const hasPermission = (resource: string, action: string): boolean => {
    return authState.permissions.includes(`${resource}:${action}`);
  };

  // Enhanced profile fetching with retries
  const fetchUserProfile = async (userId: string) => {
    let retries = 3;
    
    while (retries > 0) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          console.error('Profile fetch error:', error);
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
          return null;
        }

        if (data) {
          // Fetch permissions for this user
          const permissions = await fetchUserPermissions(data.role, data.company_id);
          setAuthState(prev => ({ ...prev, permissions }));
          return data;
        }

        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error('Profile fetch failed:', error);
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    return null;
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
        } else if (session?.user && mounted) {
          const profileData = await fetchUserProfile(session.user.id);
          
          if (mounted) {
            setAuthState({
              user: session.user,
              session,
              profile: profileData,
              loading: false,
              permissions: authState.permissions
            });
          }
        } else if (mounted) {
          setAuthState(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setAuthState(prev => ({ ...prev, loading: false }));
        }
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state changed:', event);

        if (event === 'SIGNED_OUT' || !session) {
          setAuthState({
            user: null,
            session: null,
            profile: null,
            loading: false,
            permissions: []
          });
          return;
        }

        if (session.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          const profileData = await fetchUserProfile(session.user.id);
          
          if (mounted) {
            setAuthState(prev => ({
              ...prev,
              user: session.user,
              session,
              profile: profileData,
              loading: false
            }));
          }
        }
      }
    );

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
    hasPermission,
    refetchProfile: () => authState.user ? fetchUserProfile(authState.user.id) : null
  };
}