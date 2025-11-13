import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Mail, MessageSquare, Smartphone, Clock, Loader2 } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface NotificationPreferences {
  id: string;
  user_id: string;
  company_id: string | null;
  maintenance_reminders: boolean;
  vehicle_issues: boolean;
  document_expiry: boolean;
  user_actions: boolean;
  approval_required: boolean;
  urgent_alerts: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  digest_mode: boolean;
  digest_frequency: 'daily' | 'weekly';
  phone_number: string | null;
}

export function NotificationPreferences() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { permission, requestPermission } = usePushNotifications();
  const currentProfile = profile.get();

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['notification-preferences', currentProfile?.id, currentProfile?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', currentProfile?.id!)
        .eq('company_id', currentProfile?.company_id!)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      // If no preferences exist, create default ones
      if (!data) {
        const { data: newPrefs, error: insertError } = await supabase
          .from('notification_preferences')
          .insert({
            user_id: currentProfile?.id,
            company_id: currentProfile?.company_id,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        return newPrefs as NotificationPreferences;
      }

      return data as NotificationPreferences;
    },
    enabled: !!currentProfile?.id && !!currentProfile?.company_id,
  });

  const updatePreferences = useMutation({
    mutationFn: async (updates: Partial<NotificationPreferences>) => {
      const { error } = await supabase
        .from('notification_preferences')
        .update(updates)
        .eq('id', preferences?.id!);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Preferences updated',
        description: 'Your notification preferences have been saved.',
      });
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update preferences. Please try again.',
      });
      console.error('Update preferences error:', error);
    },
  });

  const handleToggle = (field: keyof NotificationPreferences, value: boolean) => {
    updatePreferences.mutate({ [field]: value });
  };

  const handleTimeChange = (field: 'quiet_hours_start' | 'quiet_hours_end', value: string) => {
    updatePreferences.mutate({ [field]: value });
  };

  const handlePhoneUpdate = (phone_number: string) => {
    updatePreferences.mutate({ phone_number });
  };

  const handleEnablePushNotifications = async () => {
    const result = await requestPermission();
    if (result === 'granted') {
      handleToggle('push_enabled', true);
      toast({
        title: 'Push notifications enabled',
        description: 'You will now receive browser push notifications.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Permission denied',
        description: 'Please enable notifications in your browser settings.',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!preferences) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Unable to load notification preferences.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Types
          </CardTitle>
          <CardDescription>
            Choose which types of notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Maintenance Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Scheduled maintenance and service alerts
              </p>
            </div>
            <Switch
              checked={preferences.maintenance_reminders}
              onCheckedChange={(checked) => handleToggle('maintenance_reminders', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Vehicle Issues</Label>
              <p className="text-sm text-muted-foreground">
                Vehicle problems and repair notifications
              </p>
            </div>
            <Switch
              checked={preferences.vehicle_issues}
              onCheckedChange={(checked) => handleToggle('vehicle_issues', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Document Expiry</Label>
              <p className="text-sm text-muted-foreground">
                Expiring licenses, insurance, and documents
              </p>
            </div>
            <Switch
              checked={preferences.document_expiry}
              onCheckedChange={(checked) => handleToggle('document_expiry', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>User Actions</Label>
              <p className="text-sm text-muted-foreground">
                Team member activities and updates
              </p>
            </div>
            <Switch
              checked={preferences.user_actions}
              onCheckedChange={(checked) => handleToggle('user_actions', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Approval Required</Label>
              <p className="text-sm text-muted-foreground">
                Items pending your approval
              </p>
            </div>
            <Switch
              checked={preferences.approval_required}
              onCheckedChange={(checked) => handleToggle('approval_required', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Urgent Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Critical notifications (always delivered)
              </p>
            </div>
            <Switch
              checked={preferences.urgent_alerts}
              onCheckedChange={(checked) => handleToggle('urgent_alerts', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Delivery Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Delivery Methods
          </CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                In-App Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Show notifications within the application
              </p>
            </div>
            <Switch
              checked={preferences.in_app_enabled}
              onCheckedChange={(checked) => handleToggle('in_app_enabled', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              checked={preferences.email_enabled}
              onCheckedChange={(checked) => handleToggle('email_enabled', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Browser Push Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                {permission === 'granted' 
                  ? 'Enabled - You will receive browser notifications' 
                  : 'Enable browser notifications for real-time alerts'}
              </p>
            </div>
            {permission === 'granted' ? (
              <Switch
                checked={preferences.push_enabled}
                onCheckedChange={(checked) => handleToggle('push_enabled', checked)}
              />
            ) : (
              <Button onClick={handleEnablePushNotifications} size="sm">
                Enable
              </Button>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  SMS Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive critical alerts via SMS
                </p>
              </div>
              <Switch
                checked={preferences.sms_enabled}
                onCheckedChange={(checked) => handleToggle('sms_enabled', checked)}
              />
            </div>
            {preferences.sms_enabled && (
              <div className="space-y-2 pl-6">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex gap-2">
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1234567890"
                    defaultValue={preferences.phone_number || ''}
                    onBlur={(e) => handlePhoneUpdate(e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Include country code (e.g., +1 for US)
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Quiet Hours
          </CardTitle>
          <CardDescription>
            Set a time range when you don't want to receive non-urgent notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enable Quiet Hours</Label>
            <Switch
              checked={preferences.quiet_hours_enabled}
              onCheckedChange={(checked) => handleToggle('quiet_hours_enabled', checked)}
            />
          </div>

          {preferences.quiet_hours_enabled && (
            <>
              <Separator />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="start-time">Start Time</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={preferences.quiet_hours_start}
                    onChange={(e) => handleTimeChange('quiet_hours_start', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-time">End Time</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={preferences.quiet_hours_end}
                    onChange={(e) => handleTimeChange('quiet_hours_end', e.target.value)}
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Urgent notifications will still be delivered during quiet hours
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Digest Mode */}
      <Card>
        <CardHeader>
          <CardTitle>Digest Mode</CardTitle>
          <CardDescription>
            Receive notifications as a summary instead of individually
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enable Digest Mode</Label>
            <Switch
              checked={preferences.digest_mode}
              onCheckedChange={(checked) => handleToggle('digest_mode', checked)}
            />
          </div>

          {preferences.digest_mode && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="frequency">Digest Frequency</Label>
                <Select
                  value={preferences.digest_frequency}
                  onValueChange={(value: 'daily' | 'weekly') =>
                    updatePreferences.mutate({ digest_frequency: value })
                  }
                >
                  <SelectTrigger id="frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
