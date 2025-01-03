import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { Loader2 } from "lucide-react";

export function CompanyMetrics() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['company-metrics'],
    queryFn: async () => {
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('*');

      const { data: services } = await supabase
        .from('vehicle_services')
        .select('*');

      const { data: fuelLogs } = await supabase
        .from('fuel_logs')
        .select('*');

      return {
        totalVehicles: vehicles?.length || 0,
        totalServices: services?.length || 0,
        totalFuelCost: fuelLogs?.reduce((sum, log) => sum + (log.total_cost || 0), 0) || 0,
        maintenanceCost: services?.reduce((sum, service) => sum + (service.cost || 0), 0) || 0,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Vehicles</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics?.totalVehicles}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Services</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics?.totalServices}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Fuel Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${metrics?.totalFuelCost.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maintenance Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${metrics?.maintenanceCost.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}