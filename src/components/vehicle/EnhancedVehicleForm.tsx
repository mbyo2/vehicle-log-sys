
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Vehicle } from '@/types/vehicle';
import { useAuth } from '@/contexts/AuthContext';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Car, FileText, Settings } from 'lucide-react';

const enhancedVehicleSchema = z.object({
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
  fitness_cert_expiry: z.string().optional(),
  road_tax_expiry: z.string().optional(),
  insurance_expiry: z.string().optional(),
  last_service_kilometers: z.string().optional(),
  comments: z.string().optional(),
});

type EnhancedVehicleFormValues = z.infer<typeof enhancedVehicleSchema>;

interface EnhancedVehicleFormProps {
  vehicle?: Vehicle;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function EnhancedVehicleForm({ vehicle, onSuccess, onCancel }: EnhancedVehicleFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();
  
  const form = useForm<EnhancedVehicleFormValues>({
    resolver: zodResolver(enhancedVehicleSchema),
    defaultValues: {
      plate_number: vehicle?.plate_number || '',
      make: vehicle?.make || '',
      model: vehicle?.model || '',
      year: vehicle?.year?.toString() || '',
      service_interval: vehicle?.service_interval?.toString() || '5000',
      current_kilometers: vehicle?.current_kilometers?.toString() || '0',
      last_service_kilometers: vehicle?.last_service_kilometers?.toString() || '0',
      fitness_cert_expiry: vehicle?.fitness_cert_expiry || '',
      road_tax_expiry: vehicle?.road_tax_expiry || '',
      insurance_expiry: vehicle?.insurance_expiry || '',
      comments: '',
    },
  });

  const onSubmit = async (data: EnhancedVehicleFormValues) => {
    try {
      setLoading(true);
      const currentProfile = profile.get();
      
      if (!currentProfile?.company_id) {
        throw new Error('Company ID not found');
      }
      
      const vehicleData = {
        plate_number: data.plate_number,
        make: data.make,
        model: data.model,
        year: parseInt(data.year),
        service_interval: parseInt(data.service_interval),
        current_kilometers: parseInt(data.current_kilometers),
        last_service_kilometers: data.last_service_kilometers ? parseInt(data.last_service_kilometers) : null,
        fitness_cert_expiry: data.fitness_cert_expiry || null,
        road_tax_expiry: data.road_tax_expiry || null,
        insurance_expiry: data.insurance_expiry || null,
        company_id: currentProfile.company_id,
      };

      if (vehicle) {
        const { error } = await supabase
          .from('vehicles')
          .update(vehicleData)
          .eq('id', vehicle.id);

        if (error) throw error;
        
        toast({ title: "Vehicle updated successfully" });
      } else {
        const { data: newVehicle, error } = await supabase
          .from('vehicles')
          .insert(vehicleData)
          .select('id')
          .single();

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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            {vehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
          </CardTitle>
          <CardDescription>
            {vehicle ? 'Update vehicle information' : 'Enter the details for the new vehicle'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Vehicle Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Basic Information
                </h3>
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
                          <Input {...field} placeholder="e.g. Toyota, Ford, BMW" />
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
                          <Input {...field} placeholder="e.g. Camry, F-150, X3" />
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
                          <Input {...field} type="number" placeholder="e.g. 2020" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Service Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Service Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="service_interval"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Interval (km)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="e.g. 5000" />
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
                          <Input {...field} type="number" placeholder="Current odometer reading" />
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
                          <Input {...field} type="number" placeholder="Kilometers at last service" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Document Expiry Dates */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Document Expiry Dates
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                </div>
              </div>

              {/* Comments */}
              <FormField
                control={form.control}
                name="comments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Comments</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Any additional notes about this vehicle" 
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Saving...' : vehicle ? 'Update Vehicle' : 'Add Vehicle'}
                </Button>
                {onCancel && (
                  <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
