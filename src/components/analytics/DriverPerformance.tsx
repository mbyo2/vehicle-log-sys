
import { DriverPerformanceMetric } from '@/types/analytics';
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
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';

interface DriverPerformanceProps {
  data: DriverPerformanceMetric[];
}

export function DriverPerformance({ data }: DriverPerformanceProps) {
  // Sort drivers by trips completed for chart
  const topDriversByTrips = [...data]
    .sort((a, b) => b.tripsCompleted - a.tripsCompleted)
    .slice(0, 10)
    .map(driver => ({
      name: driver.driverName.split(' ')[0], // First name only for chart
      trips: driver.tripsCompleted
    }));
  
  // Sort drivers by distance for chart
  const topDriversByDistance = [...data]
    .sort((a, b) => b.totalDistance - a.totalDistance)
    .slice(0, 10)
    .map(driver => ({
      name: driver.driverName.split(' ')[0], // First name only for chart
      distance: Math.round(driver.totalDistance)
    }));
  
  // Prepare data for radar chart comparison of top 3 drivers
  const topDriversComparison = [...data]
    .sort((a, b) => 
      (b.fuelEfficiencyRating + b.safetyScore + b.complianceScore) / 3 - 
      (a.fuelEfficiencyRating + a.safetyScore + a.complianceScore) / 3
    )
    .slice(0, 3)
    .map(driver => ({
      subject: driver.driverName.split(' ')[0],
      efficiency: Math.round(driver.fuelEfficiencyRating),
      safety: Math.round(driver.safetyScore),
      compliance: Math.round(driver.complianceScore)
    }));
  
  // Restructure data for radar chart
  const radarData = [
    { category: 'Fuel Efficiency', ...topDriversComparison.reduce((acc, driver) => ({ ...acc, [driver.subject]: driver.efficiency }), {}) },
    { category: 'Safety Score', ...topDriversComparison.reduce((acc, driver) => ({ ...acc, [driver.subject]: driver.safety }), {}) },
    { category: 'Compliance', ...topDriversComparison.reduce((acc, driver) => ({ ...acc, [driver.subject]: driver.compliance }), {}) }
  ];

  // Get the driver names for the radar chart
  const driverNames = topDriversComparison.map(driver => driver.subject);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Drivers by Trips</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topDriversByTrips}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="trips" fill="#8884d8" name="Trips Completed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Top Drivers by Distance</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topDriversByDistance}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
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
          <CardTitle>Top Drivers Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart outerRadius={150} data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="category" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              
              {driverNames.map((name, index) => (
                <Radar 
                  key={name}
                  name={name}
                  dataKey={name}
                  stroke={index === 0 ? "#8884d8" : index === 1 ? "#82ca9d" : "#ff8042"}
                  fill={index === 0 ? "#8884d8" : index === 1 ? "#82ca9d" : "#ff8042"}
                  fillOpacity={0.6}
                />
              ))}
              
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Driver Performance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Driver</TableHead>
                <TableHead>Trips</TableHead>
                <TableHead>Distance (km)</TableHead>
                <TableHead>Avg Trip Dist</TableHead>
                <TableHead>Fuel Efficiency</TableHead>
                <TableHead>Safety Score</TableHead>
                <TableHead>Compliance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(driver => (
                <TableRow key={driver.driverId}>
                  <TableCell className="font-medium">{driver.driverName}</TableCell>
                  <TableCell>{driver.tripsCompleted}</TableCell>
                  <TableCell>{driver.totalDistance.toLocaleString()}</TableCell>
                  <TableCell>{driver.averageTripDistance.toFixed(1)} km</TableCell>
                  <TableCell>
                    <PerformanceBadge score={driver.fuelEfficiencyRating} />
                  </TableCell>
                  <TableCell>
                    <PerformanceBadge score={driver.safetyScore} />
                  </TableCell>
                  <TableCell>
                    <PerformanceBadge score={driver.complianceScore} />
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

function PerformanceBadge({ score }: { score: number }) {
  let badgeProps = {
    variant: "outline" as const,
    className: ""
  };
  
  if (score >= 90) {
    badgeProps.className = "bg-green-50 text-green-600 border-green-200";
  } else if (score >= 75) {
    badgeProps.className = "bg-blue-50 text-blue-600 border-blue-200";
  } else if (score >= 60) {
    badgeProps.className = "bg-yellow-50 text-yellow-600 border-yellow-200";
  } else {
    badgeProps.className = "bg-red-50 text-red-600 border-red-200";
  }
  
  return (
    <Badge {...badgeProps}>{score.toFixed(1)}%</Badge>
  );
}
