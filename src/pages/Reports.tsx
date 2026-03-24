import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, LineChart, PieChart, Activity, DollarSign } from "lucide-react";
import { FleetUtilization } from "@/components/reports/FleetUtilization";
import { CostAnalysis } from "@/components/reports/CostAnalysis";
import { MaintenanceCosts } from "@/components/reports/MaintenanceCosts";
import { FuelAnalytics } from "@/components/reports/FuelAnalytics";
import { CompanyMetrics } from "@/components/reports/CompanyMetrics";
import { useIndustryConfig } from "@/hooks/useIndustryConfig";

const iconMap: Record<string, React.ElementType> = {
  PieChart, Activity, DollarSign, BarChart, LineChart,
};

export function Reports() {
  const { reportTabs, industryInfo } = useIndustryConfig();

  const tabComponents: Record<string, React.ReactNode> = {
    company: <CompanyMetrics />,
    fleet: <FleetUtilization />,
    costs: <CostAnalysis />,
    maintenance: <MaintenanceCosts />,
    fuel: <FuelAnalytics />,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{industryInfo.name} Reports & Analytics</h1>

      <Tabs defaultValue="company" className="space-y-4">
        <TabsList>
          {reportTabs.map((tab) => {
            const Icon = iconMap[tab.icon] || PieChart;
            return (
              <TabsTrigger key={tab.value} value={tab.value}>
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {reportTabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            {tabComponents[tab.value] || <CompanyMetrics />}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
