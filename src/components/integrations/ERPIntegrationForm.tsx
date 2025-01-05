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
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Database, Link, Settings } from "lucide-react";

const erpSchema = z.object({
  system_type: z.enum([
    "netsuite",
    "odoo",
    "sap",
    "erpnext",
    "dynamics365",
    "acumatica",
    "katana",
    "sage",
    "infor",
    "sds4",
  ]),
  config: z.object({
    api_url: z.string().url("Please enter a valid URL"),
    sync_interval: z.string(),
  }),
  credentials: z.object({
    api_key: z.string().min(1, "API Key is required"),
    api_secret: z.string().optional(),
  }),
});

type ERPFormValues = z.infer<typeof erpSchema>;

const ERP_SYSTEMS = [
  { id: "netsuite", name: "Oracle NetSuite ERP", icon: Database },
  { id: "odoo", name: "Odoo ERP", icon: Settings },
  { id: "sap", name: "SAP S/4HANA", icon: Database },
  { id: "erpnext", name: "ERPNext", icon: Link },
  { id: "dynamics365", name: "Microsoft Dynamics 365", icon: Settings },
  { id: "acumatica", name: "Acumatica Cloud ERP", icon: Database },
  { id: "katana", name: "Katana", icon: Settings },
  { id: "sage", name: "Sage Intacct", icon: Database },
  { id: "infor", name: "Infor", icon: Settings },
  { id: "sds4", name: "SDS4 Distribution Software", icon: Database },
];

export function ERPIntegrationForm() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<ERPFormValues>({
    resolver: zodResolver(erpSchema),
    defaultValues: {
      config: {
        api_url: "",
        sync_interval: "1h",
      },
      credentials: {
        api_key: "",
        api_secret: "",
      },
    },
  });

  const onSubmit = async (values: ERPFormValues) => {
    setLoading(true);
    try {
      const { error } = await supabase.from("erp_integrations").insert({
        system_type: values.system_type,
        config: values.config,
        credentials: values.credentials,
        sync_frequency: values.config.sync_interval,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "ERP integration configured successfully",
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="system_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ERP System</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ERP system" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ERP_SYSTEMS.map((system) => (
                    <SelectItem key={system.id} value={system.id}>
                      <div className="flex items-center gap-2">
                        <system.icon className="h-4 w-4" />
                        <span>{system.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Choose your ERP system to configure the integration
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="config.api_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>API URL</FormLabel>
              <FormControl>
                <Input placeholder="https://api.erp-system.com" {...field} />
              </FormControl>
              <FormDescription>
                The base URL for your ERP system's API
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="config.sync_interval"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sync Interval</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sync interval" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="15m">Every 15 minutes</SelectItem>
                  <SelectItem value="30m">Every 30 minutes</SelectItem>
                  <SelectItem value="1h">Every hour</SelectItem>
                  <SelectItem value="6h">Every 6 hours</SelectItem>
                  <SelectItem value="12h">Every 12 hours</SelectItem>
                  <SelectItem value="24h">Every 24 hours</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                How often should we sync data with your ERP system
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="credentials.api_key"
          render={({ field }) => (
            <FormItem>
              <FormLabel>API Key</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormDescription>
                Your ERP system API key for authentication
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="credentials.api_secret"
          render={({ field }) => (
            <FormItem>
              <FormLabel>API Secret (Optional)</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormDescription>
                Additional authentication secret if required
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading}>
          {loading ? "Configuring..." : "Configure Integration"}
        </Button>
      </form>
    </Form>
  );
}