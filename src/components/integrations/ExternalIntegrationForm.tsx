import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
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

const integrationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  type: z.string(),
  config: z.record(z.string()),
});

type IntegrationFormValues = z.infer<typeof integrationSchema>;

export function ExternalIntegrationForm() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<IntegrationFormValues>({
    resolver: zodResolver(integrationSchema),
    defaultValues: {
      name: "",
      type: "",
      config: {},
    },
  });

  const onSubmit = async (values: IntegrationFormValues) => {
    setLoading(true);
    try {
      const { error } = await supabase.from("external_integrations").insert({
        name: values.name,
        type: values.type,
        config: values.config,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Integration added successfully",
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Integration Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter integration name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Integration Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select integration type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="fuel_card">Fuel Card</SelectItem>
                  <SelectItem value="gps">GPS Tracking</SelectItem>
                  <SelectItem value="maintenance">Maintenance Service</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading}>
          {loading ? "Adding..." : "Add Integration"}
        </Button>
      </form>
    </Form>
  );
}