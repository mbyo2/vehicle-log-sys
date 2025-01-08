import React, { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Calendar, Shield } from 'lucide-react';
import { Vehicle } from '@/types/vehicle';
import { format, differenceInDays } from 'date-fns';
import { useNotifications } from '@/hooks/useNotifications';
import { useToast } from '@/hooks/use-toast';

interface ServiceStatusProps {
  vehicle: Vehicle;
}

export const ServiceStatus = ({ vehicle }: ServiceStatusProps) => {
  const { sendNotification } = useNotifications();
  const { toast } = useToast();

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
    if (!expiryDate) return { text: 'Not Set', color: 'text-gray-600', urgent: false };
    
    const daysRemaining = differenceInDays(new Date(expiryDate), new Date());
    
    if (daysRemaining < 0) {
      return { text: 'Expired', color: 'text-red-600', urgent: true };
    } else if (daysRemaining <= 30) {
      return { 
        text: `${daysRemaining} days left`, 
        color: 'text-yellow-600',
        urgent: daysRemaining <= 7 
      };
    }
    return { 
      text: `${daysRemaining} days left`, 
      color: 'text-green-600',
      urgent: false 
    };
  };

  useEffect(() => {
    const roadTaxStatus = getValidityStatus(vehicle.road_tax_expiry);
    const insuranceStatus = getValidityStatus(vehicle.insurance_expiry);
    
    // Handle Road Tax notifications
    if (roadTaxStatus.urgent) {
      sendNotification.mutate({
        to: ['admin'],
        type: 'document_expiry',
        subject: 'Road Tax Expiry Alert',
        details: {
          title: `Road Tax Expiring Soon - ${vehicle.plate_number}`,
          message: `Road tax for vehicle ${vehicle.plate_number} ${
            roadTaxStatus.text === 'Expired' 
              ? 'has expired' 
              : `will expire in ${roadTaxStatus.text}`
          }`
        }
      });

      toast({
        title: "Road Tax Alert",
        description: `Vehicle ${vehicle.plate_number}: Road tax ${
          roadTaxStatus.text === 'Expired' ? 'has expired' : `expires in ${roadTaxStatus.text}`
        }`,
        variant: roadTaxStatus.text === 'Expired' ? "destructive" : "default",
      });
    }

    // Handle Insurance notifications
    if (insuranceStatus.urgent) {
      sendNotification.mutate({
        to: ['admin'],
        type: 'document_expiry',
        subject: 'Insurance Expiry Alert',
        details: {
          title: `Insurance Expiring Soon - ${vehicle.plate_number}`,
          message: `Insurance for vehicle ${vehicle.plate_number} ${
            insuranceStatus.text === 'Expired' 
              ? 'has expired' 
              : `will expire in ${insuranceStatus.text}`
          }`
        }
      });

      toast({
        title: "Insurance Alert",
        description: `Vehicle ${vehicle.plate_number}: Insurance ${
          insuranceStatus.text === 'Expired' ? 'has expired' : `expires in ${insuranceStatus.text}`
        }`,
        variant: insuranceStatus.text === 'Expired' ? "destructive" : "default",
      });
    }
  }, [
    vehicle.road_tax_expiry, 
    vehicle.insurance_expiry, 
    vehicle.plate_number, 
    sendNotification, 
    toast
  ]);

  const status = calculateServiceStatus(vehicle);
  const roadTaxStatus = getValidityStatus(vehicle.road_tax_expiry);
  const insuranceStatus = getValidityStatus(vehicle.insurance_expiry);

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

        <Card className={roadTaxStatus.urgent ? 'border-red-500 shadow-red-100' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Road Tax
                </h4>
                <p className={roadTaxStatus.color}>
                  {roadTaxStatus.text}
                </p>
              </div>
              {roadTaxStatus.urgent && (
                <AlertCircle className="h-5 w-5 text-red-500 animate-pulse" />
              )}
            </div>
            {vehicle.road_tax_expiry && (
              <p className="text-sm text-gray-500 mt-2">
                Expires: {format(new Date(vehicle.road_tax_expiry), 'dd MMM yyyy')}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className={insuranceStatus.urgent ? 'border-red-500 shadow-red-100' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Insurance
                </h4>
                <p className={insuranceStatus.color}>
                  {insuranceStatus.text}
                </p>
              </div>
              {insuranceStatus.urgent && (
                <AlertCircle className="h-5 w-5 text-red-500 animate-pulse" />
              )}
            </div>
            {vehicle.insurance_expiry && (
              <p className="text-sm text-gray-500 mt-2">
                Expires: {format(new Date(vehicle.insurance_expiry), 'dd MMM yyyy')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};