import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

export function FuelAnalytics() {
  const { data: fuelData, isLoading } = useQuery({
    queryKey: ['fuel-analytics'],
    queryFn: async () => {
      const { data: logs } = await supabase
        .from('fuel_logs')
        .select(`
          *,
          vehicles (
            plate_number
          )
        `)
        .order('created_at');

      return logs || [];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const consumptionData = fuelData?.map(log => ({
    date: format(new Date(log.created_at), 'MMM dd'),
    vehicle: log.vehicles?.plate_number,
    liters: log.liters_added,
    cost: log.total_cost,
    efficiency: (log.odometer_reading && log.liters_added) 
      ? (log.odometer_reading / log.liters_added).toFixed(2)
      : 0,
  }));

  const totalCost = fuelData?.reduce((sum, log) => sum + (log.total_cost || 0), 0) || 0;
  const totalLiters = fuelData?.reduce((sum, log) => sum + (log.liters_added || 0), 0) || 0;
  const averageCostPerLiter = fuelData && fuelData.length > 0
    ? (fuelData.reduce((sum, log) => sum + (log.cost_per_liter || 0), 0) / fuelData.length).toFixed(2)
    : "0.00";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Fuel Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ${totalCost.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Liters</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {totalLiters.toFixed(2)} L
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Cost/Liter</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ${averageCostPerLiter}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fuel Consumption Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={consumptionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="liters" stroke="#3b82f6" name="Liters" />
                <Line yAxisId="right" type="monotone" dataKey="efficiency" stroke="#10b981" name="Km/L" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}