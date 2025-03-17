
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { SignUpFormFields } from "./SignUpFormFields";
import { useAuthActions } from "@/contexts/auth/useAuthActions";
import type { SignUpFormValues } from "./schemas/signUpSchema";

interface SignUpFormProps {
  isFirstUser?: boolean;
}

export function SignUpForm({ isFirstUser }: SignUpFormProps) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuthActions();

  const onSubmit = async (values: SignUpFormValues) => {
    if (!isFirstUser && (values.role === "driver" || values.role === "supervisor")) {
      console.error("Registration not allowed for this role");
      return;
    }

    setLoading(true);
    try {
      await signUp(
        values.email,
        values.password,
        isFirstUser ? 'super_admin' : values.role,
        values.fullName,
        values.companyName,
        values.subscriptionType
      );
      // Navigation is handled in the signUp function
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="container relative flex h-screen w-screen flex-col items-center justify-center">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
        <Card className="w-full max-w-[400px]">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              {isFirstUser ? 'Create Super Admin Account' : 'Create Account'}
            </CardTitle>
            <CardDescription className="text-center">
              {isFirstUser 
                ? 'Set up your super admin account to get started'
                : 'Register your account to start managing your fleet'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignUpFormFields onSubmit={onSubmit} loading={loading} isFirstUser={isFirstUser} />
            {!isFirstUser && (
              <div className="mt-4 text-center text-sm">
                Already have an account?{" "}
                <Link
                  to="/signin"
                  className="text-primary hover:underline"
                >
                  Sign in
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
}
