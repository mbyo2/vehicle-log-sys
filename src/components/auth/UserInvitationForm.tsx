
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useRoleManagement } from "@/hooks/useRoleManagement";
import { Icons } from "@/components/ui/icons";

const invitationSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["supervisor", "driver", "company_admin"] as const),
});

type InvitationFormValues = z.infer<typeof invitationSchema>;

export function UserInvitationForm() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();
  const { getAssignableRoles } = useRoleManagement();
  const assignableRoles = getAssignableRoles();

  const form = useForm<InvitationFormValues>({
    resolver: zodResolver(invitationSchema),
    defaultValues: {
      email: "",
      role: "driver",
    },
  });

  const onSubmit = async (values: InvitationFormValues) => {
    const currentProfile = profile.get();
    if (!currentProfile?.company_id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Company ID not found",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("user_invitations").insert({
        email: values.email,
        role: values.role,
        company_id: currentProfile.company_id,
        invited_by: currentProfile.id,
        token: crypto.randomUUID(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invitation sent successfully",
      });
      form.reset();
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter email address"
                  type="email"
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
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {assignableRoles
                    .filter(role => role !== 'super_admin') // Filter out super_admin
                    .map(role => (
                      <SelectItem key={role} value={role}>{role.replace('_', ' ')}</SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            <>
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              Sending invitation...
            </>
          ) : (
            "Send Invitation"
          )}
        </Button>
      </form>
    </Form>
  );
}
