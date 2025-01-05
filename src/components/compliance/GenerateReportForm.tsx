import { useState } from "react";
import { useForm } from "react-hook-form";
import { format, addMonths } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";

interface GenerateReportFormProps {
  onSuccess: () => void;
}

const REPORT_TYPES = [
  "Vehicle Compliance",
  "Driver Certification",
  "Maintenance Records",
  "Fuel Usage",
  "Safety Audit",
];

export function GenerateReportForm({ onSuccess }: GenerateReportFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: {
      reportType: "",
      validUntil: new Date(addMonths(new Date(), 3)),
    },
  });

  const onSubmit = async (values: any) => {
    try {
      setIsSubmitting(true);

      // Generate report data based on type
      const reportData = await generateReportData(values.reportType);

      const { error } = await supabase.from("compliance_reports").insert({
        report_type: values.reportType,
        report_data: reportData,
        valid_until: values.validUntil,
        status: "completed",
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Compliance report generated successfully",
      });

      queryClient.invalidateQueries({ queryKey: ["compliance-reports"] });
      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateReportData = async (reportType: string) => {
    // Fetch relevant data based on report type
    const reportData: any = {
      generated_at: new Date().toISOString(),
      summary: {},
    };

    switch (reportType) {
      case "Vehicle Compliance":
        const { data: vehicles } = await supabase
          .from("vehicles")
          .select("*, vehicle_services(*)");
        reportData.summary = {
          total_vehicles: vehicles?.length || 0,
          compliant_vehicles: vehicles?.filter((v) => 
            v.fitness_cert_expiry && new Date(v.fitness_cert_expiry) > new Date()
          ).length || 0,
          service_records: vehicles?.map((v) => ({
            plate_number: v.plate_number,
            services: v.vehicle_services,
          })),
        };
        break;
      // Add other report types here
    }

    return reportData;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="reportType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Report Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {REPORT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="validUntil"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Valid Until</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={
                        "w-full pl-3 text-left font-normal"
                      }
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date < new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onSuccess()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Generating..." : "Generate Report"}
          </Button>
        </div>
      </form>
    </Form>
  );
}