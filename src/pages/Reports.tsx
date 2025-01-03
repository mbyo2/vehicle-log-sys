import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, LineChart, PieChart, Activity, DollarSign } from "lucide-react";
import { FleetUtilization } from "@/components/reports/FleetUtilization";
import { CostAnalysis } from "@/components/reports/CostAnalysis";
import { MaintenanceCosts } from "@/components/reports/MaintenanceCosts";
import { FuelAnalytics } from "@/components/reports/FuelAnalytics";
import { CompanyMetrics } from "@/components/reports/CompanyMetrics";

export function Reports() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Reports & Analytics</h1>

      <Tabs defaultValue="company" className="space-y-4">
        <TabsList>
          <TabsTrigger value="company">
            <PieChart className="h-4 w-4 mr-2" />
            Company Metrics
          </TabsTrigger>
          <TabsTrigger value="fleet">
            <Activity className="h-4 w-4 mr-2" />
            Fleet Utilization
          </TabsTrigger>
          <TabsTrigger value="costs">
            <DollarSign className="h-4 w-4 mr-2" />
            Cost Analysis
          </TabsTrigger>
          <TabsTrigger value="maintenance">
            <BarChart className="h-4 w-4 mr-2" />
            Maintenance Costs
          </TabsTrigger>
          <TabsTrigger value="fuel">
            <LineChart className="h-4 w-4 mr-2" />
            Fuel Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <CompanyMetrics />
        </TabsContent>

        <TabsContent value="fleet">
          <FleetUtilization />
        </TabsContent>

        <TabsContent value="costs">
          <CostAnalysis />
        </TabsContent>

        <TabsContent value="maintenance">
          <MaintenanceCosts />
        </TabsContent>

        <TabsContent value="fuel">
          <FuelAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}