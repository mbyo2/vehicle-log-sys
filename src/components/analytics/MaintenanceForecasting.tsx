
import { MaintenanceAnalysis } from '@/types/analytics';
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
import { format, isPast } from 'date-fns';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';

interface MaintenanceForecastingProps {
  data: MaintenanceAnalysis[];
}

export function MaintenanceForecasting({ data }: MaintenanceForecastingProps) {
  // Calculate total past and projected costs
  const totalPastCosts = data.reduce((sum, vehicle) => sum + vehicle.pastCosts, 0);
  const totalProjectedCosts = data.reduce((sum, vehicle) => sum + vehicle.projectedCosts, 0);
  
  // Count vehicles needing maintenance soon
  const maintenanceSoonCount = data.filter(vehicle => {
    if (vehicle.nextMaintenanceDate === 'Not scheduled') return false;
    
    const maintenanceDate = new Date(vehicle.nextMaintenanceDate);
    const today = new Date();
    
    // Check if maintenance date is within the next 14 days
    return maintenanceDate.getTime() - today.getTime() < 14 * 24 * 60 * 60 * 1000;
  }).length;
  
  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  // Sort vehicles by projected costs
  const topVehiclesByProjectedCosts = [...data]
    .sort((a, b) => b.projectedCosts - a.projectedCosts)
    .slice(0, 10)
    .map(vehicle => ({
      name: vehicle.plateNumber,
      value: Math.round(vehicle.projectedCosts)
    }));
  
  // Prepare maintenance items for pie chart
  const maintenanceTypeData = data
    .flatMap(vehicle => vehicle.maintenanceItems)
    .reduce((acc, item) => {
      const existingItem = acc.find(i => i.name === item.item);
      if (existingItem) {
        existingItem.value += item.estimatedCost;
      } else {
        acc.push({ name: item.item, value: item.estimatedCost });
      }
      return acc;
    }, [] as { name: string; value: number }[])
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // Top 5 maintenance types by cost

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Historical Maintenance Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPastCosts.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Projected Maintenance Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalProjectedCosts.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Vehicles Needing Maintenance Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maintenanceSoonCount}</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Vehicles by Projected Cost</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topVehiclesByProjectedCosts}
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
                <Tooltip formatter={(value) => [`$${value}`, "Projected Cost"]} />
                <Bar dataKey="value" fill="#8884d8" name="Projected Cost" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Maintenance Type Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={maintenanceTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {maintenanceTypeData.map((entry, index) => (
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
          <CardTitle>Upcoming Maintenance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Make/Model</TableHead>
                <TableHead>Next Service</TableHead>
                <TableHead>Past Costs</TableHead>
                <TableHead>Projected Costs</TableHead>
                <TableHead>Priority Items</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(vehicle => (
                <TableRow key={vehicle.vehicleId}>
                  <TableCell className="font-medium">{vehicle.plateNumber}</TableCell>
                  <TableCell>{vehicle.make} {vehicle.model}</TableCell>
                  <TableCell>
                    {vehicle.nextMaintenanceDate === 'Not scheduled' ? (
                      'Not scheduled'
                    ) : (
                      <MaintenanceDateBadge date={vehicle.nextMaintenanceDate} />
                    )}
                  </TableCell>
                  <TableCell>${vehicle.pastCosts.toLocaleString()}</TableCell>
                  <TableCell>${vehicle.projectedCosts.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {vehicle.maintenanceItems
                        .filter(item => item.priority === 'high')
                        .slice(0, 2)
                        .map((item, index) => (
                          <Badge key={index} variant="outline" className="bg-red-50 text-red-600 border-red-200">
                            {item.item}
                          </Badge>
                        ))}
                      {vehicle.maintenanceItems.filter(item => item.priority === 'high').length > 2 && (
                        <Badge variant="outline">+{vehicle.maintenanceItems.filter(item => item.priority === 'high').length - 2} more</Badge>
                      )}
                    </div>
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

function MaintenanceDateBadge({ date }: { date: string }) {
  const maintenanceDate = new Date(date);
  const today = new Date();
  const isOverdue = isPast(maintenanceDate);
  
  // Calculate days until maintenance
  const diffTime = maintenanceDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  let badgeProps = {
    variant: "outline" as const,
    className: ""
  };
  
  if (isOverdue) {
    badgeProps.className = "bg-red-50 text-red-600 border-red-200";
  } else if (diffDays <= 7) {
    badgeProps.className = "bg-yellow-50 text-yellow-600 border-yellow-200";
  } else if (diffDays <= 30) {
    badgeProps.className = "bg-blue-50 text-blue-600 border-blue-200";
  } else {
    badgeProps.className = "bg-green-50 text-green-600 border-green-200";
  }
  
  return (
    <Badge {...badgeProps}>
      {format(maintenanceDate, 'MMM dd, yyyy')}
      {isOverdue && " (Overdue)"}
      {!isOverdue && diffDays <= 7 && " (Soon)"}
    </Badge>
  );
}
