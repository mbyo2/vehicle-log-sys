import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { VehicleSelect } from './vehicle/VehicleSelect';
import { ServiceStatus } from './vehicle/ServiceStatus';
import { TripForm } from './vehicle/TripForm';
import { CommentsHistory } from './vehicle/CommentsHistory';
import { ThemeToggle } from './ThemeToggle';
import { Vehicle, TripLog } from '@/types/vehicle';

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
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    {
      plateNumber: 'KAA 123A',
      currentKilometers: 45000,
      lastServiceKilometers: 40000,
      serviceInterval: 5000,
      comments: []
    },
    {
      plateNumber: 'KBB 456B',
      currentKilometers: 30000,
      lastServiceKilometers: 25000,
      serviceInterval: 5000,
      comments: []
    }
  ]);

  const [tripLog, setTripLog] = useState<TripLog>({
    plateNumber: '',
    driver: '',
    date: '',
    startTime: '',
    endTime: '',
    startKilometers: 0,
    endKilometers: 0,
    purpose: '',
    comment: '',
    totalKilometers: 0,
    timestamp: null
  });

  const handleVehicleSelect = (plateNumber: string) => {
    const selectedVehicle = vehicles.find(v => v.plateNumber === plateNumber);
    if (selectedVehicle) {
      setTripLog(prev => ({
        ...prev,
        plateNumber,
        startKilometers: selectedVehicle.currentKilometers
      }));
    }
  };

  const saveVehicleLog = () => {
    const selectedVehicle = vehicles.find(v => v.plateNumber === tripLog.plateNumber);
    
    if (!selectedVehicle) {
      toast({
        title: "Error",
        description: "Please select a vehicle",
        variant: "destructive"
      });
      return;
    }

    if (!tripLog.driver || !tripLog.date || !tripLog.startTime || !tripLog.endTime || 
        !tripLog.endKilometers || !tripLog.purpose) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const updatedVehicles = vehicles.map(vehicle => 
      vehicle.plateNumber === tripLog.plateNumber
        ? {
            ...vehicle,
            currentKilometers: tripLog.endKilometers,
            comments: tripLog.comment 
              ? [...vehicle.comments, {
                  text: tripLog.comment,
                  timestamp: new Date().toLocaleString()
                }]
              : vehicle.comments
          }
        : vehicle
    );

    setVehicles(updatedVehicles);

    toast({
      title: "Success",
      description: "Vehicle log saved successfully",
    });

    setTripLog(prev => ({
      ...prev,
      driver: '',
      date: '',
      startTime: '',
      endTime: '',
      endKilometers: 0,
      purpose: '',
      comment: ''
    }));
  };
  
  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Munjila Otwow Transport Limited</h1>
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

            {tripLog.plateNumber && (
              <>
                <ServiceStatus 
                  vehicle={vehicles.find(v => v.plateNumber === tripLog.plateNumber)!}
                />
                
                <TripForm 
                  tripLog={tripLog}
                  onTripLogChange={(updates) => setTripLog(prev => ({ ...prev, ...updates }))}
                  tripPurposes={tripPurposes}
                />

                <CommentsHistory 
                  vehicle={vehicles.find(v => v.plateNumber === tripLog.plateNumber)!}
                />
              </>
            )}

            <Button 
              className="w-full"
              onClick={saveVehicleLog}
            >
              Save Vehicle Log
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VehicleLogApp;