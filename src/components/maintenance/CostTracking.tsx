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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CostTracking() {
  const { data: costs, isLoading } = useQuery({
    queryKey: ['maintenance-costs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_services')
        .select(`
          *,
          vehicles (
            plate_number
          )
        `)
        .order('service_date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const totalCost = costs?.reduce((sum, service) => sum + (service.cost || 0), 0) || 0;
  const averageCost = costs?.length ? totalCost / costs.length : 0;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Maintenance Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${totalCost.toFixed(2)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Average Cost per Service</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${averageCost.toFixed(2)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Total Services</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{costs?.length || 0}</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Recent Maintenance Costs</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle</TableHead>
              <TableHead>Service Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {costs?.slice(0, 5).map((service) => (
              <TableRow key={service.id}>
                <TableCell>{service.vehicles?.plate_number}</TableCell>
                <TableCell>{service.service_type}</TableCell>
                <TableCell>{new Date(service.service_date).toLocaleDateString()}</TableCell>
                <TableCell>${service.cost}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}