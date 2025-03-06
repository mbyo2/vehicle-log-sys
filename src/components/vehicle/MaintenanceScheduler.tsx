
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Vehicle } from '@/types/vehicle';

interface MaintenanceSchedulerProps {
  vehicle: Vehicle;
  onScheduleComplete?: () => void;
}

export function MaintenanceScheduler({ vehicle, onScheduleComplete }: MaintenanceSchedulerProps) {
  const [serviceType, setServiceType] = useState<string>('oil_change');
  const [scheduledDate, setScheduledDate] = useState<Date | null>(new Date());
  const [description, setDescription] = useState<string>('');
  const [estimatedCost, setEstimatedCost] = useState<string>('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const scheduleMaintenanceMutation = useMutation({
    mutationFn: async () => {
      if (!scheduledDate) {
        throw new Error("Please select a date for maintenance");
      }

      const { error } = await supabase
        .from('maintenance_schedules')
        .insert({
          vehicle_id: vehicle.id,
          service_type: serviceType,
          scheduled_date: scheduledDate.toISOString().split('T')[0],
          description: description,
          estimated_cost: estimatedCost ? parseFloat(estimatedCost) : null,
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
      <CardHeader>
        <CardTitle>Schedule Maintenance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
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
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the maintenance"
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
          />
        </div>

        <Button 
          onClick={handleSchedule}
          disabled={!scheduledDate || scheduleMaintenanceMutation.isPending}
          className="w-full"
        >
          {scheduleMaintenanceMutation.isPending ? "Scheduling..." : "Schedule Maintenance"}
        </Button>
      </CardContent>
    </Card>
  );
}
