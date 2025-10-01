
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icons } from "@/components/ui/icons";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/auth";

const invitationSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["driver", "supervisor", "company_admin"] as const),
});

type InvitationFormValues = z.infer<typeof invitationSchema>;

interface UserInvitationFormProps {
  onSuccess?: () => void;
}

export function UserInvitationForm({ onSuccess }: UserInvitationFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  const form = useForm<InvitationFormValues>({
    resolver: zodResolver(invitationSchema),
    defaultValues: {
      email: "",
      role: "driver",
    },
  });

  const onSubmit = async (values: InvitationFormValues) => {
    try {
      setLoading(true);
      const currentProfile = profile.get();

      if (!currentProfile) {
        throw new Error("User profile not found");
      }

      // Generate a unique invitation token
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

      // Create the invitation record
      const { error } = await supabase
        .from('user_invitations')
        .insert({
          email: values.email,
          role: values.role,
          company_id: currentProfile.company_id,
          invited_by: currentProfile.id,
          token,
          expires_at: expiresAt.toISOString(),
          status: 'pending'
        });

      if (error) {
        throw error;
      }

      // Send invitation email using edge function
      try {
        await supabase.functions.invoke('send-invitation', {
          body: {
            email: values.email,
            role: values.role,
            companyName: currentProfile.company_id || 'Fleet Management',
            inviterName: currentProfile.full_name || 'Admin',
            invitationToken: token
          }
        });
      } catch (emailError) {
        // Don't fail the whole operation if email fails
        console.error('Failed to send invitation email:', emailError);
      }

      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${values.email} for ${values.role} role.`,
      });

      form.reset();
      onSuccess?.();

    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast({
        variant: "destructive",
        title: "Failed to Send Invitation",
        description: error.message || "Unable to send invitation. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="user@example.com"
                  disabled={loading}
                  {...field}
                />
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
              <Select
                disabled={loading}
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="driver">Driver</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="company_admin">Company Admin</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
          Send Invitation
        </Button>
      </form>
    </Form>
  );
}
