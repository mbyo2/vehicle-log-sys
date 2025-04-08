import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { SignUpFormFields } from "./SignUpFormFields";
import { useAuthActions } from "@/contexts/auth/useAuthActions";
import type { SignUpFormValues } from "./schemas/signUpSchema";
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { ConnectionStatus } from "@/components/ui/connection-status";

interface SignUpFormProps {
  isFirstUser?: boolean;
}

export function SignUpForm({ isFirstUser }: SignUpFormProps) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuthActions();
  const { toast } = useToast();

  const onSubmit = async (values: SignUpFormValues) => {
    console.log("SignUpForm: Form submission starting with values:", { 
      ...values, 
      email: values.email, 
      isFirstUser 
    });

    if (!isFirstUser && (values.role === "driver" || values.role === "supervisor")) {
      toast({
        variant: "destructive",
        title: "Registration not allowed",
        description: "Drivers and supervisors must be added by company administrators"
      });
      return;
    }

    setLoading(true);
    
    try {
      console.log('Creating account with role:', isFirstUser ? 'super_admin' : values.role);
      
      // Check if the profiles table exists for super_admin
      if (isFirstUser) {
        // Try to create the profiles table if it doesn't exist
        try {
          const { error: checkError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .limit(1);
          
          // If the table doesn't exist, we'll get an error, which is fine
          console.log('Profiles table check:', checkError ? 'Table may not exist' : 'Table exists');
        } catch (error) {
          console.log('Error checking profiles table, likely does not exist yet');
        }
      }
      
      console.log("Calling signUp function with params:", {
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        isFirstUser,
      });

      await signUp(
        values.email,
        values.password,
        values.fullName,
        isFirstUser || false
      );
      
      console.log("SignUp successful");
      
      // Show success toast and navigate to signin page
      if (isFirstUser) {
        toast({
          title: "Super Admin Created",
          description: "You've created the super admin account. Please sign in."
        });
      } else {
        toast({
          title: "Account Created",
          description: "Your account has been created. Please sign in."
        });
      }
      
      // Navigate to signin page after successful signup with a short delay
      // to ensure toasts are visible and state is updated
      setTimeout(() => {
        navigate('/signin');
      }, 1000);
      
    } catch (error: any) {
      console.error('Form submission error:', error);
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "Failed to create account"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="container relative flex h-screen w-screen flex-col items-center justify-center">
        <div className="absolute right-4 top-4 flex items-center gap-2">
          <ConnectionStatus showDetails={false} />
          <ThemeToggle />
        </div>
        <Card className="w-full max-w-[450px] shadow-lg">
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
          </CardContent>
          {!isFirstUser && (
            <CardFooter className="flex justify-center border-t p-4">
              <div className="text-center text-sm">
                Already have an account?{" "}
                <Link
                  to="/signin"
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
                </Link>
              </div>
            </CardFooter>
          )}
        </Card>
      </div>
    </ErrorBoundary>
  );
}
