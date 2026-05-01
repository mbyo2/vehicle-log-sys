import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDrivers } from "@/hooks/useDrivers";
import { Button } from "@/components/ui/button";
import { DriverForm } from "@/components/driver/DriverForm";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { format } from "date-fns";
import { UserPlus, Pencil, Eye, Users } from "lucide-react";

export function Drivers() {
  const navigate = useNavigate();
  const { drivers, availableProfiles, isLoading, addDriver, updateDriver } = useDrivers();
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddDriver = (data: any) => {
    addDriver(data);
    setIsDialogOpen(false);
  };

  const handleUpdateDriver = (data: any) => {
    if (selectedDriver) {
      updateDriver({ id: selectedDriver.id, data });
      setSelectedDriver(null);
      setIsDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Driver Management</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedDriver(null)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Driver
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedDriver ? "Edit Driver" : "Add New Driver"}</DialogTitle>
              <DialogDescription>
                {selectedDriver
                  ? "Update the driver's information below"
                  : "Enter the driver's information below"}
              </DialogDescription>
            </DialogHeader>
            <DriverForm
              onSubmit={selectedDriver ? handleUpdateDriver : handleAddDriver}
              availableProfiles={availableProfiles || []}
              initialData={selectedDriver}
              isLoading={isLoading}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size={32} />
        </div>
      ) : !drivers || drivers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No drivers yet"
          description="Add your first driver to start assigning vehicles and tracking trips."
          action={
            <Button onClick={() => { setSelectedDriver(null); setIsDialogOpen(true); }}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Driver
            </Button>
          }
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>MAN Number</TableHead>
                <TableHead>License Number</TableHead>
                <TableHead>License Expiry</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell>{driver.profile.full_name}</TableCell>
                  <TableCell>{driver.profile.email}</TableCell>
                  <TableCell>{driver.man_number}</TableCell>
                  <TableCell>{driver.license_number || "N/A"}</TableCell>
                  <TableCell>
                    {driver.license_expiry
                      ? format(new Date(driver.license_expiry), "PP")
                      : "N/A"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/drivers/${driver.id}`)}
                      aria-label={`View driver ${driver.profile?.full_name || driver.man_number}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedDriver(driver);
                        setIsDialogOpen(true);
                      }}
                      aria-label={`Edit driver ${driver.profile?.full_name || driver.man_number}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}