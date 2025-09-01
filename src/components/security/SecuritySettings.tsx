import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Smartphone, AlertTriangle, CheckCircle } from 'lucide-react';
import { TwoFactorVerification } from '@/components/auth/TwoFactorVerification';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function SecuritySettings() {
  const { user } = useAuth();
  const { twoFactorEnabled, loading, enableTwoFactor, disableTwoFactor, changePassword } = useSecureAuth();
  const { toast } = useToast();
  
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleEnableTwoFactor = async () => {
    try {
      await enableTwoFactor();
      setShowTwoFactorSetup(true);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to enable two-factor authentication',
      });
    }
  };

  const handleTwoFactorVerification = async () => {
    setShowTwoFactorSetup(false);
    toast({
      title: 'Success',
      description: 'Two-factor authentication has been enabled',
    });
  };

  const handleDisableTwoFactor = async () => {
    try {
      const success = await disableTwoFactor();
      if (success) {
        toast({
          title: 'Success',
          description: 'Two-factor authentication has been disabled',
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to disable two-factor authentication',
      });
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'New passwords do not match',
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Password must be at least 8 characters long',
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const success = await changePassword(currentPassword, newPassword);
      if (success) {
        toast({
          title: 'Success',
          description: 'Password changed successfully',
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to change password',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Shield className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading security settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Security Settings</h1>
      </div>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account with 2FA using an authenticator app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {twoFactorEnabled ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Two-factor authentication is currently <strong>enabled</strong> for your account.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Two-factor authentication is currently <strong>disabled</strong>. Enable it to secure your account.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-4">
            {!twoFactorEnabled ? (
              <Button onClick={handleEnableTwoFactor} className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Enable 2FA
              </Button>
            ) : (
              <Button 
                variant="destructive" 
                onClick={handleDisableTwoFactor}
                className="flex items-center gap-2"
              >
                <Shield className="h-4 w-4" />
                Disable 2FA
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your password to keep your account secure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
              className="w-full"
            >
              {isChangingPassword ? 'Changing Password...' : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Two-Factor Setup Dialog */}
      <TwoFactorVerification
        open={showTwoFactorSetup}
        onOpenChange={setShowTwoFactorSetup}
        mode="setup"
        onSuccess={handleTwoFactorVerification}
      />
    </div>
  );
}