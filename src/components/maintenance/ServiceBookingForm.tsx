import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ServiceBookingForm({ onSuccess }: { onSuccess?: () => void }) {
  const [date, setDate] = useState<Date>();
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedCenter, setSelectedCenter] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [notes, setNotes] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, plate_number, make, model');
      if (error) throw error;
      return data;
    },
  });

  const { data: serviceCenters } = useQuery({
    queryKey: ['service-centers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_centers')
        .select('id, name, address')
        .eq('is_active', true);
      if (error) throw error;
      return data;
    },
  });

  const createBooking = useMutation({
    mutationFn: async (bookingData: {
      vehicle_id: string;
      service_center_id: string;
      booking_date: string;
      service_type: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('service_bookings')
        .insert([bookingData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-bookings'] });
      toast({
        title: "Booking Created",
        description: "Service booking has been scheduled successfully.",
      });
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create booking: " + error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !selectedVehicle || !selectedCenter || !serviceType) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createBooking.mutate({
      vehicle_id: selectedVehicle,
      service_center_id: selectedCenter,
      booking_date: date.toISOString(),
      service_type: serviceType,
      notes: notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormField
        name="vehicle"
        render={() => (
          <FormItem>
            <FormLabel>Vehicle</FormLabel>
            <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a vehicle" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {vehicles?.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.plate_number} - {vehicle.make} {vehicle.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        name="serviceCenter"
        render={() => (
          <FormItem>
            <FormLabel>Service Center</FormLabel>
            <Select value={selectedCenter} onValueChange={setSelectedCenter}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a service center" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {serviceCenters?.map((center) => (
                  <SelectItem key={center.id} value={center.id}>
                    {center.name} - {center.address}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        name="date"
        render={() => (
          <FormItem className="flex flex-col">
            <FormLabel>Date</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
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

      <FormField
        name="serviceType"
        render={() => (
          <FormItem>
            <FormLabel>Service Type</FormLabel>
            <Select value={serviceType} onValueChange={setServiceType}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="fitness">Fitness Check</SelectItem>
                <SelectItem value="maintenance">Regular Maintenance</SelectItem>
                <SelectItem value="repair">Repair</SelectItem>
                <SelectItem value="inspection">General Inspection</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        name="notes"
        render={() => (
          <FormItem>
            <FormLabel>Notes</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Add any additional notes or requirements"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <Button type="submit" className="w-full">
        Schedule Service
      </Button>
    </form>
  );
}