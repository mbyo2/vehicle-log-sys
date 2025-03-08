
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VehicleLocationMap } from '@/components/vehicle/VehicleLocationMap';
import { FuelCardIntegration } from '@/components/vehicle/FuelCardIntegration';
import { MaintenanceProviderIntegration } from '@/components/vehicle/MaintenanceProviderIntegration';
import { VehicleSelect } from '@/components/vehicle/VehicleSelect';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Navigation, CreditCard, Wrench } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function Integrations() {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">External Integrations</h1>
        <p className="text-muted-foreground">
          Connect and manage external services for GPS tracking, fuel cards, and maintenance providers.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Vehicle</CardTitle>
          <CardDescription>
            Choose a vehicle to configure integrations for
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VehicleSelect 
            selectedId={selectedVehicleId}
            onSelect={setSelectedVehicleId}
          />
          
          {!selectedVehicleId && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No vehicle selected</AlertTitle>
              <AlertDescription>
                Please select a vehicle to configure integrations
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {selectedVehicleId && (
        <Tabs defaultValue="gps" className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full md:w-auto">
            <TabsTrigger value="gps" className="flex items-center space-x-2">
              <Navigation className="h-4 w-4" />
              <span>GPS Tracking</span>
            </TabsTrigger>
            <TabsTrigger value="fuel" className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span>Fuel Card</span>
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="flex items-center space-x-2">
              <Wrench className="h-4 w-4" />
              <span>Maintenance</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="gps" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <VehicleLocationMap vehicleId={selectedVehicleId} />
            </div>
          </TabsContent>
          
          <TabsContent value="fuel" className="space-y-4">
            <FuelCardIntegration vehicleId={selectedVehicleId} />
          </TabsContent>
          
          <TabsContent value="maintenance" className="space-y-4">
            <MaintenanceProviderIntegration vehicleId={selectedVehicleId} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
