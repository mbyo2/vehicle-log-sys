
import { FleetUtilizationMetric } from '@/types/analytics';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistance } from 'date-fns';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface FleetUtilizationAnalyticsProps {
  data: FleetUtilizationMetric[];
}

export function FleetUtilizationAnalytics({ data }: FleetUtilizationAnalyticsProps) {
  // Calculate overall fleet utilization metrics
  const totalTrips = data.reduce((sum, vehicle) => sum + vehicle.totalTrips, 0);
  const totalDistance = data.reduce((sum, vehicle) => sum + vehicle.totalDistance, 0);
  const averageUtilization = data.reduce((sum, vehicle) => sum + vehicle.utilizationPercentage, 0) / (data.length || 1);
  
  // Sort utilization data for chart
  const utilizationData = [...data]
    .sort((a, b) => b.utilizationPercentage - a.utilizationPercentage)
    .slice(0, 10)
    .map(vehicle => ({
      name: vehicle.plateNumber,
      utilization: Math.round(vehicle.utilizationPercentage)
    }));
  
  // Sort distance data for chart
  const distanceData = [...data]
    .sort((a, b) => b.totalDistance - a.totalDistance)
    .slice(0, 10)
    .map(vehicle => ({
      name: vehicle.plateNumber,
      distance: Math.round(vehicle.totalDistance)
    }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Fleet Trips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTrips}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Distance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDistance.toLocaleString()} km</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageUtilization.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Utilized Vehicles</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={utilizationData}
                margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  interval={0}
                  height={60}
                />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}%`, "Utilization"]} />
                <Bar dataKey="utilization" fill="#8884d8" name="Utilization Rate" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Highest Distance Vehicles</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={distanceData}
                margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  interval={0}
                  height={60}
                />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} km`, "Distance"]} />
                <Bar dataKey="distance" fill="#82ca9d" name="Total Distance (km)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Utilization Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Make/Model</TableHead>
                <TableHead>Total Trips</TableHead>
                <TableHead>Distance (km)</TableHead>
                <TableHead>Utilization</TableHead>
                <TableHead>Idle Days</TableHead>
                <TableHead>Last Used</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(vehicle => (
                <TableRow key={vehicle.vehicleId}>
                  <TableCell className="font-medium">{vehicle.plateNumber}</TableCell>
                  <TableCell>{vehicle.make} {vehicle.model}</TableCell>
                  <TableCell>{vehicle.totalTrips}</TableCell>
                  <TableCell>{vehicle.totalDistance.toLocaleString()}</TableCell>
                  <TableCell>
                    <UtilizationBadge percentage={vehicle.utilizationPercentage} />
                  </TableCell>
                  <TableCell>{vehicle.idleDays}</TableCell>
                  <TableCell>
                    {vehicle.lastUsedDate === 'Never' 
                      ? 'Never' 
                      : formatDistance(new Date(vehicle.lastUsedDate), new Date(), { addSuffix: true })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function UtilizationBadge({ percentage }: { percentage: number }) {
  let badgeProps = {
    variant: "outline" as const,
    className: ""
  };
  
  if (percentage >= 75) {
    badgeProps.className = "bg-green-50 text-green-600 border-green-200";
  } else if (percentage >= 50) {
    badgeProps.className = "bg-blue-50 text-blue-600 border-blue-200";
  } else if (percentage >= 25) {
    badgeProps.className = "bg-yellow-50 text-yellow-600 border-yellow-200";
  } else {
    badgeProps.className = "bg-red-50 text-red-600 border-red-200";
  }
  
  return (
    <Badge {...badgeProps}>{percentage.toFixed(1)}%</Badge>
  );
}
