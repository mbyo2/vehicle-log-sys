import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { SignUpFormFields } from "./SignUpFormFields";
import type { SignUpFormValues } from "./schemas/signUpSchema";

export function SignUpForm() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const onSubmit = async (values: SignUpFormValues) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName,
          },
        },
      });

      if (error) throw error;

      toast({
        title: "Account created successfully!",
        description: "Please check your email to verify your account.",
      });
      
      navigate('/signin');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error creating account",
        description: error.message,
      });
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
            <CardTitle className="text-2xl text-center">Create Account</CardTitle>
            <CardDescription className="text-center">
              Enter your details to create a new account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignUpFormFields onSubmit={onSubmit} loading={loading} />
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link
                to="/signin"
                className="text-primary hover:underline"
              >
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
}