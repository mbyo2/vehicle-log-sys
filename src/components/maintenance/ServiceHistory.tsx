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
import { ServiceHistoryDetails } from './ServiceHistoryDetails';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';

export function ServiceHistory() {
  const [expandedService, setExpandedService] = useState<string | null>(null);

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
          ),
          maintenance_parts (
            quantity_used,
            unit_cost,
            parts_inventory (
              part_name,
              part_number
            )
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

  const toggleExpand = (serviceId: string) => {
    setExpandedService(expandedService === serviceId ? null : serviceId);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Service History</h2>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead></TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Service Date</TableHead>
            <TableHead>Service Type</TableHead>
            <TableHead>Kilometers</TableHead>
            <TableHead>Cost</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services?.map((service) => (
            <>
              <TableRow key={service.id} className="hover:bg-muted/50 cursor-pointer">
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpand(service.id)}
                  >
                    {expandedService === service.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
                <TableCell>
                  {service.vehicles?.plate_number} - {service.vehicles?.make} {service.vehicles?.model}
                </TableCell>
                <TableCell>{format(new Date(service.service_date), 'MMM dd, yyyy')}</TableCell>
                <TableCell>{service.service_type}</TableCell>
                <TableCell>{service.kilometers} km</TableCell>
                <TableCell>${service.cost}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    <FileText className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
              {expandedService === service.id && (
                <TableRow>
                  <TableCell colSpan={7} className="bg-muted/30">
                    <ServiceHistoryDetails service={service} />
                  </TableCell>
                </TableRow>
              )}
            </>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}