
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Vehicle } from '@/types/vehicle';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from '@/components/ui/textarea';

// Define the form schema using zod
const vehicleSchema = z.object({
  plate_number: z.string().min(1, 'Plate number is required'),
  make: z.string().min(1, 'Vehicle make is required'),
  model: z.string().min(1, 'Vehicle model is required'),
  year: z.string().refine((val) => !isNaN(parseInt(val)) && parseInt(val) > 1900, {
    message: 'Please enter a valid year',
  }),
  service_interval: z.string().refine((val) => !isNaN(parseInt(val)) && parseInt(val) > 0, {
    message: 'Service interval must be a positive number',
  }),
  current_kilometers: z.string().refine((val) => !isNaN(parseInt(val)) && parseInt(val) >= 0, {
    message: 'Current kilometers must be a non-negative number',
  }),
  fitness_expiry: z.string().optional(),
  road_tax_expiry: z.string().optional(),
  insurance_expiry: z.string().optional(),
  last_service_kilometers: z.string().optional(),
  comments: z.string().optional(),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

interface VehicleFormProps {
  vehicle?: Vehicle;
  onSuccess: () => void;
}

export function VehicleForm({ vehicle, onSuccess }: VehicleFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      plate_number: vehicle?.plate_number || '',
      make: vehicle?.make || '',
      model: vehicle?.model || '',
      year: vehicle?.year?.toString() || '',
      service_interval: vehicle?.service_interval?.toString() || '5000',
      current_kilometers: vehicle?.current_kilometers?.toString() || '0',
      last_service_kilometers: vehicle?.last_service_kilometers?.toString() || '0',
      fitness_expiry: vehicle?.fitness_expiry || '',
      road_tax_expiry: vehicle?.road_tax_expiry || '',
      insurance_expiry: vehicle?.insurance_expiry || '',
      comments: '',
    },
  });

  const onSubmit = async (data: VehicleFormValues) => {
    try {
      setLoading(true);
      
      const vehicleData = {
        plate_number: data.plate_number,
        make: data.make,
        model: data.model,
        year: parseInt(data.year),
        service_interval: parseInt(data.service_interval),
        current_kilometers: parseInt(data.current_kilometers),
        last_service_kilometers: data.last_service_kilometers ? parseInt(data.last_service_kilometers) : null,
        fitness_expiry: data.fitness_expiry || null,
        road_tax_expiry: data.road_tax_expiry || null,
        insurance_expiry: data.insurance_expiry || null,
      };

      if (vehicle) {
        const { error } = await supabase
          .from('vehicles')
          .update(vehicleData)
          .eq('id', vehicle.id);

        if (error) throw error;
        
        // Add comment if provided
        if (data.comments) {
          await supabase.from('vehicle_comments').insert({
            vehicle_id: vehicle.id,
            text: data.comments,
            timestamp: new Date().toISOString()
          });
        }
        
        toast({ title: "Vehicle updated successfully" });
      } else {
        const { data: newVehicle, error } = await supabase
          .from('vehicles')
          .insert(vehicleData)
          .select('id')
          .single();

        if (error) throw error;
        
        // Add comment if provided
        if (data.comments && newVehicle) {
          await supabase.from('vehicle_comments').insert({
            vehicle_id: newVehicle.id,
            text: data.comments,
            timestamp: new Date().toISOString()
          });
        }
        
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            name="last_service_kilometers"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Service Kilometers</FormLabel>
                <FormControl>
                  <Input {...field} type="number" placeholder="Enter last service kilometers" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fitness_expiry"
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
        </div>

        <FormField
          control={form.control}
          name="comments"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comments</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder="Add comments about this vehicle" 
                  rows={3}
                />
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
