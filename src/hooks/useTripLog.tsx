import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TripLog } from '@/types/vehicle';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function useTripLog() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tripLog, setTripLog] = useState<TripLog>({
    vehicleId: '',
    plateNumber: '',
    driver: '',
    date: '',
    startTime: '',
    endTime: '',
    startKilometers: 0,
    endKilometers: 0,
    purpose: '',
    comment: '',
    totalKilometers: 0,
    timestamp: null
  });

  const updateTripLog = (updates: Partial<TripLog>) => {
    setTripLog(prev => ({ ...prev, ...updates }));
  };

  const saveTripLog = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to save a vehicle log",
      });
      return;
    }

    if (!tripLog.vehicleId || !tripLog.date || !tripLog.startTime || !tripLog.endTime || 
        !tripLog.endKilometers || !tripLog.purpose) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      });
      return;
    }

    try {
      // First get the driver ID
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('id')
        .eq('profile_id', user.id)
        .single();

      if (driverError) throw driverError;

      const { error } = await supabase
        .from('vehicle_logs')
        .insert({
          vehicle_id: tripLog.vehicleId,
          driver_id: driverData.id,
          start_kilometers: tripLog.startKilometers,
          end_kilometers: tripLog.endKilometers,
          start_time: new Date(`${tripLog.date}T${tripLog.startTime}`).toISOString(),
          end_time: new Date(`${tripLog.date}T${tripLog.endTime}`).toISOString(),
          purpose: tripLog.purpose,
          comments: tripLog.comment || null
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Vehicle log saved successfully",
      });

      // Reset form
      setTripLog(prev => ({
        ...prev,
        date: '',
        startTime: '',
        endTime: '',
        endKilometers: 0,
        purpose: '',
        comment: ''
      }));

    } catch (error: any) {
      console.error('Error saving vehicle log:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not save vehicle log",
      });
    }
  };

  return { tripLog, updateTripLog, saveTripLog };
}