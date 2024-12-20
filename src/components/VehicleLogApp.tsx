import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VehicleSelect } from './vehicle/VehicleSelect';
import { ServiceStatus } from './vehicle/ServiceStatus';
import { TripForm } from './vehicle/TripForm';
import { CommentsHistory } from './vehicle/CommentsHistory';
import { ThemeToggle } from './ThemeToggle';
import { useVehicles } from '@/hooks/useVehicles';
import { useTripLog } from '@/hooks/useTripLog';
import { Vehicle } from '@/types/vehicle';
import { supabase } from '@/integrations/supabase/client';

const tripPurposes = [
  "Cash Movement", "Client Visits", "Document Delivery", "Staff Shuttle",
  "Event Logistics", "Site Visits", "Material Delivery", "Equipment Maintenance",
  "Team Transport", "Permit Acquisition", "Client Audits", "Document Collection",
  "Internal Team Coordination", "Training/Workshops", "Data Retrieval",
  "Patrol Operations", "Emergency Response", "Client Onboarding",
  "Equipment Delivery", "Shift Changeovers", "Vehicle Maintenance",
  "Vendor Visits", "Training & Team Development", "Event Logistics"
];

const VehicleLogApp = () => {
  const { vehicles, loading } = useVehicles();
  const { tripLog, updateTripLog, saveTripLog } = useTripLog();
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const handleVehicleSelect = async (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      setSelectedVehicle(vehicle);
      
      // Get the last trip for this vehicle to set the start kilometers
      const { data: lastTrip, error } = await supabase
        .from('vehicle_logs')
        .select('end_kilometers')
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && lastTrip) {
        updateTripLog({
          vehicleId,
          plateNumber: vehicle.plate_number,
          startKilometers: lastTrip.end_kilometers
        });
      } else {
        updateTripLog({
          vehicleId,
          plateNumber: vehicle.plate_number,
          startKilometers: 0
        });
      }
    }
  };
  
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Vehicle Log Entry</h1>
        <ThemeToggle />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <VehicleSelect 
              vehicles={vehicles}
              onVehicleSelect={handleVehicleSelect}
            />

            {selectedVehicle && (
              <>
                <ServiceStatus vehicle={selectedVehicle} />
                
                <TripForm 
                  tripLog={tripLog}
                  onTripLogChange={updateTripLog}
                  tripPurposes={tripPurposes}
                />

                <CommentsHistory vehicle={selectedVehicle} />
              </>
            )}

            <button 
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md"
              onClick={saveTripLog}
            >
              Save Vehicle Log
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VehicleLogApp;