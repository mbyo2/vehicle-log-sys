import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Shield, Key, Lock } from "lucide-react";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { TwoFactorVerification } from "@/components/auth/TwoFactorVerification";
import { useAuth } from "@/contexts/AuthContext";

export function SecuritySettings() {
  const { user } = useAuth();
  const { 
    twoFactorEnabled, 
    loading, 
    enableTwoFactor, 
    verifyTwoFactor, 
    disableTwoFactor, 
    changePassword 
  } = useSecureAuth();
  
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [twoFactorSetup, setTwoFactorSetup] = useState<any>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleEnableTwoFactor = async () => {
    const setup = await enableTwoFactor();
    if (setup) {
      setTwoFactorSetup(setup);
      setShowTwoFactorSetup(true);
    }
  };

  const handleTwoFactorVerification = async () => {
    setShowTwoFactorSetup(false);
    setTwoFactorSetup(null);
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      return;
    }
    
    const success = await changePassword(currentPassword, newPassword);
    if (success) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  if (showTwoFactorSetup && twoFactorSetup) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Set Up Two-Factor Authentication
            </CardTitle>
            <CardDescription>
              Scan the QR code with your authenticator app and enter the verification code
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <img 
                src={twoFactorSetup.qrCode} 
                alt="2FA QR Code" 
                className="border rounded-lg"
              />
            </div>
            
            <Alert>
              <AlertDescription>
                <strong>Secret Key:</strong> {twoFactorSetup.secret}
                <br />
                <strong>Backup Codes:</strong> Save these codes in a secure location: {twoFactorSetup.backupCodes.join(', ')}
              </AlertDescription>
            </Alert>

            <TwoFactorVerification
              email={(typeof user?.email === 'string' ? user.email : user?.email?.get?.() || "")}
              onVerificationComplete={handleTwoFactorVerification}
            />

            <Button 
              variant="outline" 
              onClick={() => setShowTwoFactorSetup(false)}
              className="w-full"
            >
              Cancel
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Security Settings</h1>
        <p className="text-muted-foreground">
          Manage your account security settings and authentication methods
        </p>
      </div>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account with 2FA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Status: {twoFactorEnabled ? "Enabled" : "Disabled"}
              </p>
            </div>
            <Switch
              checked={twoFactorEnabled}
              onCheckedChange={twoFactorEnabled ? disableTwoFactor : handleEnableTwoFactor}
              disabled={loading}
            />
          </div>
          
          {!twoFactorEnabled && (
            <Alert>
              <AlertDescription>
                Two-factor authentication is highly recommended for enhanced security.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>
          
          {newPassword && confirmPassword && newPassword !== confirmPassword && (
            <Alert>
              <AlertDescription>
                Passwords do not match
              </AlertDescription>
            </Alert>
          )}
          
          <Button
            onClick={handlePasswordChange}
            disabled={
              loading ||
              !currentPassword ||
              !newPassword ||
              !confirmPassword ||
              newPassword !== confirmPassword
            }
            className="w-full"
          >
            <Lock className="mr-2 h-4 w-4" />
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}