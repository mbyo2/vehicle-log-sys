import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Edit, Trash } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Vehicle {
  plate_number: string;
  make: string;
  model: string;
}

interface ServiceCenter {
  name: string;
}

interface ServiceBookingResponse {
  id: string;
  booking_date: string;
  service_type: string;
  status: string;
  notes?: string;
  vehicles: Vehicle[];
  service_centers: ServiceCenter[];
}

interface ServiceBooking {
  id: string;
  vehicle: Vehicle;
  service_center: ServiceCenter;
  booking_date: string;
  service_type: string;
  status: string;
  notes?: string;
}

export function ServiceBookings() {
  const { toast } = useToast();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["serviceBookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_bookings")
        .select(`
          id,
          booking_date,
          service_type,
          status,
          notes,
          vehicles (
            plate_number,
            make,
            model
          ),
          service_centers (
            name
          )
        `)
        .order("booking_date", { ascending: true });

      if (error) throw error;

      // Transform the response data to match our ServiceBooking interface
      return (data as ServiceBookingResponse[]).map((booking) => ({
        id: booking.id,
        booking_date: booking.booking_date,
        service_type: booking.service_type,
        status: booking.status,
        notes: booking.notes,
        vehicle: booking.vehicles[0],
        service_center: booking.service_centers[0],
      })) as ServiceBooking[];
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "confirmed":
        return "bg-green-500";
      case "completed":
        return "bg-blue-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Service Bookings</h1>
        <Button className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          New Booking
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle</TableHead>
              <TableHead>Service Center</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Service Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings?.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell>
                  {booking.vehicle.make} {booking.vehicle.model}
                  <br />
                  <span className="text-sm text-gray-500">
                    {booking.vehicle.plate_number}
                  </span>
                </TableCell>
                <TableCell>{booking.service_center.name}</TableCell>
                <TableCell>
                  {format(new Date(booking.booking_date), "PPp")}
                </TableCell>
                <TableCell>{booking.service_type}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={`${getStatusColor(booking.status)} text-white`}
                  >
                    {booking.status}
                  </Badge>
                </TableCell>
                <TableCell>{booking.notes || "-"}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}