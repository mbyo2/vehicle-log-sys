
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Vehicle } from '@/types/vehicle';
import { DriverSelector } from './DriverSelector';
import { AssignmentDatePicker } from './AssignmentDatePicker';
import { format, addMonths, isAfter, isBefore, parseISO } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';

interface VehicleAssignmentProps {
  vehicle: Vehicle;
  onAssignmentUpdated: () => void;
}

export function VehicleAssignment({ vehicle, onAssignmentUpdated }: VehicleAssignmentProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string>(vehicle.assigned_to || '');
  const [startDate, setStartDate] = useState<Date | undefined>(
    vehicle.assignment_start_date ? parseISO(vehicle.assignment_start_date) : new Date()
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    vehicle.assignment_end_date ? parseISO(vehicle.assignment_end_date) : addMonths(new Date(), 3)
  );
  const [driverName, setDriverName] = useState<string>('');
  const [currentAssignment, setCurrentAssignment] = useState<{
    driverId: string;
    driverName: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
  } | null>(null);

  useEffect(() => {
    if (vehicle.assigned_to) {
      fetchCurrentDriverDetails();
      checkAssignmentStatus();
    }
  }, [vehicle]);

  const fetchCurrentDriverDetails = async () => {
    if (!vehicle.assigned_to) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', vehicle.assigned_to)
        .single();

      if (error) {
        console.error('Error fetching driver details:', error);
        return;
      }

      if (data) {
        setDriverName(data.full_name || 'Unknown');
      }
    } catch (error) {
      console.error('Error fetching driver details:', error);
    }
  };

  const checkAssignmentStatus = () => {
    if (!vehicle.assigned_to || !vehicle.assignment_start_date) return;

    const now = new Date();
    const startDate = parseISO(vehicle.assignment_start_date);
    const endDate = vehicle.assignment_end_date ? parseISO(vehicle.assignment_end_date) : null;

    const isActive = isAfter(now, startDate) && (!endDate || isBefore(now, endDate));

    setCurrentAssignment({
      driverId: vehicle.assigned_to,
      driverName: driverName || 'Loading...',
      startDate: vehicle.assignment_start_date,
      endDate: vehicle.assignment_end_date || 'Indefinite',
      isActive
    });
  };

  const handleAssign = async () => {
    if (!selectedDriverId || !startDate) {
      toast({
        variant: "destructive",
        title: "Required fields",
        description: "Please select a driver and assignment dates."
      });
      return;
    }

    setIsLoading(true);

    try {
      const formattedStartDate = format(startDate, 'yyyy-MM-dd');
      const formattedEndDate = endDate ? format(endDate, 'yyyy-MM-dd') : null;

      const { error } = await supabase
        .from('vehicles')
        .update({
          assigned_to: selectedDriverId,
          assignment_start_date: formattedStartDate,
          assignment_end_date: formattedEndDate
        })
        .eq('id', vehicle.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Vehicle assigned",
        description: `The vehicle has been assigned successfully.`
      });

      onAssignmentUpdated();
    } catch (error: any) {
      console.error('Error assigning vehicle:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to assign vehicle."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnassign = async () => {
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('vehicles')
        .update({
          assigned_to: null,
          assignment_start_date: null,
          assignment_end_date: null
        })
        .eq('id', vehicle.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Vehicle unassigned",
        description: `The vehicle has been unassigned successfully.`
      });

      setSelectedDriverId('');
      setStartDate(new Date());
      setEndDate(addMonths(new Date(), 3));
      setCurrentAssignment(null);
      onAssignmentUpdated();
    } catch (error: any) {
      console.error('Error unassigning vehicle:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to unassign vehicle."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Driver Assignment</CardTitle>
        <CardDescription>Assign this vehicle to a driver</CardDescription>
      </CardHeader>
      <CardContent>
        {currentAssignment && (
          <>
            <div className="mb-4 p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium">Current Assignment</h3>
                <Badge variant={currentAssignment.isActive ? "success" : "secondary"}>
                  {currentAssignment.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="text-sm mb-1"><span className="font-medium">Driver:</span> {currentAssignment.driverName}</p>
              <div className="flex flex-col space-y-1 text-sm">
                <div className="flex items-center">
                  <Calendar className="mr-2 h-3 w-3" />
                  <span className="font-medium mr-2">Start:</span> 
                  {format(parseISO(currentAssignment.startDate), 'PPP')}
                </div>
                {currentAssignment.endDate !== 'Indefinite' && (
                  <div className="flex items-center">
                    <Clock className="mr-2 h-3 w-3" />
                    <span className="font-medium mr-2">End:</span> 
                    {format(parseISO(currentAssignment.endDate), 'PPP')}
                  </div>
                )}
              </div>
            </div>
            <Separator className="my-4" />
          </>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Driver</label>
            <DriverSelector 
              value={selectedDriverId} 
              onChange={setSelectedDriverId} 
              disabled={isLoading} 
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <AssignmentDatePicker 
                date={startDate} 
                onDateChange={setStartDate} 
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date (Optional)</label>
              <AssignmentDatePicker 
                date={endDate} 
                onDateChange={setEndDate} 
                disabled={isLoading}
              />
            </div>
          </div>
          
          <div className="flex space-x-2 pt-2">
            <Button 
              onClick={handleAssign} 
              disabled={isLoading || !selectedDriverId}
            >
              {isLoading ? 'Assigning...' : 'Assign Vehicle'}
            </Button>
            
            {currentAssignment && (
              <Button 
                variant="outline"
                onClick={handleUnassign} 
                disabled={isLoading}
              >
                Unassign
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
