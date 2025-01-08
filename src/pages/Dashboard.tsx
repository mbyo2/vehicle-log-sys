import React from "react";
import { AdvertisementList } from "@/components/advertisements/AdvertisementList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ComplianceStatusDashboard } from "@/components/compliance/ComplianceStatusDashboard";

export default function Dashboard() {
  const { data: vehicleCount } = useQuery({
    queryKey: ["vehicleCount"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("vehicles")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count;
    },
  });

  const { data: driverCount } = useQuery({
    queryKey: ["driverCount"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("drivers")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count;
    },
  });

  const { data: logCount } = useQuery({
    queryKey: ["logCount"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("vehicle_logs")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count;
    },
  });

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Total Vehicles</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{vehicleCount ?? 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Drivers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{driverCount ?? 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{logCount ?? 0}</p>
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Announcements</h2>
            <AdvertisementList />
          </div>
        </div>
        
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Compliance Status</h2>
          <ComplianceStatusDashboard />
        </div>
      </div>
    </div>
  );
}