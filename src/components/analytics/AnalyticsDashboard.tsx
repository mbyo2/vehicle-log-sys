
import { 
  AnalyticsDashboardData 
} from '@/types/analytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Activity, Calendar, Car, Clock, DollarSign, TrendingUp, User, Wrench } from 'lucide-react';

interface AnalyticsDashboardProps {
  data: AnalyticsDashboardData;
}

export function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  // For the cost breakdown pie chart
  const costData = [
    { name: 'Fuel', value: data.costBreakdown.fuelCosts },
    { name: 'Maintenance', value: data.costBreakdown.maintenanceCosts },
    { name: 'Other', value: data.costBreakdown.otherCosts }
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Fleet Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.fleetUtilization.totalVehicles}</div>
            <p className="text-xs text-muted-foreground">
              {data.fleetUtilization.activeVehicles} active vehicles
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Fleet Utilization</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.fleetUtilization.averageUtilization}%</div>
            <p className="text-xs text-muted-foreground">
              Average utilization rate
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.costBreakdown.totalCosts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              For the selected period
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Drivers</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.driverStats.activeDrivers}</div>
            <p className="text-xs text-muted-foreground">
              Out of {data.driverStats.totalDrivers} total drivers
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Fleet Utilization Trend</CardTitle>
            <CardDescription>Percentage over time</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.fleetUtilization.utilizationTrend}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}%`, "Utilization"]} />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8884d8" 
                  activeDot={{ r: 8 }} 
                  name="Utilization"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Monthly Cost Breakdown</CardTitle>
            <CardDescription>Expenses over time</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.costBreakdown.monthlyCostTrend}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, "Cost"]} />
                <Bar dataKey="value" fill="#82ca9d" name="Monthly Cost" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Additional Data Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Cost Distribution</CardTitle>
            <CardDescription>Breakdown by category</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={costData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {costData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${value}`, ""]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Top Performing Drivers</CardTitle>
            <CardDescription>Based on performance score</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.driverStats.topPerformers.map((driver, index) => (
                <div key={driver.driverId} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center mr-3">
                      {index + 1}
                    </div>
                    <span>{driver.driverName}</span>
                  </div>
                  <div className="font-semibold">{driver.score}%</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Maintenance Overview</CardTitle>
            <CardDescription>Upcoming maintenance needs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Upcoming Maintenance</span>
                </div>
                <div className="font-semibold">{data.maintenanceOverview.upcomingMaintenanceCount}</div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Overdue Maintenance</span>
                </div>
                <div className="font-semibold text-red-500">
                  {data.maintenanceOverview.overdueMaintenanceCount}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Wrench className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Est. Monthly Costs</span>
                </div>
                <div className="font-semibold">
                  ${data.maintenanceOverview.estimatedMonthlyCosts.toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
