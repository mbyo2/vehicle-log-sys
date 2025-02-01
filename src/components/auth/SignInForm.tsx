import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { supabase } from "@/integrations/supabase/client";
import { ResetPasswordDialog } from "./ResetPasswordDialog";
import { SignInFormFields } from "./SignInFormFields";
import { TwoFactorVerification } from "./TwoFactorVerification";
import type { SignInFormValues } from "./schemas/signInSchema";
import { observable } from '@legendapp/state';

// Create observable state for sign in
const signInState = observable({
  loading: false,
  resetPasswordOpen: false,
  attempts: 0,
  showTwoFactor: false,
  tempEmail: "",
  isFirstUser: false
});

export function SignInForm() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if this is the first user
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

  // Call checkFirstUser when component mounts
  useState(() => {
    checkFirstUser();
  });

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
      let authResponse;
      
      if (signInState.isFirstUser.get()) {
        // For first user, create account and set as super_admin
        authResponse = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            data: {
              role: 'super_admin'
            }
          }
        });
      } else {
        // Regular sign in for existing users
        authResponse = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password
        });
      }

      const { data: { user }, error } = authResponse;

      if (error) {
        signInState.attempts.set(prev => prev + 1);
        
        if (error.message.includes("Access denied: IP address not whitelisted")) {
          throw new Error("Your IP address is not authorized to access this account. Please contact your administrator.");
        }
        
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("Invalid email or password. Please try again.");
        }
        throw error;
      }

      if (user) {
        if (signInState.isFirstUser.get()) {
          toast({
            title: "Welcome!",
            description: "Your super admin account has been created. Please sign in.",
          });
          return;
        }

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
    } catch (error: any) {
      console.error("Sign in error:", error);
      toast({
        variant: "destructive",
        title: "Error signing in",
        description: error.message,
      });
    } finally {
      signInState.loading.set(false);
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

    // Redirect to the attempted URL or default based on role
    const from = location.state?.from?.pathname || getDefaultRoute(profile.role);
    navigate(from, { replace: true });
  };

  const getDefaultRoute = (role: string) => {
    switch (role) {
      case 'super_admin':
        return '/companies';
      case 'company_admin':
        return '/fleet';
      default:
        return '/documents';
    }
  };

  const handleTwoFactorComplete = () => {
    signInState.showTwoFactor.set(false);
    supabase
      .from('profiles')
      .select('role, company_id')
      .eq('email', signInState.tempEmail.get())
      .single()
      .then(({ data: profile, error }) => {
        if (!error && profile) {
          handleSuccessfulLogin(profile, false);
        }
      });
  };

  return (
    <ErrorBoundary>
      <div className="container relative flex h-screen w-screen flex-col items-center justify-center">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
        {!signInState.showTwoFactor.get() ? (
          <Card className="w-full max-w-[400px] transition-all duration-300">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">
                {signInState.isFirstUser.get() ? 'Create Super Admin Account' : 'Sign In'}
              </CardTitle>
              <CardDescription className="text-center">
                {signInState.isFirstUser.get() 
                  ? 'Set up your super admin account to get started'
                  : 'Enter your credentials to access your account'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SignInFormFields onSubmit={handleSubmit} loading={signInState.loading.get()} />
            </CardContent>
            {!signInState.isFirstUser.get() && (
              <CardFooter className="flex flex-col space-y-2">
                <Button
                  variant="link"
                  className="px-0 text-sm"
                  onClick={() => signInState.resetPasswordOpen.set(true)}
                >
                  Forgot password?
                </Button>
                <div className="text-sm text-muted-foreground">
                  Need a company account?{" "}
                  <Button 
                    variant="link" 
                    className="p-0 text-primary hover:underline"
                    onClick={() => navigate("/signup", { replace: true })}
                  >
                    Register here
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  Note: Drivers and supervisors can only be added by company administrators
                </div>
              </CardFooter>
            )}
          </Card>
        ) : (
          <TwoFactorVerification 
            email={signInState.tempEmail.get()}
            onVerificationComplete={handleTwoFactorComplete}
          />
        )}

        <ResetPasswordDialog 
          open={signInState.resetPasswordOpen.get()} 
          onOpenChange={(open) => signInState.resetPasswordOpen.set(open)}
          redirectTo={`${window.location.origin}/reset-password`}
        />
      </div>
    </ErrorBoundary>
  );
}