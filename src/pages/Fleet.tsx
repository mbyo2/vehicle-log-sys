
import { useState } from 'react';
import { useVehicles } from '@/hooks/useVehicles';
import { Button } from '@/components/ui/button';
import { useModal } from '@/contexts/ModalContext';
import { Plus, Pencil, AlertCircle, UserPlus, Calendar, FileText } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VehicleForm } from '@/components/vehicle/VehicleForm';
import { ServiceStatus } from '@/components/vehicle/ServiceStatus';
import { BulkVehicleImport } from '@/components/vehicle/BulkVehicleImport';
import { VehicleStatusDashboard } from '@/components/vehicle/VehicleStatusDashboard';
import { VehicleAssignment } from '@/components/vehicle/VehicleAssignment';
import { MaintenanceScheduler } from '@/components/vehicle/MaintenanceScheduler';
import { MaintenanceList } from '@/components/vehicle/MaintenanceList';
import { Vehicle } from '@/types/vehicle';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';

export function Fleet() {
  const { vehicles, loading, refetchVehicles } = useVehicles();
  const { openModal } = useModal();
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const handleAddVehicle = () => {
    openModal({
      title: "Add New Vehicle",
      content: <VehicleForm onSuccess={refetchVehicles} />,
      size: "lg"
    });
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    openModal({
      title: "Edit Vehicle",
      content: <VehicleForm vehicle={vehicle} onSuccess={refetchVehicles} />,
      size: "lg"
    });
  };

  const handleViewStatus = (vehicle: Vehicle) => {
    openModal({
      title: `Vehicle Status - ${vehicle.plate_number}`,
      content: <ServiceStatus vehicle={vehicle} />,
      size: "lg"
    });
  };

  const handleAssignVehicle = (vehicle: Vehicle) => {
    openModal({
      title: `Assign Vehicle - ${vehicle.plate_number}`,
      content: <VehicleAssignment vehicleId={vehicle.id} onAssignmentComplete={refetchVehicles} />,
      size: "lg"
    });
  };

  const handleScheduleMaintenance = (vehicle: Vehicle) => {
    openModal({
      title: `Schedule Maintenance - ${vehicle.plate_number}`,
      content: <MaintenanceScheduler vehicle={vehicle} />,
      size: "lg"
    });
  };

  const handleViewMaintenanceHistory = () => {
    openModal({
      title: "Maintenance Schedule",
      content: <MaintenanceList showAllVehicles={true} />,
      size: "xl"
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="list" className="space-y-6">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="list">Vehicle List</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleViewMaintenanceHistory}>
              <Calendar className="h-4 w-4 mr-2" />
              Maintenance Schedule
            </Button>
            <BulkVehicleImport />
            <Button onClick={handleAddVehicle}>
              <Plus className="h-4 w-4 mr-2" />
              Add Vehicle
            </Button>
          </div>
        </div>

        <TabsContent value="dashboard">
          <VehicleStatusDashboard />
        </TabsContent>

        <TabsContent value="maintenance">
          <MaintenanceList showAllVehicles={true} />
        </TabsContent>

        <TabsContent value="list">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plate Number</TableHead>
                <TableHead>Make/Model</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Current KM</TableHead>
                <TableHead>Assignment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24">
                    <div className="flex flex-col items-center justify-center">
                      <p className="text-muted-foreground mb-2">No vehicles found</p>
                      <Button size="sm" onClick={handleAddVehicle}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Vehicle
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                vehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell>{vehicle.plate_number}</TableCell>
                    <TableCell>{vehicle.make} {vehicle.model}</TableCell>
                    <TableCell>{vehicle.year}</TableCell>
                    <TableCell>{vehicle.current_kilometers || 0} km</TableCell>
                    <TableCell>
                      {vehicle.assigned_to ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Assigned
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                          Unassigned
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const needsService = 
                          vehicle.last_service_kilometers && 
                          vehicle.current_kilometers && 
                          vehicle.service_interval && 
                          (vehicle.current_kilometers - vehicle.last_service_kilometers >= vehicle.service_interval);
                        
                        return needsService ? (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            Service Due
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            OK
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditVehicle(vehicle)}
                          title="Edit Vehicle"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewStatus(vehicle)}
                          title="View Status"
                        >
                          <AlertCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleAssignVehicle(vehicle)}
                          title="Assign Vehicle"
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleScheduleMaintenance(vehicle)}
                          title="Schedule Maintenance"
                        >
                          <Calendar className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
}
