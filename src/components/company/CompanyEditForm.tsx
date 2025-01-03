import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
import { Company } from "@/types/auth";
import { Switch } from "@/components/ui/switch";
import { CompanyLogoUpload } from "./CompanyLogoUpload";

const companySchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters"),
  subscription_type: z.enum(["trial", "full"]),
  is_active: z.boolean(),
});

type CompanyFormValues = z.infer<typeof companySchema>;

interface CompanyEditFormProps {
  company: Company;
  onSuccess: () => void;
}

export function CompanyEditForm({ company, onSuccess }: CompanyEditFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: company.name,
      subscription_type: company.subscription_type,
      is_active: company.is_active,
    },
  });

  const onSubmit = async (values: CompanyFormValues) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("companies")
        .update({
          name: values.name,
          subscription_type: values.subscription_type,
          is_active: values.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", company.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Company updated successfully",
      });

      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating company",
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter company name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="subscription_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subscription Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subscription type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="trial">Trial (25 days)</SelectItem>
                  <SelectItem value="full">Full Access</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active Status</FormLabel>
                <FormMessage />
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <CompanyLogoUpload companyId={company.id} currentLogoUrl={company.logo_url} />

        <div className="flex space-x-2">
          <Button type="submit" className="flex-1" disabled={loading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}