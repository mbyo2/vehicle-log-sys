import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { CompanyLogoUpload } from "./CompanyLogoUpload";
import { supabase } from "@/integrations/supabase/client";
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
import type { Company } from "@/types/auth";

const companySettingsSchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters"),
  subscriptionType: z.enum(["trial", "full"]),
  brandingPrimaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format"),
  brandingSecondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format"),
});

type CompanySettingsFormValues = z.infer<typeof companySettingsSchema>;

interface CompanySettingsFormProps {
  company: Company;
}

export function CompanySettingsForm({ company }: CompanySettingsFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<CompanySettingsFormValues>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: {
      name: company.name,
      subscriptionType: company.subscription_type,
      brandingPrimaryColor: company.branding_primary_color || "#000000",
      brandingSecondaryColor: company.branding_secondary_color || "#ffffff",
    },
  });

  const onSubmit = async (values: CompanySettingsFormValues) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name: values.name,
          subscription_type: values.subscriptionType,
          branding_primary_color: values.brandingPrimaryColor,
          branding_secondary_color: values.brandingSecondaryColor,
          updated_at: new Date().toISOString(),
        })
        .eq('id', company.id);

      if (error) throw error;

      toast({
        title: "Settings updated",
        description: "Your company settings have been updated successfully.",
      });
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <CompanyLogoUpload companyId={company.id} currentLogoUrl={company.logo_url} />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name</FormLabel>
                <FormControl>
                  <Input {...field} disabled={loading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="subscriptionType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subscription Type</FormLabel>
                <Select
                  disabled={loading}
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subscription type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="full">Full Access</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="brandingPrimaryColor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Primary Brand Color</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      {...field}
                      disabled={loading}
                      className="w-12 h-12 p-1 bg-transparent"
                    />
                    <Input
                      {...field}
                      disabled={loading}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="brandingSecondaryColor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Secondary Brand Color</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      {...field}
                      disabled={loading}
                      className="w-12 h-12 p-1 bg-transparent"
                    />
                    <Input
                      {...field}
                      disabled={loading}
                      placeholder="#ffffff"
                      className="flex-1"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            <>
              <LoadingSpinner className="mr-2" />
              Saving changes...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </form>
    </Form>
  );
}