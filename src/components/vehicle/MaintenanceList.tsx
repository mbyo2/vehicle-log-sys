
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Vehicle } from "@/types/vehicle";
import { Badge } from "@/components/ui/badge";

interface MaintenanceSchedule {
  id: string;
  service_type: string;
  scheduled_date: string;
  status: string;
  estimated_cost: number | null;
  description: string | null;
}

interface MaintenanceListProps {
  vehicle?: Vehicle;
  showAllVehicles?: boolean;
}

export function MaintenanceList({ vehicle, showAllVehicles = false }: MaintenanceListProps) {
  const { data: schedules, isLoading } = useQuery({
    queryKey: ['maintenance-schedules', vehicle?.id, showAllVehicles],
    queryFn: async () => {
      let query = supabase
        .from('maintenance_schedules')
        .select(`
          id,
          service_type,
          scheduled_date,
          status,
          estimated_cost,
          description,
          vehicle_id,
          vehicles(plate_number)
        `)
        .order('scheduled_date', { ascending: true });
      
      if (vehicle && !showAllVehicles) {
        query = query.eq('vehicle_id', vehicle.id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data as unknown as (MaintenanceSchedule & { vehicles: { plate_number: string } })[];
    },
  });

  // Format service type for display
  const formatServiceType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="bg-success/10 text-success border-success/30">Completed</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-info/10 text-info border-info/30">In Progress</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">Cancelled</Badge>;
      case 'pending':
      default:
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">Pending</Badge>;
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!schedules || schedules.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No maintenance schedules found</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {showAllVehicles && <TableHead>Vehicle</TableHead>}
          <TableHead>Service Type</TableHead>
          <TableHead>Scheduled Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Estimated Cost</TableHead>
          <TableHead>Description</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {schedules.map((schedule) => (
          <TableRow key={schedule.id}>
            {showAllVehicles && (
              <TableCell>{schedule.vehicles?.plate_number || 'Unknown'}</TableCell>
            )}
            <TableCell>{formatServiceType(schedule.service_type)}</TableCell>
            <TableCell>{format(new Date(schedule.scheduled_date), 'PPP')}</TableCell>
            <TableCell>{getStatusBadge(schedule.status)}</TableCell>
            <TableCell>
              {schedule.estimated_cost 
                ? `$${schedule.estimated_cost.toFixed(2)}` 
                : 'N/A'}
            </TableCell>
            <TableCell>{schedule.description || 'N/A'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
