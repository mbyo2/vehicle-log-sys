import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

export function CostAnalysis() {
  const { data: costs, isLoading } = useQuery({
    queryKey: ['cost-analysis'],
    queryFn: async () => {
      const { data: services } = await supabase
        .from('vehicle_services')
        .select('*')
        .order('service_date');

      const { data: fuelLogs } = await supabase
        .from('fuel_logs')
        .select('*')
        .order('created_at');

      return {
        services: services || [],
        fuelLogs: fuelLogs || [],
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

  const serviceData = costs?.services.map(service => ({
    date: format(new Date(service.service_date), 'MMM dd'),
    cost: service.cost,
  }));

  const fuelData = costs?.fuelLogs.map(log => ({
    date: format(new Date(log.created_at), 'MMM dd'),
    cost: log.total_cost,
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Service Costs Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={serviceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="cost" stroke="#3b82f6" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fuel Costs Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={fuelData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="cost" stroke="#10b981" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}