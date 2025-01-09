import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface TwoFactorVerificationProps {
  email: string;
  onVerificationComplete: () => void;
}

export function TwoFactorVerification({ email, onVerificationComplete }: TwoFactorVerificationProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleVerification = async () => {
    if (code.length !== 6) {
      toast({
        variant: "destructive",
        title: "Invalid code",
        description: "Please enter a valid 6-digit code",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('two_factor_secret')
        .eq('email', email)
        .single();

      if (profileError) throw profileError;

      // Verify the code against the stored secret
      // In a real implementation, you would verify this against the stored secret
      if (code === profile.two_factor_secret) {
        toast({
          title: "Success",
          description: "Two-factor authentication verified",
        });
        onVerificationComplete();
      } else {
        toast({
          variant: "destructive",
          title: "Invalid code",
          description: "The code you entered is incorrect",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-[400px]">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Two-Factor Authentication</CardTitle>
        <CardDescription className="text-center">
          Enter the verification code sent to your email
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={code}
            onChange={(value) => setCode(value)}
            render={({ slots }) => (
              <InputOTPGroup className="gap-2">
                {slots.map((slot, index) => (
                  <InputOTPSlot key={index} {...slot} />
                ))}
              </InputOTPGroup>
            )}
          />
        </div>
        <Button
          className="w-full"
          onClick={handleVerification}
          disabled={loading || code.length !== 6}
        >
          {loading ? (
            <>
              <LoadingSpinner className="mr-2" />
              Verifying...
            </>
          ) : (
            "Verify"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}