
import { CostAnalysisData } from '@/types/analytics';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';

interface CostAnalysisReportProps {
  data: CostAnalysisData[];
}

export function CostAnalysisReport({ data }: CostAnalysisReportProps) {
  // Calculate totals
  const totalFuelCosts = data.reduce((sum, vehicle) => sum + vehicle.fuelCosts, 0);
  const totalMaintenanceCosts = data.reduce((sum, vehicle) => sum + vehicle.maintenanceCosts, 0);
  const totalOverallCosts = data.reduce((sum, vehicle) => sum + vehicle.totalCosts, 0);
  
  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  // Prepare data for vehicle cost comparison chart
  const vehicleCostComparisonData = [...data]
    .sort((a, b) => b.totalCosts - a.totalCosts)
    .slice(0, 10)
    .map(vehicle => ({
      name: vehicle.plateNumber,
      fuelCosts: Math.round(vehicle.fuelCosts),
      maintenanceCosts: Math.round(vehicle.maintenanceCosts)
    }));
  
  // Prepare data for cost per kilometer chart
  const costPerKmData = [...data]
    .filter(vehicle => vehicle.costPerKilometer > 0)
    .sort((a, b) => b.costPerKilometer - a.costPerKilometer)
    .slice(0, 10)
    .map(vehicle => ({
      name: vehicle.plateNumber,
      value: Math.round(vehicle.costPerKilometer * 100) / 100
    }));
    
  // Prepare data for cost breakdown pie chart
  const costBreakdownData = [
    { name: "Fuel", value: totalFuelCosts },
    { name: "Maintenance", value: totalMaintenanceCosts }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Fuel Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalFuelCosts.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Maintenance Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalMaintenanceCosts.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Fleet Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalOverallCosts.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cost Breakdown by Vehicle</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={vehicleCostComparisonData}
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
                <Tooltip formatter={(value) => [`$${value}`, ""]} />
                <Bar dataKey="fuelCosts" fill="#8884d8" name="Fuel Costs" />
                <Bar dataKey="maintenanceCosts" fill="#82ca9d" name="Maintenance Costs" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Cost Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={costBreakdownData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {costBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, ""]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Cost Per Kilometer by Vehicle</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={costPerKmData}
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
              <Tooltip formatter={(value) => [`$${value}/km`, "Cost"]} />
              <Bar dataKey="value" fill="#FF8042" name="Cost per KM" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Cost Analysis Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Fuel Costs</TableHead>
                <TableHead>Maintenance Costs</TableHead>
                <TableHead>Total Costs</TableHead>
                <TableHead>Cost/Kilometer</TableHead>
                <TableHead>Monthly Avg</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(vehicle => (
                <TableRow key={vehicle.vehicleId}>
                  <TableCell className="font-medium">{vehicle.plateNumber}</TableCell>
                  <TableCell>${vehicle.fuelCosts.toLocaleString()}</TableCell>
                  <TableCell>${vehicle.maintenanceCosts.toLocaleString()}</TableCell>
                  <TableCell>${vehicle.totalCosts.toLocaleString()}</TableCell>
                  <TableCell>
                    ${vehicle.costPerKilometer.toFixed(2)}/km
                  </TableCell>
                  <TableCell>${vehicle.monthlyAverageCost.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
