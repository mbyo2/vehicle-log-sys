import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { VehicleSelect } from './vehicle/VehicleSelect';
import { ServiceStatus } from './vehicle/ServiceStatus';
import { TripForm } from './vehicle/TripForm';
import { CommentsHistory } from './vehicle/CommentsHistory';
import { ThemeToggle } from './ThemeToggle';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState(true);

  const [tripLog, setTripLog] = useState({
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

  useEffect(() => {
    fetchVehicles();
  }, []);

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
            kilometers,
            service_date
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setVehicles(data || []);
    } catch (error) {
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

  const handleVehicleSelect = async (vehicleId) => {
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
        setTripLog(prev => ({
          ...prev,
          vehicleId,
          plateNumber: vehicle.plate_number,
          startKilometers: lastTrip.end_kilometers
        }));
      } else {
        setTripLog(prev => ({
          ...prev,
          vehicleId,
          plateNumber: vehicle.plate_number,
          startKilometers: 0
        }));
      }
    }
  };

  const saveVehicleLog = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to save a vehicle log",
      });
      return;
    }

    if (!tripLog.vehicleId || !tripLog.date || !tripLog.startTime || !tripLog.endTime || 
        !tripLog.endKilometers || !tripLog.purpose) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      });
      return;
    }

    try {
      // First get the driver ID
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('id')
        .eq('profile_id', user.id)
        .single();

      if (driverError) throw driverError;

      const { error } = await supabase
        .from('vehicle_logs')
        .insert({
          vehicle_id: tripLog.vehicleId,
          driver_id: driverData.id,
          start_kilometers: tripLog.startKilometers,
          end_kilometers: tripLog.endKilometers,
          start_time: new Date(`${tripLog.date}T${tripLog.startTime}`).toISOString(),
          end_time: new Date(`${tripLog.date}T${tripLog.endTime}`).toISOString(),
          purpose: tripLog.purpose,
          comments: tripLog.comment || null
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Vehicle log saved successfully",
      });

      // Reset form
      setTripLog(prev => ({
        ...prev,
        date: '',
        startTime: '',
        endTime: '',
        endKilometers: 0,
        purpose: '',
        comment: ''
      }));

      // Refresh vehicles to get updated data
      fetchVehicles();
    } catch (error) {
      console.error('Error saving vehicle log:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not save vehicle log",
      });
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
                  onTripLogChange={(updates) => setTripLog(prev => ({ ...prev, ...updates }))}
                  tripPurposes={tripPurposes}
                />

                <CommentsHistory vehicle={selectedVehicle} />
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