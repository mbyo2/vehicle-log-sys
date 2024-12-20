import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Vehicle } from '@/types/vehicle';

interface VehicleSelectProps {
  vehicles: Vehicle[];
  onVehicleSelect: (vehicleId: string) => void;
}

export const VehicleSelect = ({ vehicles, onVehicleSelect }: VehicleSelectProps) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Vehicle Details</h3>
      <Select onValueChange={onVehicleSelect}>
        <SelectTrigger>
          <SelectValue placeholder="Select Plate Number" />
        </SelectTrigger>
        <SelectContent>
          {vehicles.map((vehicle) => (
            <SelectItem key={vehicle.id} value={vehicle.id}>
              {vehicle.plate_number}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};