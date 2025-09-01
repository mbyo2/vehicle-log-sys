import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const verificationSchema = z.object({
  code: z.string().length(6, 'Verification code must be 6 digits'),
});

type VerificationFormValues = z.infer<typeof verificationSchema>;

interface TwoFactorVerificationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'setup' | 'verify';
  onSuccess?: () => void;
}

export function TwoFactorVerification({ 
  open, 
  onOpenChange, 
  mode,
  onSuccess 
}: TwoFactorVerificationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [step, setStep] = useState<'qr' | 'verify'>('qr');
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<VerificationFormValues>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      code: '',
    },
  });

  const verifyCode = async (values: VerificationFormValues) => {
    setIsLoading(true);
    try {
      const currentUser = user.get();
      if (!currentUser) throw new Error('User not authenticated');

      // Call the verify-totp edge function
      const { data, error } = await supabase.functions.invoke('verify-totp', {
        body: { code: values.code }
      });

      if (error) {
        throw new Error(error.message || 'Verification failed');
      }

      if (data?.success) {
        toast({
          title: mode === 'setup' ? '2FA enabled' : 'Verification successful',
          description: mode === 'setup' 
            ? 'Two-factor authentication has been enabled.'
            : 'You have been successfully verified.',
        });
        
        onSuccess?.();
        onOpenChange(false);
        form.reset();
      } else {
        throw new Error('Invalid verification code');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Verification failed',
        description: error.message || 'Invalid verification code',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {mode === 'setup' ? 'Enable Two-Factor Authentication' : 'Two-Factor Verification'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(verifyCode)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verification Code</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter 6-digit code from your authenticator app"
                      maxLength={6}
                      className="text-center text-lg tracking-widest"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : 'Verify'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}