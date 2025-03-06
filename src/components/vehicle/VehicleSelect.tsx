
import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface VehicleSelectProps {
  selectedId?: string;
  onSelect: (vehicleId: string) => void;
}

export const VehicleSelect = ({ selectedId, onSelect }: VehicleSelectProps) => {
  // Fetch vehicles
  const { data: vehicles, isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, plate_number');
      
      if (error) throw error;
      return data || [];
    }
  });

  return (
    <div>
      <Select value={selectedId} onValueChange={onSelect}>
        <SelectTrigger>
          <SelectValue placeholder="Select a vehicle" />
        </SelectTrigger>
        <SelectContent>
          {vehicles?.map((vehicle) => (
            <SelectItem key={vehicle.id} value={vehicle.id}>
              {vehicle.plate_number}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
