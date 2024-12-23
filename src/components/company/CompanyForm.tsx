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

const companySchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters"),
  subscription_type: z.enum(["trial", "full"]),
});

type CompanyFormValues = z.infer<typeof companySchema>;

interface CompanyFormProps {
  onSuccess: () => void;
}

export function CompanyForm({ onSuccess }: CompanyFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      subscription_type: "trial",
    },
  });

  const onSubmit = async (values: CompanyFormValues) => {
    setLoading(true);
    try {
      const { error } = await supabase.from("companies").insert({
        name: values.name,
        subscription_type: values.subscription_type,
        trial_start_date:
          values.subscription_type === "trial" ? new Date().toISOString() : null,
        trial_end_date:
          values.subscription_type === "trial"
            ? new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString()
            : null,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Company created successfully",
      });

      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error creating company",
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
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
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

        <Button type="submit" className="w-full" disabled={loading}>
          Create Company
        </Button>
      </form>
    </Form>
  );
}