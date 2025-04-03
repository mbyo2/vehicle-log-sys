
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, FilterIcon, AlertTriangle } from "lucide-react";
import { format } from 'date-fns';
import { MaintenanceScheduler } from '@/components/vehicle/MaintenanceScheduler';
import { useIsMobile } from '@/hooks/useIsMobile';

export function MaintenanceSchedules() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const isMobile = useIsMobile();
  
  const { data: schedules, isLoading, refetch } = useQuery({
    queryKey: ['maintenance-schedules', filterStatus],
    queryFn: async () => {
      let query = supabase
        .from('maintenance_schedules')
        .select(`
          *,
          vehicles (
            id,
            plate_number,
            make,
            model
          )
        `)
        .order('scheduled_date');
      
      if (filterStatus) {
        query = query.eq('status', filterStatus);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
  });

  const handleScheduleComplete = () => {
    setIsDialogOpen(false);
    refetch();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500">Overdue</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'justify-between items-center'}`}>
        <h2 className="text-2xl font-bold">Maintenance Schedules</h2>
        
        <div className={`${isMobile ? 'flex justify-between gap-2' : ''}`}>
          <div className="dropdown-menu">
            <Button variant="outline" className="mr-2">
              <FilterIcon className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <div className="dropdown-content">
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={() => setFilterStatus(null)}
              >
                All
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={() => setFilterStatus('pending')}
              >
                Pending
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={() => setFilterStatus('completed')}
              >
                Completed
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={() => setFilterStatus('overdue')}
              >
                Overdue
              </Button>
            </div>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Maintenance
              </Button>
            </DialogTrigger>
            <DialogContent className={isMobile ? 'w-[95vw] max-w-lg' : 'max-w-2xl'}>
              <DialogHeader>
                <DialogTitle>Schedule Vehicle Maintenance</DialogTitle>
              </DialogHeader>
              <MaintenanceScheduler 
                onScheduleComplete={handleScheduleComplete} 
                vehicleId={selectedVehicleId} 
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="loader">Loading...</div>
        </div>
      ) : schedules && schedules.length > 0 ? (
        <div className={`${isMobile ? 'overflow-x-auto -mx-4 px-4' : ''}`}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Service Type</TableHead>
                <TableHead>Scheduled Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Estimated Cost</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules?.map((schedule) => (
                <TableRow key={schedule.id} className={
                  schedule.status === 'overdue' ? 'bg-red-50 dark:bg-red-900/20' : ''
                }>
                  <TableCell>
                    {schedule.vehicles?.plate_number} - {schedule.vehicles?.make} {schedule.vehicles?.model}
                  </TableCell>
                  <TableCell>{schedule.service_type}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      {format(new Date(schedule.scheduled_date), 'MMM dd, yyyy')}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(schedule.status)}</TableCell>
                  <TableCell>${schedule.estimated_cost || 0}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setSelectedVehicleId(schedule.vehicle_id);
                        setIsDialogOpen(true);
                      }}
                    >
                      Reschedule
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center p-8 border rounded-lg bg-muted/10">
          <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No maintenance schedules found</h3>
          <p className="text-muted-foreground mb-4">
            Start by scheduling maintenance for your vehicles to track service history.
          </p>
          <Button 
            onClick={() => {
              setSelectedVehicleId(null);
              setIsDialogOpen(true);
            }}
          >
            Schedule First Maintenance
          </Button>
        </div>
      )}
    </div>
  );
}
