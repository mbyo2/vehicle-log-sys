
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TripList } from '@/components/vehicle/TripList';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { TripLog } from '@/types/vehicle';
import { format } from 'date-fns';

export default function TripManagement() {
  const [loading, setLoading] = useState<boolean>(true);
  const [trips, setTrips] = useState<TripLog[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      // Fetch trips along with vehicle and driver information
      const { data, error } = await supabase
        .from('trip_logs')
        .select(`
          *,
          vehicles:vehicle_id (plate_number),
          profiles:driver_id (full_name)
        `)
        .order('start_time', { ascending: false });

      if (error) {
        throw error;
      }

      // Transform the data for display
      const formattedTrips = data.map((tripLog: any) => {
        // Format the timestamp for display
        const timestamp = tripLog.start_time 
          ? format(new Date(tripLog.start_time), 'PPP p')
          : null;

        // Calculate total kilometers
        const totalKilometers = tripLog.end_kilometers 
          ? tripLog.end_kilometers - tripLog.start_kilometers 
          : 0;

        return {
          id: tripLog.id,
          vehicle_id: tripLog.vehicle_id,
          driver_id: tripLog.driver_id,
          purpose: tripLog.purpose,
          startTime: tripLog.start_time ? format(new Date(tripLog.start_time), 'HH:mm') : '',
          endTime: tripLog.end_time ? format(new Date(tripLog.end_time), 'HH:mm') : '',
          date: tripLog.start_time ? format(new Date(tripLog.start_time), 'yyyy-MM-dd') : '',
          startKilometers: tripLog.start_kilometers,
          endKilometers: tripLog.end_kilometers || 0,
          totalKilometers: totalKilometers,
          plateNumber: tripLog.vehicles?.plate_number || 'Unknown',
          driver: tripLog.profiles?.full_name || 'Unknown',
          comment: tripLog.comments,
          timestamp: timestamp,
          // Add additional fields for backward compatibility
          vehicleId: tripLog.vehicle_id,
          driverId: tripLog.driver_id,
        };
      });

      setTrips(formattedTrips);
    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTrip = () => {
    navigate('/new-trip');
  };

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Trip Management</h1>
        <Button onClick={handleCreateTrip} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          New Trip
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center p-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Trip Logs</CardTitle>
          </CardHeader>
          <CardContent>
            {trips.length > 0 ? (
              <TripList trips={trips} onRefresh={fetchTrips} filterType="all" />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No trips recorded yet. Click "New Trip" to add one.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
