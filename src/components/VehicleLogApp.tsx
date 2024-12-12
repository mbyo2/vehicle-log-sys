import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Vehicle {
  plateNumber: string;
  currentKilometers: number;
  lastServiceKilometers: number;
  serviceInterval: number;
  comments: Array<{
    text: string;
    timestamp: string;
  }>;
}

interface TripLog {
  plateNumber: string;
  driver: string;
  date: string;
  startTime: string;
  endTime: string;
  startKilometers: number;
  endKilometers: number;
  purpose: string;
  comment: string;
  totalKilometers: number;
  timestamp: string | null;
}

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

    const finalLogEntry = {
      ...tripLog,
      timestamp: new Date().toLocaleString()
    };

    toast({
      title: "Success",
      description: "Vehicle log saved successfully",
    });

    // Reset form
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
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Munjila Otwow Transport Vehicle Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Vehicle Details</h3>
              <Select 
                onValueChange={(value) => {
                  const selectedVehicle = vehicles.find(v => v.plateNumber === value);
                  if (selectedVehicle) {
                    setTripLog(prev => ({
                      ...prev, 
                      plateNumber: value,
                      startKilometers: selectedVehicle.currentKilometers
                    }));
                  }
                }}
              >
                <SelectTrigger className="w-full">
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

            {tripLog.plateNumber && (
              <Card className={`${calculateServiceStatus(vehicles.find(v => v.plateNumber === tripLog.plateNumber)!).color}`}>
                <CardContent className="p-4 flex items-center space-x-3">
                  <AlertCircle />
                  <div>
                    <h4 className="font-semibold">Service Status</h4>
                    <p>
                      Current Kilometers: {vehicles.find(v => v.plateNumber === tripLog.plateNumber)!.currentKilometers} km
                      {' | '}
                      Status: {calculateServiceStatus(vehicles.find(v => v.plateNumber === tripLog.plateNumber)!).text}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <Input 
                placeholder="Driver Name" 
                value={tripLog.driver}
                onChange={(e) => setTripLog(prev => ({...prev, driver: e.target.value}))}
              />
              <Input 
                type="date"
                value={tripLog.date}
                onChange={(e) => setTripLog(prev => ({...prev, date: e.target.value}))}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="font-semibold">Start Point</h4>
                <Input 
                  type="number"
                  placeholder="Start Kilometers" 
                  value={tripLog.startKilometers}
                  readOnly
                />
                <Input 
                  type="time"
                  value={tripLog.startTime}
                  onChange={(e) => setTripLog(prev => ({...prev, startTime: e.target.value}))}
                />
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">End Point</h4>
                <Input 
                  type="number"
                  placeholder="End Kilometers" 
                  value={tripLog.endKilometers || ''}
                  onChange={(e) => setTripLog(prev => ({...prev, endKilometers: Number(e.target.value)}))}
                />
                <Input 
                  type="time"
                  value={tripLog.endTime}
                  onChange={(e) => setTripLog(prev => ({...prev, endTime: e.target.value}))}
                />
              </div>
            </div>

            <div className="space-y-4">
              <Input 
                placeholder="Purpose of Trip" 
                value={tripLog.purpose}
                onChange={(e) => setTripLog(prev => ({...prev, purpose: e.target.value}))}
              />
              <Textarea 
                placeholder="Additional Comments about the Vehicle" 
                value={tripLog.comment}
                onChange={(e) => setTripLog(prev => ({...prev, comment: e.target.value}))}
              />
            </div>

            {tripLog.plateNumber && (
              <Card>
                <CardHeader>
                  <CardTitle>Vehicle Comments History</CardTitle>
                </CardHeader>
                <CardContent>
                  {vehicles.find(v => v.plateNumber === tripLog.plateNumber)!.comments.length > 0 ? (
                    vehicles.find(v => v.plateNumber === tripLog.plateNumber)!.comments.map((comment, index) => (
                      <div key={index} className="border-b py-2 last:border-b-0">
                        <p>{comment.text}</p>
                        <small className="text-gray-500">{comment.timestamp}</small>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No previous comments</p>
                  )}
                </CardContent>
              </Card>
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