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
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, ChevronDown, ChevronUp, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/ui/empty-state';
import { Loader2 } from 'lucide-react';

export function ServiceHistory() {
  const [expandedService, setExpandedService] = useState<string | null>(null);

  const { data: services, isLoading, error, refetch } = useQuery({
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

  useEffect(() => {
    if (error) {
      toast.error('Failed to load service history', {
        id: 'service-history-error',
        description: (error as Error)?.message,
        action: { label: 'Retry', onClick: () => refetch() },
      });
    }
  }, [error, refetch]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const toggleExpand = (serviceId: string) => {
    setExpandedService(expandedService === serviceId ? null : serviceId);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Service History</h2>
      </div>

      {!services || services.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No service records yet"
          description="Completed maintenance and repairs will appear here once logged."
        />
      ) : (
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
            {services.map((service) => (
              <>
                <TableRow key={service.id} className="hover:bg-muted/50 cursor-pointer">
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpand(service.id)}
                      aria-label={expandedService === service.id ? 'Collapse details' : 'Expand details'}
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
                    <Button variant="ghost" size="sm" aria-label="View service details">
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
      )}
    </div>
  );
}