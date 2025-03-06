
import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { DriverSelector } from "./DriverSelector";
import { AssignmentDatePicker } from "./AssignmentDatePicker";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Label } from "@/components/ui/label";

interface VehicleAssignmentProps {
  vehicleId: string;
  onAssignmentComplete?: () => void;
}

interface CurrentAssignment {
  driverId: string | null;
  driverName: string | null;
  startDate: Date | null;
  endDate: Date | null;
}

// Define an interface for the vehicle data returned from the query
interface VehicleData {
  id: string;
  assigned_to: string | null;
  assignment_start_date: string | null;
  assignment_end_date: string | null;
  drivers: {
    full_name: string;
  } | null;
}

export function VehicleAssignment({ vehicleId, onAssignmentComplete }: VehicleAssignmentProps) {
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [currentAssignment, setCurrentAssignment] = useState<CurrentAssignment | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current vehicle assignment
  const { data: vehicleData, isLoading: isLoadingVehicle } = useQuery({
    queryKey: ['vehicle-assignment', vehicleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          id,
          assigned_to,
          assignment_start_date,
          assignment_end_date,
          drivers:profiles(full_name)
        `)
        .eq('id', vehicleId)
        .single();

      if (error) throw error;
      return data as VehicleData;
    },
  });

  useEffect(() => {
    if (vehicleData && vehicleData.assigned_to) {
      setCurrentAssignment({
        driverId: vehicleData.assigned_to,
        driverName: vehicleData.drivers?.full_name || null,
        startDate: vehicleData.assignment_start_date ? new Date(vehicleData.assignment_start_date) : null,
        endDate: vehicleData.assignment_end_date ? new Date(vehicleData.assignment_end_date) : null
      });
    }
  }, [vehicleData]);

  const assignVehicleMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDriverId || !startDate) {
        throw new Error("Please select a driver and start date");
      }

      const { error } = await supabase
        .from('vehicles')
        .update({
          assigned_to: selectedDriverId,
          assignment_start_date: startDate.toISOString(),
          assignment_end_date: endDate?.toISOString() || null,
        })
        .eq('id', vehicleId);

      if (error) throw error;

      // Log the assignment in the audit log
      await supabase.from('audit_logs').insert({
        table_name: 'vehicles',
        record_id: vehicleId,
        action: 'vehicle_assignment',
        new_data: {
          driver_id: selectedDriverId,
          start_date: startDate.toISOString(),
          end_date: endDate?.toISOString() || null,
          notes: notes
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Vehicle assigned successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['vehicle-assignment'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      onAssignmentComplete?.();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const unassignVehicleMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('vehicles')
        .update({
          assigned_to: null,
          assignment_end_date: new Date().toISOString()
        })
        .eq('id', vehicleId);

      if (error) throw error;

      // Log the unassignment in the audit log
      await supabase.from('audit_logs').insert({
        table_name: 'vehicles',
        record_id: vehicleId,
        action: 'vehicle_unassignment',
        new_data: {
          end_date: new Date().toISOString(),
          notes: notes
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Vehicle unassigned successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['vehicle-assignment'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setCurrentAssignment(null);
      onAssignmentComplete?.();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const handleAssign = () => {
    assignVehicleMutation.mutate();
  };

  const handleUnassign = () => {
    unassignVehicleMutation.mutate();
  };

  if (isLoadingVehicle) {
    return (
      <div className="flex justify-center p-4">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assign Vehicle</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {currentAssignment ? (
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-md">
              <h3 className="font-medium mb-2">Current Assignment</h3>
              <div className="space-y-2">
                <p><span className="text-muted-foreground">Driver:</span> {currentAssignment.driverName}</p>
                <p>
                  <span className="text-muted-foreground">Start Date:</span> {
                    currentAssignment.startDate ? 
                    currentAssignment.startDate.toLocaleDateString() : 'N/A'
                  }
                </p>
                <p>
                  <span className="text-muted-foreground">End Date:</span> {
                    currentAssignment.endDate ? 
                    currentAssignment.endDate.toLocaleDateString() : 'Ongoing'
                  }
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add notes about this unassignment"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            
            <Button 
              onClick={handleUnassign}
              variant="destructive"
              disabled={unassignVehicleMutation.isPending}
              className="w-full"
            >
              {unassignVehicleMutation.isPending ? "Unassigning..." : "Unassign Vehicle"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="driver">Driver</Label>
              <DriverSelector
                selectedDriverId={selectedDriverId}
                onDriverSelect={setSelectedDriverId}
              />
            </div>

            <AssignmentDatePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
            />

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add notes about this assignment"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <Button 
              onClick={handleAssign}
              disabled={!selectedDriverId || !startDate || assignVehicleMutation.isPending}
              className="w-full"
            >
              {assignVehicleMutation.isPending ? "Assigning..." : "Assign Vehicle"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
