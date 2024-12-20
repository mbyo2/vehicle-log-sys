import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Vehicle } from '@/types/vehicle';
import { useToast } from '@/components/ui/use-toast';

export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          id,
          plate_number,
          make,
          model,
          year,
          service_interval,
          vehicle_services (
            id,
            kilometers,
            service_date
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setVehicles(data || []);
    } catch (error: any) {
      console.error('Error fetching vehicles:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch vehicles",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  return { vehicles, loading, refetchVehicles: fetchVehicles };
}