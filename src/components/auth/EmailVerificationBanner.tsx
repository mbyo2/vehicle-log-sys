import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Mail, X, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EmailVerificationBannerProps {
  userEmail: string;
  onDismiss?: () => void;
}

export function EmailVerificationBanner({ userEmail, onDismiss }: EmailVerificationBannerProps) {
  const [isResending, setIsResending] = useState(false);
  const [isResent, setIsResent] = useState(false);
  const { toast } = useToast();

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) throw error;

      setIsResent(true);
      toast({
        title: 'Verification email sent',
        description: 'Please check your inbox for the verification link.',
      });
    } catch (error: any) {
      console.error('Error resending verification:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to resend email',
        description: error.message || 'Please try again later.',
      });
    } finally {
      setIsResending(false);
    }
  };

  if (isResent) {
    return (
      <Alert className="border-success/30 bg-success/10">
        <CheckCircle className="h-4 w-4 text-success" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-success">
            Verification email sent to {userEmail}. Please check your inbox.
          </span>
          {onDismiss && (
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-warning/30 bg-warning/10">
      <Mail className="h-4 w-4 text-warning" />
      <AlertDescription className="flex items-center justify-between">
        <div>
          <span className="text-warning">
            Please verify your email address ({userEmail}) to access all features.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResendVerification}
            disabled={isResending}
            className="border-warning/30 text-warning hover:bg-warning/10"
          >
            {isResending ? 'Sending...' : 'Resend'}
          </Button>
          {onDismiss && (
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}