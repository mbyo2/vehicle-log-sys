import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, UserPlus, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types/auth';

const inviteSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['driver', 'supervisor', 'company_admin'] as const),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

interface UserInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function UserInviteDialog({ open, onOpenChange, onSuccess }: UserInviteDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const currentUser = user.get();
  const currentProfile = profile.get();

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      role: 'driver',
      fullName: '',
    },
  });

  const onSubmit = async (values: InviteFormValues) => {
    if (!currentUser || !currentProfile) {
      toast({
        variant: 'destructive',
        title: 'Authentication required',
        description: 'Please sign in to send invitations.',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Generate secure invitation token
      const invitationToken = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      // Create invitation in database
      const { data: invitationData, error: invitationError } = await supabase
        .from('user_invitations')
        .insert({
          email: values.email,
          full_name: values.fullName,
          role: values.role,
          company_id: currentProfile.company_id,
          invited_by: currentUser.id,
          token: invitationToken,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (invitationError) throw invitationError;

      // Get company name
      const { data: companyData } = await supabase
        .from('companies')
        .select('name')
        .eq('id', currentProfile.company_id)
        .single();

      const inviteUrl = `${window.location.origin}/accept-invitation?token=${invitationToken}`;

      // Send invitation email
      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          type: 'invitation',
          email: values.email,
          data: {
            name: values.fullName,
            inviteUrl,
            companyName: companyData?.name || 'Fleet Manager',
            inviterName: currentProfile.full_name || 'A team member',
            role: values.role
          }
        }
      });

      if (emailError) {
        console.error('Email error:', emailError);
        throw new Error('Failed to send invitation email');
      }

      setIsSuccess(true);
      toast({
        title: 'Invitation sent',
        description: `Invitation sent to ${values.email}`,
      });

      onSuccess?.();
    } catch (error: any) {
      console.error('Invitation error:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to send invitation',
        description: error.message || 'Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    form.reset();
    onOpenChange(false);
  };

  // Filter roles based on current user's role
  const availableRoles = currentProfile?.role === 'super_admin' 
    ? ['driver', 'supervisor', 'company_admin'] as const
    : currentProfile?.role === 'company_admin'
    ? ['driver', 'supervisor'] as const
    : ['driver'] as const;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite User
          </DialogTitle>
          <DialogDescription>
            Send an invitation to join your team
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Invitation sent successfully! The user will receive an email with instructions to join your team.
              </AlertDescription>
            </Alert>
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter full name"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type="email"
                          placeholder="Enter email address"
                          className="pl-10"
                          disabled={isLoading}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger disabled={isLoading}>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableRoles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send Invitation'}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}