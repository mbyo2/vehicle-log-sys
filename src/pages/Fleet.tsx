import { useState } from 'react';
import { useVehicles } from '@/hooks/useVehicles';
import { Button } from '@/components/ui/button';
import { useModal } from '@/contexts/ModalContext';
import { Plus, Pencil, AlertCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VehicleForm } from '@/components/vehicle/VehicleForm';
import { ServiceStatus } from '@/components/vehicle/ServiceStatus';
import { format } from 'date-fns';
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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Vehicle Fleet</h1>
        <Button onClick={handleAddVehicle}>
          <Plus className="h-4 w-4 mr-2" />
          Add Vehicle
        </Button>
      </div>

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
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}