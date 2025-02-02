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

export function SignInForm() {
  const navigate = useNavigate();
  const { state, handleSubmit, checkFirstUser } = useSignIn();

  useEffect(() => {
    checkFirstUser();
  }, []);

  const handleTwoFactorComplete = () => {
    state.showTwoFactor.set(false);
    supabase
      .from('profiles')
      .select('role, company_id')
      .eq('email', state.tempEmail.get())
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
        {!state.showTwoFactor.get() ? (
          <Card className="w-full max-w-[400px] transition-all duration-300">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">
                {state.isFirstUser.get() ? 'Create Super Admin Account' : 'Sign In'}
              </CardTitle>
              <CardDescription className="text-center">
                {state.isFirstUser.get() 
                  ? 'Set up your super admin account to get started'
                  : 'Enter your credentials to access your account'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SignInFormFields onSubmit={handleSubmit} loading={state.loading.get()} />
            </CardContent>
            {!state.isFirstUser.get() && (
              <CardFooter className="flex flex-col space-y-2">
                <Button
                  variant="link"
                  className="px-0 text-sm"
                  onClick={() => state.resetPasswordOpen.set(true)}
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
            email={state.tempEmail.get()}
            onVerificationComplete={handleTwoFactorComplete}
          />
        )}

        <ResetPasswordDialog 
          open={state.resetPasswordOpen.get()} 
          onOpenChange={(open) => state.resetPasswordOpen.set(open)}
          redirectTo={`${window.location.origin}/reset-password`}
        />
      </div>
    </ErrorBoundary>
  );
}
