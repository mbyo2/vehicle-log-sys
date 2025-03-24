
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { SignInFormFields } from "./SignInFormFields";
import { useSignIn } from "./hooks/useSignIn";

export function SignInForm() {
  const navigate = useNavigate();
  const { state, handleSubmit, checkFirstUser } = useSignIn();

  // Use useEffect hook to check for first user only once on component mount
  useEffect(() => {
    const checkForFirstUser = async () => {
      try {
        console.log("Checking for first user on SignInForm mount");
        await checkFirstUser();
      } catch (error) {
        console.error("Error in checkFirstUser:", error);
      }
    };
    
    checkForFirstUser();
  }, []);

  return (
    <ErrorBoundary>
      <div className="container relative flex h-screen w-screen flex-col items-center justify-center">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
        <Card className="w-full max-w-[400px]">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              Sign in to your account
            </CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignInFormFields onSubmit={handleSubmit} loading={state.loading.get()} />
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-muted-foreground">
              Need a company account?{" "}
              <Button 
                variant="link" 
                className="px-0 text-primary hover:underline"
                onClick={() => navigate("/signup", { replace: true })}
              >
                Register here
              </Button>
            </div>
            <div className="text-xs text-muted-foreground text-center">
              Note: Drivers and supervisors can only be added by company administrators
            </div>
          </CardFooter>
        </Card>
      </div>
    </ErrorBoundary>
  );
}
