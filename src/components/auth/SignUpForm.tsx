
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { SignUpFormFields } from "./SignUpFormFields";
import { useAuthActions } from "@/contexts/auth/useAuthActions";
import type { SignUpFormValues } from "./schemas/signUpSchema";
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { ConnectionStatus } from "@/components/ui/connection-status";

interface SignUpFormProps {
  isFirstUser?: boolean;
}

export function SignUpForm({ isFirstUser }: SignUpFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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
    setSuccessMessage(null);
    
    try {
      console.log('Creating account with role:', isFirstUser ? 'super_admin' : values.role);
      
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
          setSuccessMessage("Super admin account created successfully! Redirecting to dashboard...");
          toast({
            title: "Super Admin Created",
            description: "Your super admin account has been created successfully."
          });
          // For first user (super admin), we'll be redirected automatically by the signUp function
        } else {
          setSuccessMessage("Account created successfully! You can now sign in.");
          toast({
            title: "Account Created",
            description: "Your account has been created. Please sign in."
          });
          // Navigate to signin page after successful signup with a short delay
          setTimeout(() => {
            navigate('/signin');
          }, 2000);
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
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {successMessage && (
              <Alert className="mb-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200">
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
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
