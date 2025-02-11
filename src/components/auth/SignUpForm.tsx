
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { SignUpFormFields } from "./SignUpFormFields";
import type { SignUpFormValues } from "./schemas/signUpSchema";

interface SignUpFormProps {
  isFirstUser?: boolean;
}

export function SignUpForm({ isFirstUser }: SignUpFormProps) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const onSubmit = async (values: SignUpFormValues) => {
    if (!isFirstUser && (values.role === "driver" || values.role === "supervisor")) {
      toast({
        variant: "destructive",
        title: "Registration not allowed",
        description: "Drivers and supervisors can only be added by company administrators.",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName,
            role: isFirstUser ? 'super_admin' : values.role,
          },
        },
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("Failed to create user account");
      }

      if (!isFirstUser && values.role === "company_admin" && values.companyName && values.subscriptionType) {
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .insert({
            name: values.companyName,
            subscription_type: values.subscriptionType,
            trial_start_date: values.subscriptionType === 'trial' ? new Date().toISOString() : null,
            trial_end_date: values.subscriptionType === 'trial' 
              ? new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString() 
              : null,
            created_by: authData.user.id,
          })
          .select()
          .single();

        if (companyError) throw companyError;

        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            company_id: companyData.id,
          })
          .eq('id', authData.user.id);

        if (profileError) throw profileError;
      }

      toast({
        title: "Account created successfully!",
        description: "Please check your email to verify your account.",
      });

      navigate('/signin', { replace: true });
    } catch (error: any) {
      console.error('Signup error:', error);
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
            <CardTitle className="text-2xl text-center">
              {isFirstUser ? 'Create Super Admin Account' : 'Create Company Account'}
            </CardTitle>
            <CardDescription className="text-center">
              {isFirstUser 
                ? 'Set up your super admin account to get started'
                : 'Register your company to start managing your fleet'}
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
