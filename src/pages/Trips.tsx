
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TripForm } from "@/components/vehicle/TripForm";
import { Loader2, Plus } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { TripLog } from "@/types/vehicle";
import { useTripLog } from "@/hooks/useTripLog";

const commonPurposes = [
  'Delivery',
  'Pickup',
  'Maintenance',
  'Client Visit',
  'Administrative',
  'Other'
];

export function Trips() {
  const [isOpen, setIsOpen] = useState(false);
  const { tripLog, updateTripLog, saveTripLog } = useTripLog();

  const { data: trips, isLoading } = useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trip_logs')
        .select(`
          *,
          vehicles (
            plate_number,
            make,
            model
          ),
          drivers (
            man_number,
            profiles (
              full_name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const handleSave = async () => {
    await saveTripLog();
    setIsOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Trips</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Log New Trip
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Log New Trip</DialogTitle>
            </DialogHeader>
            <TripForm
              tripLog={tripLog}
              onTripLogChange={updateTripLog}
              tripPurposes={commonPurposes}
            />
            <div className="flex justify-end gap-4 mt-4">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save Trip</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Trips</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead>Distance (km)</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trips?.map((trip) => (
                  <TableRow key={trip.id}>
                    <TableCell>
                      {format(new Date(trip.start_time), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      {trip.vehicles?.plate_number} - {trip.vehicles?.make} {trip.vehicles?.model}
                    </TableCell>
                    <TableCell>
                      {format(new Date(trip.start_time), 'HH:mm')}
                    </TableCell>
                    <TableCell>
                      {trip.end_time && format(new Date(trip.end_time), 'HH:mm')}
                    </TableCell>
                    <TableCell>
                      {trip.end_kilometers && trip.start_kilometers
                        ? (trip.end_kilometers - trip.start_kilometers).toFixed(1)
                        : '-'}
                    </TableCell>
                    <TableCell>{trip.purpose}</TableCell>
                    <TableCell>{getStatusBadge(trip.approval_status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
