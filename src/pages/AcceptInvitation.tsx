import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AlertCircle, CheckCircle, Mail, UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';

const acceptInvitationSchema = z.object({
  fullName: z.string().min(2, 'Please enter your full name'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type AcceptInvitationFormValues = z.infer<typeof acceptInvitationSchema>;

interface InvitationData {
  id: string;
  email: string;
  role: string;
  company_id: string | null;
  expires_at: string;
  status: string;
}

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const token = searchParams.get('token');

  const form = useForm<AcceptInvitationFormValues>({
    resolver: zodResolver(acceptInvitationSchema),
    defaultValues: { fullName: '', password: '', confirmPassword: '' },
  });

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link');
      setLoading(false);
      return;
    }
    loadInvitation(token);
  }, [token]);

  const loadInvitation = async (tok: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('user_invitations')
        .select('id, email, role, company_id, expires_at, status')
        .eq('token', tok)
        .maybeSingle();

      if (fetchError || !data) {
        setError('Invalid or expired invitation');
        setLoading(false);
        return;
      }
      if (data.status !== 'pending') {
        setError('This invitation has already been used or expired');
        setLoading(false);
        return;
      }
      if (new Date(data.expires_at) < new Date()) {
        setError('This invitation has expired');
        setLoading(false);
        return;
      }
      setInvitation(data);
    } catch (err) {
      console.error('Error loading invitation:', err);
      setError('Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: AcceptInvitationFormValues) => {
    if (!invitation || !token) return;
    setAccepting(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('accept-invitation', {
        body: { token, password: values.password, fullName: values.fullName },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      // Auto sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: invitation.email,
        password: values.password,
      });

      if (signInError) {
        toast({ title: 'Account created', description: 'Please sign in to continue.' });
        navigate('/signin');
        return;
      }

      toast({ title: 'Welcome!', description: 'Your account is ready.' });
      // Full reload so AuthContext picks up the new session and profile
      window.location.href = '/dashboard';
    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      toast({
        variant: 'destructive',
        title: 'Failed to accept invitation',
        description: err?.message || 'Please try again later.',
      });
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <LoadingSpinner size={32} />
          <span className="text-muted-foreground">Loading invitation...</span>
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Invalid Invitation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{error || 'Invitation not found'}</AlertDescription>
            </Alert>
            <Button onClick={() => navigate('/signin')} className="w-full">
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Accept Invitation
          </CardTitle>
          <CardDescription>You've been invited to join the team</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-primary/20 bg-primary/5">
            <Mail className="h-4 w-4 text-primary" />
            <AlertDescription className="text-foreground">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{invitation.email}</p>
                <p className="text-sm">
                  Role:{' '}
                  <span className="font-medium capitalize">
                    {invitation.role.replace('_', ' ')}
                  </span>
                </p>
              </div>
            </AlertDescription>
          </Alert>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Your full name" disabled={accepting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div>
                        <Input
                          {...field}
                          type="password"
                          placeholder="Create a password"
                          disabled={accepting}
                          onChange={(e) => {
                            field.onChange(e);
                            setPassword(e.target.value);
                          }}
                        />
                        {password && <PasswordStrengthMeter password={password} />}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Confirm your password"
                        disabled={accepting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/signin')}
                  className="flex-1"
                  disabled={accepting}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={accepting}>
                  {accepting ? (
                    <>
                      <LoadingSpinner size={16} className="mr-2" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Accept & Create Account
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
