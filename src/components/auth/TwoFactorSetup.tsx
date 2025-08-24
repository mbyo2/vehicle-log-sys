import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Smartphone, CheckCircle, AlertTriangle } from 'lucide-react';
import { TwoFactorVerification } from './TwoFactorVerification';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function TwoFactorSetup() {
  const [showSetup, setShowSetup] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const currentUser = user.get();
  const currentProfile = profile.get();

  const handleDisable2FA = async () => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('disable-totp', {
        body: { userId: currentUser.id }
      });

      if (error) throw error;

      setIsEnabled(false);
      toast({
        title: '2FA disabled',
        description: 'Two-factor authentication has been disabled for your account.',
      });

      // Update profile in database
      await supabase
        .from('profiles')
        .update({ two_factor_enabled: false })
        .eq('id', currentUser.id);

    } catch (error: any) {
      console.error('Error disabling 2FA:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to disable 2FA',
        description: error.message || 'Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupSuccess = async () => {
    setIsEnabled(true);
    
    // Update profile in database
    if (currentUser) {
      try {
        await supabase
          .from('profiles')
          .update({ two_factor_enabled: true })
          .eq('id', currentUser.id);
      } catch (error) {
        console.error('Error updating profile:', error);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEnabled || currentProfile?.two_factor_enabled ? (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              Two-factor authentication is enabled for your account.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Two-factor authentication is not enabled. Your account is less secure.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Smartphone className="h-5 w-5 mt-0.5 text-muted-foreground" />
            <div>
              <h4 className="font-medium">Authenticator App</h4>
              <p className="text-sm text-muted-foreground">
                Use an authenticator app like Google Authenticator or Authy to generate verification codes.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {isEnabled || currentProfile?.two_factor_enabled ? (
            <Button
              variant="destructive"
              onClick={handleDisable2FA}
              disabled={isLoading}
            >
              {isLoading ? 'Disabling...' : 'Disable 2FA'}
            </Button>
          ) : (
            <Button onClick={() => setShowSetup(true)}>
              Enable 2FA
            </Button>
          )}
        </div>

        <TwoFactorVerification
          open={showSetup}
          onOpenChange={setShowSetup}
          mode="setup"
          onSuccess={handleSetupSuccess}
        />
      </CardContent>
    </Card>
  );
}