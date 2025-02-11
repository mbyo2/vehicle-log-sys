
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, differenceInDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Vehicle } from "@/types/vehicle";
import { VehicleInspection } from "@/types/inspection";

export function VehicleStatus() {
  const { data: vehicles, isLoading: loadingVehicles } = useQuery({
    queryKey: ['assigned-vehicles'],
    queryFn: async () => {
      // First get the driver's ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data: driver } = await supabase
        .from('drivers')
        .select('id')
        .eq('profile_id', user.id)
        .single();

      if (!driver) throw new Error('No driver found');

      // Then get their assigned vehicles
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          vehicle_services (
            service_date,
            kilometers
          )
        `)
        .eq('assigned_to', driver.id);

      if (error) throw error;
      return data as Vehicle[];
    },
  });

  const { data: inspections, isLoading: loadingInspections } = useQuery({
    queryKey: ['recent-inspections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_inspections')
        .select('*')
        .order('inspection_date', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data as VehicleInspection[];
    },
  });

  const getStatusColor = (vehicle: Vehicle) => {
    const today = new Date();
    
    // Check document expiry dates
    const hasExpiringDocs = [
      { date: vehicle.fitness_expiry, name: 'Fitness Certificate' },
      { date: vehicle.road_tax_expiry, name: 'Road Tax' },
      { date: vehicle.insurance_expiry, name: 'Insurance' }
    ].some(doc => {
      if (!doc.date) return false;
      const daysUntilExpiry = differenceInDays(new Date(doc.date), today);
      return daysUntilExpiry < 30;
    });

    // Check service interval
    const lastService = vehicle.vehicle_services?.[0];
    const kmSinceService = lastService 
      ? vehicle.current_kilometers - lastService.kilometers
      : 0;
    const needsService = kmSinceService >= vehicle.service_interval;

    if (hasExpiringDocs || needsService) {
      return <Badge variant="destructive">Attention Needed</Badge>;
    }

    return <Badge variant="success">Good Condition</Badge>;
  };

  const isLoading = loadingVehicles || loadingInspections;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Vehicle Status</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Pending Inspections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {vehicles?.length || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Completed Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {inspections?.filter(i => 
                format(new Date(i.inspection_date), 'yyyy-MM-dd') === 
                format(new Date(), 'yyyy-MM-dd')
              ).length || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              Next Service Due
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {vehicles?.[0]?.service_interval - 
                ((vehicles?.[0]?.current_kilometers || 0) - 
                (vehicles?.[0]?.vehicle_services?.[0]?.kilometers || 0))} km
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assigned Vehicles</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Current KM</TableHead>
                <TableHead>Last Service</TableHead>
                <TableHead>Next Service Due</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles?.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell>
                    {vehicle.plate_number} - {vehicle.make} {vehicle.model}
                  </TableCell>
                  <TableCell>{vehicle.current_kilometers?.toLocaleString()} km</TableCell>
                  <TableCell>
                    {vehicle.vehicle_services?.[0]?.service_date
                      ? format(new Date(vehicle.vehicle_services[0].service_date), 'MMM dd, yyyy')
                      : 'No service record'}
                  </TableCell>
                  <TableCell>
                    {vehicle.vehicle_services?.[0]?.kilometers
                      ? `${(vehicle.vehicle_services[0].kilometers + vehicle.service_interval).toLocaleString()} km`
                      : 'N/A'}
                  </TableCell>
                  <TableCell>{getStatusColor(vehicle)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Inspections</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Comments</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inspections?.map((inspection) => (
                <TableRow key={inspection.id}>
                  <TableCell>
                    {format(new Date(inspection.inspection_date), 'MMM dd, yyyy HH:mm')}
                  </TableCell>
                  <TableCell>{inspection.vehicle_id}</TableCell>
                  <TableCell>
                    <Badge
                      variant={inspection.status === 'completed' ? 'success' : 'destructive'}
                    >
                      {inspection.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{inspection.comments || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
