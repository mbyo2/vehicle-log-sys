import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface TripData {
  id: string;
  vehicle_id: string;
  driver_id: string;
  start_time: string;
  end_time: string | null;
  start_kilometers: number;
  end_kilometers: number | null;
  purpose: string;
  approval_status: string;
  vehicles: {
    make: string;
    model: string;
    plate_number: string;
  };
  drivers: {
    profiles: {
      full_name: string;
    };
  };
}

export function TripAnalytics() {
  const [startDate, setStartDate] = useState(() => {
    return format(startOfMonth(new Date()), "yyyy-MM-dd");
  });
  
  const [endDate, setEndDate] = useState(() => {
    return format(endOfMonth(new Date()), "yyyy-MM-dd");
  });
  
  // Get trips analytics data
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["trip-analytics", startDate, endDate],
    queryFn: async () => {
      // Get all trips within the date range
      const { data: trips, error } = await supabase
        .from("vehicle_logs")
        .select(`
          id,
          vehicle_id,
          driver_id,
          start_time,
          end_time,
          start_kilometers,
          end_kilometers,
          purpose,
          approval_status,
          vehicles:vehicle_id(
            make,
            model,
            plate_number
          ),
          drivers:driver_id(
            profiles(
              full_name
            )
          )
        `)
        .gte("start_time", `${startDate}T00:00:00`)
        .lte("start_time", `${endDate}T23:59:59`);
        
      if (error) throw error;
      
      // Process the data for analytics
      const vehicleUsage: Record<string, number> = {};
      const purposeDistribution: Record<string, number> = {};
      const driverActivity: Record<string, number> = {};
      let totalDistance = 0;
      let totalTrips = trips?.length || 0;
      let approvedTrips = 0;
      let pendingTrips = 0;
      let rejectedTrips = 0;
      
      // Safely transform and process the data
      const typedTrips = trips as unknown as TripData[];
      
      typedTrips?.forEach(trip => {
        // Vehicle usage
        const vehicleKey = trip.vehicles?.plate_number || "Unknown";
        vehicleUsage[vehicleKey] = (vehicleUsage[vehicleKey] || 0) + 1;
        
        // Purpose distribution
        purposeDistribution[trip.purpose] = (purposeDistribution[trip.purpose] || 0) + 1;
        
        // Driver activity
        const driverName = trip.drivers?.profiles?.full_name || "Unknown";
        driverActivity[driverName] = (driverActivity[driverName] || 0) + 1;
        
        // Calculate distance
        if (trip.end_kilometers && trip.start_kilometers) {
          totalDistance += (trip.end_kilometers - trip.start_kilometers);
        }
        
        // Count by approval status
        if (trip.approval_status === "approved") approvedTrips++;
        else if (trip.approval_status === "pending") pendingTrips++;
        else if (trip.approval_status === "rejected") rejectedTrips++;
      });
      
      // Convert to chart format
      const vehicleUsageData = Object.keys(vehicleUsage).map(key => ({
        name: key,
        value: vehicleUsage[key]
      }));
      
      const purposeDistributionData = Object.keys(purposeDistribution).map(key => ({
        name: key,
        value: purposeDistribution[key]
      }));
      
      const driverActivityData = Object.keys(driverActivity)
        .map(key => ({
          name: key,
          trips: driverActivity[key]
        }))
        .sort((a, b) => b.trips - a.trips)
        .slice(0, 10); // Top 10 drivers
      
      const approvalStatusData = [
        { name: "Approved", value: approvedTrips },
        { name: "Pending", value: pendingTrips },
        { name: "Rejected", value: rejectedTrips }
      ];
      
      return {
        totalTrips,
        totalDistance,
        averageDistance: totalTrips > 0 ? totalDistance / totalTrips : 0,
        approvedPercentage: totalTrips > 0 ? (approvedTrips / totalTrips) * 100 : 0,
        vehicleUsageData,
        purposeDistributionData,
        driverActivityData,
        approvalStatusData
      };
    }
  });
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Trip Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4 mb-6">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <Button
                variant="outline"
                onClick={() => {
                  setStartDate(format(subDays(new Date(), 30), "yyyy-MM-dd"));
                  setEndDate(format(new Date(), "yyyy-MM-dd"));
                }}
              >
                Last 30 Days
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-primary/10 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-1">Total Trips</h3>
              <p className="text-3xl font-bold">{analytics?.totalTrips || 0}</p>
            </div>
            <div className="bg-primary/10 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-1">Total Distance</h3>
              <p className="text-3xl font-bold">{(analytics?.totalDistance || 0).toFixed(1)} km</p>
            </div>
            <div className="bg-primary/10 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-1">Avg Distance per Trip</h3>
              <p className="text-3xl font-bold">{(analytics?.averageDistance || 0).toFixed(1)} km</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-medium mb-4">Trip Purposes</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics?.purposeDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {analytics?.purposeDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-4">Approval Status</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics?.approvalStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      <Cell fill="#4CAF50" /> {/* Approved */}
                      <Cell fill="#FFC107" /> {/* Pending */}
                      <Cell fill="#F44336" /> {/* Rejected */}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <h3 className="text-lg font-medium mb-4">Driver Activity</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics?.driverActivityData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 30,
                    bottom: 70,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={70} 
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="trips" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="mt-8">
            <h3 className="text-lg font-medium mb-4">Vehicle Usage</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics?.vehicleUsageData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 30,
                    bottom: 70,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={70}
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
