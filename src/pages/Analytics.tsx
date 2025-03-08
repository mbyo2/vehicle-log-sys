
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalytics } from '@/hooks/useAnalytics';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { FleetUtilizationAnalytics } from '@/components/analytics/FleetUtilizationAnalytics';
import { CostAnalysisReport } from '@/components/analytics/CostAnalysisReport';
import { DriverPerformance } from '@/components/analytics/DriverPerformance';
import { MaintenanceForecasting } from '@/components/analytics/MaintenanceForecasting';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function Analytics() {
  const { 
    dateRange, 
    setDateRange,
    dashboardData,
    fleetUtilization,
    costAnalysis,
    driverPerformance,
    maintenanceForecasts,
    isDashboardLoading,
    isFleetUtilizationLoading,
    isCostAnalysisLoading,
    isDriverPerformanceLoading,
    isMaintenanceForecastLoading
  } = useAnalytics();

  const [selectedTab, setSelectedTab] = useState("dashboard");

  const handleDateRangeChange = (e: React.FormEvent) => {
    e.preventDefault();
    // Date range is already updated via state
  };

  if (isDashboardLoading && selectedTab === "dashboard") {
    return <LoadingState />;
  }

  if (isFleetUtilizationLoading && selectedTab === "fleet-utilization") {
    return <LoadingState />;
  }

  if (isCostAnalysisLoading && selectedTab === "cost-analysis") {
    return <LoadingState />;
  }

  if (isDriverPerformanceLoading && selectedTab === "driver-performance") {
    return <LoadingState />;
  }

  if (isMaintenanceForecastLoading && selectedTab === "maintenance-forecasts") {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Analytics & Reporting</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Date Range Filter</CardTitle>
          <CardDescription>Select a date range for your analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-wrap items-end gap-4 mb-6" onSubmit={handleDateRangeChange}>
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
              />
            </div>
            <div>
              <Button type="submit">Apply Filters</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Tabs 
        value={selectedTab} 
        onValueChange={setSelectedTab} 
        className="w-full"
      >
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="fleet-utilization">Fleet Utilization</TabsTrigger>
          <TabsTrigger value="cost-analysis">Cost Analysis</TabsTrigger>
          <TabsTrigger value="driver-performance">Driver Performance</TabsTrigger>
          <TabsTrigger value="maintenance-forecasts">Maintenance Forecasts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard">
          {dashboardData && <AnalyticsDashboard data={dashboardData} />}
        </TabsContent>
        
        <TabsContent value="fleet-utilization">
          {fleetUtilization && <FleetUtilizationAnalytics data={fleetUtilization} />}
        </TabsContent>
        
        <TabsContent value="cost-analysis">
          {costAnalysis && <CostAnalysisReport data={costAnalysis} />}
        </TabsContent>
        
        <TabsContent value="driver-performance">
          {driverPerformance && <DriverPerformance data={driverPerformance} />}
        </TabsContent>
        
        <TabsContent value="maintenance-forecasts">
          {maintenanceForecasts && <MaintenanceForecasting data={maintenanceForecasts} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex justify-center items-center h-96">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
        <h3 className="text-xl font-medium">Loading analytics data...</h3>
        <p className="text-muted-foreground mt-2">This may take a moment</p>
      </div>
    </div>
  );
}
