
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
  const [error, setError] = useState<string | null>(null);
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
    setError(null);
    
    try {
      console.log('Creating account with role:', isFirstUser ? 'super_admin' : values.role);
      
      // Check if superadmin already exists when trying to create one
      if (isFirstUser) {
        try {
          const { count, error: countError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'super_admin');
            
          if (countError) {
            console.log('Error checking superadmin count:', countError);
            // If it's table doesn't exist, we can proceed
            if (!countError.message?.includes("does not exist")) {
              throw countError;
            }
          } else if (count && count > 0) {
            setError("A super admin account already exists. Please sign in instead.");
            toast({
              variant: "destructive",
              title: "Super Admin Exists",
              description: "A super admin account has already been created. Please sign in instead."
            });
            setTimeout(() => navigate('/signin'), 2000);
            return;
          }
        } catch (countErr: any) {
          console.error('Error checking for existing superadmin:', countErr);
          // Only throw if it's not about the table not existing
          if (!countErr.message?.includes("does not exist")) {
            throw countErr;
          }
        }
      }
      
      console.log("Calling signUp function with params:", {
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        isFirstUser,
      });

      const result = await signUp(
        values.email,
        values.password,
        values.fullName,
        isFirstUser || false
      );
      
      console.log("SignUp result:", result);
      
      if (result && result.success) {
        console.log("SignUp successful");
        
        if (isFirstUser) {
          toast({
            title: "Super Admin Created",
            description: "Your super admin account has been created successfully."
          });
          // For first user (super admin), we'll be redirected automatically by the signUp function
        } else {
          toast({
            title: "Account Created",
            description: "Your account has been created. Please sign in."
          });
          // Navigate to signin page after successful signup with a short delay
          setTimeout(() => {
            navigate('/signin');
          }, 1000);
        }
      } else if (result && result.error) {
        setError(result.error);
        toast({
          variant: "destructive",
          title: "Registration Failed",
          description: result.error
        });
      }
      
    } catch (error: any) {
      console.error('Form submission error:', error);
      setError(error.message || "Failed to create account");
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
            {error && (
              <div className="bg-destructive/10 border border-destructive text-destructive p-3 rounded-md mb-4 text-sm">
                {error}
              </div>
            )}
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
