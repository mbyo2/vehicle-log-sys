import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Vehicle } from '@/types/vehicle';
import { format, differenceInDays } from 'date-fns';

interface ServiceStatusProps {
  vehicle: Vehicle;
}

export const ServiceStatus = ({ vehicle }: ServiceStatusProps) => {
  const calculateServiceStatus = (vehicle: Vehicle) => {
    const kilometersToNextService = vehicle.service_interval - 
      ((vehicle.current_kilometers || 0) - (vehicle.last_service_kilometers || 0));
    
    if (kilometersToNextService <= 0) {
      return { text: 'Overdue for Service', color: 'bg-red-50 text-red-600' };
    } else if (kilometersToNextService <= 500) {
      return { text: 'Service Soon', color: 'bg-yellow-50 text-yellow-600' };
    }
    return { text: 'On Track', color: 'bg-green-50 text-green-600' };
  };

  const getValidityStatus = (expiryDate: string | undefined) => {
    if (!expiryDate) return { text: 'Not Set', color: 'text-gray-600' };
    
    const daysRemaining = differenceInDays(new Date(expiryDate), new Date());
    
    if (daysRemaining < 0) {
      return { text: 'Expired', color: 'text-red-600' };
    } else if (daysRemaining <= 30) {
      return { text: `${daysRemaining} days left`, color: 'text-yellow-600' };
    }
    return { text: `${daysRemaining} days left`, color: 'text-green-600' };
  };

  const status = calculateServiceStatus(vehicle);

  return (
    <div className="space-y-4">
      <div className="bg-primary/10 rounded-lg p-4 text-center">
        <h3 className="text-2xl font-bold mb-2">Current Kilometers</h3>
        <p className="text-4xl font-bold text-primary">{vehicle.current_kilometers || 0} km</p>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold">Fitness Certificate</h4>
            <p className={getValidityStatus(vehicle.fitness_expiry).color}>
              {getValidityStatus(vehicle.fitness_expiry).text}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold">Road Tax</h4>
            <p className={getValidityStatus(vehicle.road_tax_expiry).color}>
              {getValidityStatus(vehicle.road_tax_expiry).text}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold">Insurance</h4>
            <p className={getValidityStatus(vehicle.insurance_expiry).color}>
              {getValidityStatus(vehicle.insurance_expiry).text}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};