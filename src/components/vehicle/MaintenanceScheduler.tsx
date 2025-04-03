
import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { Vehicle } from '@/types/vehicle';

interface MaintenanceSchedulerProps {
  vehicleId?: string | null;
  onScheduleComplete?: () => void;
}

export function MaintenanceScheduler({ vehicleId, onScheduleComplete }: MaintenanceSchedulerProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<string>(vehicleId || '');
  const [serviceType, setServiceType] = useState<string>('oil_change');
  const [scheduledDate, setScheduledDate] = useState<Date | null>(new Date());
  const [description, setDescription] = useState<string>('');
  const [estimatedCost, setEstimatedCost] = useState<string>('');
  const [kilometerInterval, setKilometerInterval] = useState<string>('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: vehicles, isLoading: loadingVehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, plate_number, make, model');
      if (error) throw error;
      return data as Vehicle[];
    },
  });

  const scheduleMaintenanceMutation = useMutation({
    mutationFn: async () => {
      if (!scheduledDate || !selectedVehicle || !serviceType) {
        throw new Error("Please fill in all required fields");
      }

      const { error } = await supabase
        .from('maintenance_schedules')
        .insert({
          vehicle_id: selectedVehicle,
          service_type: serviceType,
          scheduled_date: scheduledDate.toISOString().split('T')[0],
          description: description,
          estimated_cost: estimatedCost ? parseFloat(estimatedCost) : null,
          kilometer_interval: kilometerInterval ? parseInt(kilometerInterval) : null,
          status: 'pending'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Maintenance scheduled successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['maintenance-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      onScheduleComplete?.();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const handleSchedule = () => {
    scheduleMaintenanceMutation.mutate();
  };

  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-2">
          <Label htmlFor="vehicle">Vehicle</Label>
          <Select 
            value={selectedVehicle} 
            onValueChange={setSelectedVehicle}
            disabled={loadingVehicles || !!vehicleId}
          >
            <SelectTrigger id="vehicle">
              <SelectValue placeholder="Select a vehicle" />
            </SelectTrigger>
            <SelectContent>
              {vehicles?.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id}>
                  {vehicle.plate_number} - {vehicle.make} {vehicle.model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="service-type">Service Type</Label>
          <Select value={serviceType} onValueChange={setServiceType}>
            <SelectTrigger id="service-type">
              <SelectValue placeholder="Select service type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="oil_change">Oil Change</SelectItem>
              <SelectItem value="tire_rotation">Tire Rotation</SelectItem>
              <SelectItem value="brake_service">Brake Service</SelectItem>
              <SelectItem value="engine_service">Engine Service</SelectItem>
              <SelectItem value="general_inspection">General Inspection</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="scheduled-date">Scheduled Date</Label>
          <DatePicker 
            date={scheduledDate} 
            onDateChange={setScheduledDate}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="kilometer-interval">Kilometer Interval (Optional)</Label>
          <Input
            id="kilometer-interval"
            type="number"
            value={kilometerInterval}
            onChange={(e) => setKilometerInterval(e.target.value)}
            placeholder="Enter kilometer interval (e.g. 5000)"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the maintenance"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimated-cost">Estimated Cost</Label>
          <Input
            id="estimated-cost"
            type="number"
            value={estimatedCost}
            onChange={(e) => setEstimatedCost(e.target.value)}
            placeholder="Enter estimated cost"
            min="0"
            step="0.01"
          />
        </div>

        <Button 
          onClick={handleSchedule}
          disabled={!scheduledDate || !selectedVehicle || !serviceType || scheduleMaintenanceMutation.isPending}
          className="w-full"
        >
          {scheduleMaintenanceMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Scheduling...
            </>
          ) : "Schedule Maintenance"}
        </Button>
      </CardContent>
    </Card>
  );
}
