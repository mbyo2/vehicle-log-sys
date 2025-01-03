import { useState } from 'react';
import { useVehicles } from '@/hooks/useVehicles';
import { Button } from '@/components/ui/button';
import { useModal } from '@/contexts/ModalContext';
import { Plus, Pencil, AlertCircle, UserPlus } from 'lucide-react';
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
import { Vehicle } from '@/types/vehicle';

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
      content: <VehicleAssignment vehicleId={vehicle.id} />,
      size: "lg"
    });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="list" className="space-y-6">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="list">Vehicle List</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
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

        <TabsContent value="list">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plate Number</TableHead>
                <TableHead>Make</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Current KM</TableHead>
                <TableHead>Service Interval</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell>{vehicle.plate_number}</TableCell>
                  <TableCell>{vehicle.make}</TableCell>
                  <TableCell>{vehicle.model}</TableCell>
                  <TableCell>{vehicle.year}</TableCell>
                  <TableCell>{vehicle.current_kilometers || 0} km</TableCell>
                  <TableCell>{vehicle.service_interval} km</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditVehicle(vehicle)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewStatus(vehicle)}
                      >
                        <AlertCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleAssignVehicle(vehicle)}
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
}