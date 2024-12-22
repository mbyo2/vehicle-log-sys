import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Vehicle } from '@/types/vehicle';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface VehicleFormProps {
  vehicle?: Vehicle;
  onSuccess: () => void;
}

export function VehicleForm({ vehicle, onSuccess }: VehicleFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const form = useForm({
    defaultValues: {
      plate_number: vehicle?.plate_number || '',
      make: vehicle?.make || '',
      model: vehicle?.model || '',
      year: vehicle?.year?.toString() || '',
      service_interval: vehicle?.service_interval?.toString() || '5000',
      current_kilometers: vehicle?.current_kilometers?.toString() || '0',
      fitness_cert_expiry: vehicle?.fitness_expiry || '',
      road_tax_expiry: vehicle?.road_tax_expiry || '',
      insurance_expiry: vehicle?.insurance_expiry || '',
    },
  });

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);
      
      const vehicleData = {
        plate_number: data.plate_number,
        make: data.make,
        model: data.model,
        year: parseInt(data.year),
        service_interval: parseInt(data.service_interval),
        current_kilometers: parseInt(data.current_kilometers),
        fitness_cert_expiry: data.fitness_cert_expiry || null,
        road_tax_expiry: data.road_tax_expiry || null,
        insurance_expiry: data.insurance_expiry || null,
      };

      if (vehicle) {
        const { error } = await supabase
          .from('vehicles')
          .update(vehicleData)
          .eq('id', vehicle.id);

        if (error) throw error;
        toast({ title: "Vehicle updated successfully" });
      } else {
        const { error } = await supabase
          .from('vehicles')
          .insert(vehicleData);

        if (error) throw error;
        toast({ title: "Vehicle added successfully" });
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
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
          name="plate_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plate Number</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter plate number" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="make"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Make</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter vehicle make" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="model"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Model</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter vehicle model" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="year"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Year</FormLabel>
              <FormControl>
                <Input {...field} type="number" placeholder="Enter vehicle year" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="service_interval"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Interval (km)</FormLabel>
              <FormControl>
                <Input {...field} type="number" placeholder="Enter service interval" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="current_kilometers"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Kilometers</FormLabel>
              <FormControl>
                <Input {...field} type="number" placeholder="Enter current kilometers" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fitness_cert_expiry"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fitness Certificate Expiry</FormLabel>
              <FormControl>
                <Input {...field} type="date" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="road_tax_expiry"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Road Tax Expiry</FormLabel>
              <FormControl>
                <Input {...field} type="date" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="insurance_expiry"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Insurance Expiry</FormLabel>
              <FormControl>
                <Input {...field} type="date" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Saving...' : vehicle ? 'Update Vehicle' : 'Add Vehicle'}
        </Button>
      </form>
    </Form>
  );
}