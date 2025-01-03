import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

export function FleetUtilization() {
  const { data: utilization, isLoading } = useQuery({
    queryKey: ['fleet-utilization'],
    queryFn: async () => {
      const { data: logs } = await supabase
        .from('vehicle_logs')
        .select(`
          *,
          vehicles (
            plate_number
          )
        `)
        .order('start_time', { ascending: false });

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

  const chartData = utilization?.map(log => ({
    vehicle: log.vehicles?.plate_number,
    kilometers: log.end_kilometers - log.start_kilometers,
    date: format(new Date(log.start_time), 'MMM dd'),
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Usage by Distance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="kilometers" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}