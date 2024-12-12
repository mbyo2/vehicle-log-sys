import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Vehicle } from '@/types/vehicle';

interface VehicleSelectProps {
  vehicles: Vehicle[];
  onVehicleSelect: (plateNumber: string) => void;
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
            <SelectItem key={vehicle.plateNumber} value={vehicle.plateNumber}>
              {vehicle.plateNumber}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};