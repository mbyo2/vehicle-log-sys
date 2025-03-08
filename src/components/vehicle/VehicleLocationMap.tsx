
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, MapPin } from 'lucide-react';
import { useGPSTracking } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface VehicleLocation {
  vehicleId: string;
  plateNumber: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  driver: string;
}

// Adjust the interface to match the actual data structure from Supabase
interface TripLogResult {
  id: string;
  vehicle_id: string;
  vehicles: { plate_number: string };
  drivers: { profiles: { full_name: string } | null };
  start_location: { latitude: number; longitude: number } | null;
  end_location: { latitude: number; longitude: number } | null;
  start_time: string;
}

export const VehicleLocationMap = ({ vehicleId }: { vehicleId?: string }) => {
  const [locations, setLocations] = useState<VehicleLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { location, startTracking, stopTracking, isTracking } = useGPSTracking();
  
  // Fetch recent vehicle locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('trip_logs')
          .select(`
            id, 
            vehicle_id,
            vehicles(plate_number),
            drivers(profiles(full_name)),
            start_location,
            end_location,
            start_time
          `)
          .order('start_time', { ascending: false })
          .limit(10);

        if (error) throw error;

        // Convert the raw data to our expected format
        if (data) {
          const formattedLocations = data
            .filter(log => log.start_location)
            .map(log => ({
              vehicleId: log.vehicle_id,
              plateNumber: log.vehicles?.plate_number || 'Unknown',
              latitude: log.start_location!.latitude,
              longitude: log.start_location!.longitude,
              timestamp: log.start_time,
              driver: log.drivers?.profiles?.full_name || 'Unknown'
            }));

          setLocations(formattedLocations);
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load vehicle locations"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();
    // Set up polling every 30 seconds for real-time-like updates
    const interval = setInterval(fetchLocations, 30000);
    
    return () => clearInterval(interval);
  }, [toast]);

  const sendLocationUpdate = async () => {
    if (!location || !vehicleId) return;
    
    try {
      const result = await supabase.functions.invoke('handle-integration', {
        body: {
          type: 'gps',
          action: 'update_location',
          payload: {
            vehicleId,
            latitude: location.latitude,
            longitude: location.longitude,
            timestamp: new Date().toISOString()
          }
        }
      });
      
      if (result.error) throw new Error(result.error.message);
      
      toast({
        title: "Location updated",
        description: "Vehicle location has been updated successfully"
      });
    } catch (error) {
      console.error('Error updating location:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update location"
      });
    }
  };

  const renderLocations = () => {
    if (isLoading) return <p>Loading location data...</p>;
    
    if (locations.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
          <AlertTriangle className="h-10 w-10 mb-2" />
          <p>No location data available. Start tracking to record vehicle locations.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {locations.map((loc, index) => (
          <div key={index} className="flex items-start border-b pb-2">
            <MapPin className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-1" />
            <div>
              <p className="font-medium">{loc.plateNumber}</p>
              <p className="text-sm text-muted-foreground">
                Driver: {loc.driver}
              </p>
              <p className="text-xs text-muted-foreground">
                Coordinates: {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(loc.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Vehicle Location Tracking</span>
          {vehicleId && (
            <div>
              {isTracking ? (
                <Button variant="outline" size="sm" onClick={stopTracking}>
                  Stop Tracking
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={startTracking}>
                  Start Tracking
                </Button>
              )}
              
              {location && (
                <Button 
                  className="ml-2" 
                  size="sm" 
                  onClick={sendLocationUpdate}
                >
                  Send Location
                </Button>
              )}
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {location && vehicleId && (
          <div className="bg-primary/10 p-3 rounded-md mb-4">
            <p className="font-medium">Current Location</p>
            <p className="text-sm">
              Latitude: {location.latitude.toFixed(6)}, 
              Longitude: {location.longitude.toFixed(6)}
            </p>
          </div>
        )}
        
        {renderLocations()}
      </CardContent>
    </Card>
  );
};
