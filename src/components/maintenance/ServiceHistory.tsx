import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from 'date-fns';

export function ServiceHistory() {
  const { data: services, isLoading } = useQuery({
    queryKey: ['service-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_services')
        .select(`
          *,
          vehicles (
            plate_number,
            make,
            model
          )
        `)
        .order('service_date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Service History</h2>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vehicle</TableHead>
            <TableHead>Service Date</TableHead>
            <TableHead>Service Type</TableHead>
            <TableHead>Kilometers</TableHead>
            <TableHead>Cost</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services?.map((service) => (
            <TableRow key={service.id}>
              <TableCell>
                {service.vehicles?.plate_number} - {service.vehicles?.make} {service.vehicles?.model}
              </TableCell>
              <TableCell>{format(new Date(service.service_date), 'MMM dd, yyyy')}</TableCell>
              <TableCell>{service.service_type}</TableCell>
              <TableCell>{service.kilometers} km</TableCell>
              <TableCell>${service.cost}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}