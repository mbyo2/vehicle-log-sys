import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { ResetPasswordDialog } from "./ResetPasswordDialog";
import { SignInFormFields } from "./SignInFormFields";
import { TwoFactorVerification } from "./TwoFactorVerification";
import { useSignIn } from "./hooks/useSignIn";
import { supabase } from "@/integrations/supabase/client";
import { observable } from '@legendapp/state';
import { toast } from "@/hooks/use-toast";

const signInState = observable({
  showTwoFactor: false,
  tempEmail: "",
  resetPasswordOpen: false,
  isFirstUser: false
});

export function SignInForm() {
  const navigate = useNavigate();
  const { state, handleSubmit, checkFirstUser, handleSuccessfulLogin } = useSignIn();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if user is already logged in
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            handleSuccessfulLogin(profile, false);
            return;
          }
        }

        // If no session, check if this is first user setup
        await checkFirstUser();
      } catch (error) {
        console.error('Error initializing auth:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to initialize authentication"
        });
      }
    };

    initializeAuth();
  }, [checkFirstUser, handleSuccessfulLogin, navigate]);

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
              <SignInFormFields onSubmit={handleSubmit} loading={state.loading.get()} />
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