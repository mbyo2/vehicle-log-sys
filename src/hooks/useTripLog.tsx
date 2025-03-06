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
    driverId: '',
    date: new Date().toISOString().split('T')[0],
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

    if (!tripLog.vehicleId || !tripLog.date || !tripLog.startTime || 
        !tripLog.startKilometers || !tripLog.purpose || !tripLog.driverId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('vehicle_logs')
        .insert({
          vehicle_id: tripLog.vehicleId,
          driver_id: tripLog.driverId,
          start_kilometers: tripLog.startKilometers,
          end_kilometers: tripLog.endKilometers || null,
          start_time: new Date(`${tripLog.date}T${tripLog.startTime}`).toISOString(),
          end_time: tripLog.endTime ? new Date(`${tripLog.date}T${tripLog.endTime}`).toISOString() : null,
          purpose: tripLog.purpose,
          comments: tripLog.comment || null,
          approval_status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Trip log saved successfully",
      });

      // Reset form but keep vehicle and driver info
      setTripLog(prev => ({
        ...prev,
        date: new Date().toISOString().split('T')[0],
        startTime: '',
        endTime: '',
        endKilometers: 0,
        purpose: '',
        comment: '',
        totalKilometers: 0
      }));

    } catch (error: any) {
      console.error('Error saving trip log:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not save trip log",
      });
    }
  };

  return { tripLog, updateTripLog, saveTripLog };
}
