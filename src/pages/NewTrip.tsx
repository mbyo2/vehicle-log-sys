
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TripForm } from '@/components/vehicle/TripForm';
import { useTripLog } from '@/hooks/useTripLog';
import { useNavigate, useParams } from 'react-router-dom';
import { useVehicles } from '@/hooks/useVehicles';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIsMobile } from '@/hooks/useIsMobile';
import { AlertCircle, Save } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function NewTrip() {
  const { vehicleId } = useParams();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(vehicleId || '');
  const { vehicles, loading } = useVehicles();
  const { tripLog, handleTripLogChange, submitTripLog, isSubmitting, isOnline, tripPurposes } = useTripLog(selectedVehicleId);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (vehicleId) {
      setSelectedVehicleId(vehicleId);
    }
  }, [vehicleId]);

  const handleVehicleChange = (value: string) => {
    setSelectedVehicleId(value);
    handleTripLogChange({ vehicle_id: value });
  };

  const handleSave = async () => {
    await submitTripLog();
    if (isOnline) {
      navigate('/trips');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center">
          <h1 className={`text-2xl md:text-3xl font-bold ${isMobile ? 'text-center mb-4' : ''}`}>
            New Trip Log
          </h1>
          <Button onClick={handleSave} disabled={isSubmitting} className="flex gap-2 items-center">
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Trip Log
          </Button>
        </div>

        {!isOnline && (
          <Alert variant="default" className="bg-yellow-50 text-yellow-900 border-yellow-200">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>You're working offline</AlertTitle>
            <AlertDescription>
              Trip logs will be saved locally and synchronized when you're back online.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vehicle Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Select 
                value={selectedVehicleId} 
                onValueChange={handleVehicleChange}
                disabled={loading || isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map(vehicle => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.plate_number} - {vehicle.make} {vehicle.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedVehicleId && (
                <TripForm 
                  tripLog={tripLog} 
                  onTripLogChange={handleTripLogChange} 
                  tripPurposes={tripPurposes}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
