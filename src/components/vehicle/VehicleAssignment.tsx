import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { DriverSelector } from "./DriverSelector";
import { AssignmentDatePicker } from "./AssignmentDatePicker";

interface VehicleAssignmentProps {
  vehicleId: string;
  onAssignmentComplete?: () => void;
}

export function VehicleAssignment({ vehicleId, onAssignmentComplete }: VehicleAssignmentProps) {
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Vehicle assigned successfully",
      });
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

  const handleAssign = () => {
    assignVehicleMutation.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assign Vehicle</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Driver</label>
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

        <Button 
          onClick={handleAssign}
          disabled={!selectedDriverId || !startDate || assignVehicleMutation.isPending}
          className="w-full"
        >
          {assignVehicleMutation.isPending ? "Assigning..." : "Assign Vehicle"}
        </Button>
      </CardContent>
    </Card>
  );
}