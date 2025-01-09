import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

export function SignInForm() {
  const [loading, setLoading] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [tempEmail, setTempEmail] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (values: SignInFormValues) => {
    if (attempts >= 5) {
      toast({
        variant: "destructive",
        title: "Too many attempts",
        description: "Please try again later or reset your password",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password
      });

      if (error) {
        setAttempts(prev => prev + 1);
        
        if (error.message.includes("Access denied: IP address not whitelisted")) {
          throw new Error("Your IP address is not authorized to access this account. Please contact your administrator.");
        }
        
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("Invalid email or password. Please try again.");
        }
        throw error;
      }

      if (user) {
        // Get user profile to check 2FA status
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('two_factor_enabled, role, company_id')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        if (profile.two_factor_enabled) {
          setTempEmail(values.email);
          setShowTwoFactor(true);
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
      setLoading(false);
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

    // Redirect based on role
    if (profile.role === 'super_admin') {
      navigate("/admin/dashboard");
    } else if (profile.role === 'company_admin') {
      navigate("/company/dashboard");
    } else {
      navigate("/dashboard");
    }
  };

  const handleTwoFactorComplete = () => {
    setShowTwoFactor(false);
    // Get profile again to redirect properly
    supabase
      .from('profiles')
      .select('role, company_id')
      .eq('email', tempEmail)
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
        {!showTwoFactor ? (
          <Card className="w-full max-w-[400px] transition-all duration-300">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">Sign In</CardTitle>
              <CardDescription className="text-center">
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SignInFormFields onSubmit={handleSubmit} loading={loading} />
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button
                variant="link"
                className="px-0 text-sm"
                onClick={() => setResetPasswordOpen(true)}
              >
                Forgot password?
              </Button>
              <div className="text-sm text-muted-foreground">
                Need a company account?{" "}
                <Button 
                  variant="link" 
                  className="p-0 text-primary hover:underline"
                  onClick={() => navigate("/signup")}
                >
                  Register here
                </Button>
              </div>
              <div className="text-xs text-muted-foreground text-center">
                Note: Drivers and supervisors can only be added by company administrators
              </div>
            </CardFooter>
          </Card>
        ) : (
          <TwoFactorVerification 
            email={tempEmail}
            onVerificationComplete={handleTwoFactorComplete}
          />
        )}

        <ResetPasswordDialog 
          open={resetPasswordOpen} 
          onOpenChange={setResetPasswordOpen}
        />
      </div>
    </ErrorBoundary>
  );
}