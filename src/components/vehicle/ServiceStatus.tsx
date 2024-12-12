import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Vehicle } from '@/types/vehicle';

interface ServiceStatusProps {
  vehicle: Vehicle;
}

export const ServiceStatus = ({ vehicle }: ServiceStatusProps) => {
  const calculateServiceStatus = (vehicle: Vehicle) => {
    const kilometersToNextService = vehicle.serviceInterval - 
      (vehicle.currentKilometers - vehicle.lastServiceKilometers);
    
    if (kilometersToNextService <= 0) {
      return { text: 'Overdue for Service', color: 'bg-red-50 text-red-600' };
    } else if (kilometersToNextService <= 500) {
      return { text: 'Service Soon', color: 'bg-yellow-50 text-yellow-600' };
    }
    return { text: 'On Track', color: 'bg-green-50 text-green-600' };
  };

  const status = calculateServiceStatus(vehicle);

  return (
    <div className="space-y-4">
      <div className="bg-primary/10 rounded-lg p-4 text-center">
        <h3 className="text-2xl font-bold mb-2">Current Kilometers</h3>
        <p className="text-4xl font-bold text-primary">{vehicle.currentKilometers} km</p>
      </div>
      
      <Card className={status.color}>
        <CardContent className="p-4 flex items-center space-x-3">
          <AlertCircle />
          <div>
            <h4 className="font-semibold">Service Status</h4>
            <p>Status: {status.text}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};