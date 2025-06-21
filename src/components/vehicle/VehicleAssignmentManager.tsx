
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Vehicle } from '@/types/vehicle';
import { UserRole } from '@/types/auth';
import { useAuth } from '@/contexts/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, UserCheck, UserX } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface Driver {
  id: string;
  full_name: string;
  email: string;
}

interface VehicleAssignmentManagerProps {
  vehicle: Vehicle;
  onAssignmentUpdated: () => void;
}

export function VehicleAssignmentManager({ vehicle, onAssignmentUpdated }: VehicleAssignmentManagerProps) {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>(vehicle.assigned_to || '');
  const [loading, setLoading] = useState(false);
  const [currentDriver, setCurrentDriver] = useState<Driver | null>(null);

  useEffect(() => {
    fetchDrivers();
    if (vehicle.assigned_to) {
      fetchCurrentDriver();
    }
  }, [vehicle]);

  const fetchDrivers = async () => {
    try {
      const currentProfile = profile.get();
      if (!currentProfile?.company_id) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('company_id', currentProfile.company_id)
        .eq('role', 'driver')
        .order('full_name');

      if (error) throw error;
      setDrivers(data || []);
    } catch (error: any) {
      console.error('Error fetching drivers:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load drivers"
      });
    }
  };

  const fetchCurrentDriver = async () => {
    if (!vehicle.assigned_to) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', vehicle.assigned_to)
        .single();

      if (error) throw error;
      setCurrentDriver(data);
    } catch (error) {
      console.error('Error fetching current driver:', error);
    }
  };

  const handleAssign = async () => {
    if (!selectedDriverId) {
      toast({
        variant: "destructive",
        title: "No driver selected",
        description: "Please select a driver to assign"
      });
      return;
    }

    setLoading(true);

    try {
      const startDate = new Date().toISOString();
      
      const { error } = await supabase
        .from('vehicles')
        .update({
          assigned_to: selectedDriverId,
          assignment_start_date: startDate,
          assignment_end_date: null
        })
        .eq('id', vehicle.id);

      if (error) throw error;

      toast({
        title: "Vehicle assigned",
        description: "Vehicle has been successfully assigned to the driver"
      });

      onAssignmentUpdated();
      fetchCurrentDriver();
    } catch (error: any) {
      console.error('Error assigning vehicle:', error);
      toast({
        variant: "destructive",
        title: "Assignment failed",
        description: error.message || "Failed to assign vehicle"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnassign = async () => {
    setLoading(true);

    try {
      const endDate = new Date().toISOString();
      
      const { error } = await supabase
        .from('vehicles')
        .update({
          assigned_to: null,
          assignment_start_date: null,
          assignment_end_date: endDate
        })
        .eq('id', vehicle.id);

      if (error) throw error;

      toast({
        title: "Vehicle unassigned",
        description: "Vehicle has been successfully unassigned"
      });

      setSelectedDriverId('');
      setCurrentDriver(null);
      onAssignmentUpdated();
    } catch (error: any) {
      console.error('Error unassigning vehicle:', error);
      toast({
        variant: "destructive",
        title: "Unassignment failed",
        description: error.message || "Failed to unassign vehicle"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Vehicle Assignment
        </CardTitle>
        <CardDescription>
          Assign or unassign drivers to this vehicle
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Assignment Status */}
        {currentDriver ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserCheck className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Currently Assigned</p>
                  <p className="text-sm text-green-700">{currentDriver.full_name}</p>
                  <p className="text-xs text-green-600">{currentDriver.email}</p>
                  {vehicle.assignment_start_date && (
                    <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3" />
                      Since: {format(parseISO(vehicle.assignment_start_date), 'PPP')}
                    </p>
                  )}
                </div>
              </div>
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                Active
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnassign}
              disabled={loading}
              className="mt-3 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <UserX className="h-4 w-4 mr-2" />
              Unassign Vehicle
            </Button>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <UserX className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Not Assigned</p>
                <p className="text-sm text-gray-600">This vehicle is available for assignment</p>
              </div>
              <Badge variant="outline" className="ml-auto">
                Available
              </Badge>
            </div>
          </div>
        )}

        {/* Assignment Form */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              {currentDriver ? 'Reassign to Different Driver' : 'Assign to Driver'}
            </label>
            <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a driver" />
              </SelectTrigger>
              <SelectContent>
                {drivers.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    <div className="flex flex-col">
                      <span>{driver.full_name}</span>
                      <span className="text-xs text-gray-500">{driver.email}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleAssign}
            disabled={loading || !selectedDriverId || selectedDriverId === vehicle.assigned_to}
            className="w-full"
          >
            {loading ? 'Processing...' : currentDriver ? 'Reassign Vehicle' : 'Assign Vehicle'}
          </Button>
        </div>

        {drivers.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            <p className="text-sm">No drivers available for assignment</p>
            <p className="text-xs mt-1">Add drivers to your company first</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
