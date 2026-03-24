import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useIndustryConfig } from '@/hooks/useIndustryConfig';
import { Badge } from '@/components/ui/badge';
import {
  Car, MapPin, Wrench, FileText, Clock, AlertTriangle,
  Package, TrendingUp, BarChart, Truck, ArrowDown, Building
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  Car, MapPin, Wrench, FileText, Clock, AlertTriangle,
  Package, TrendingUp, BarChart, Truck, ArrowDown, Building,
  Fuel: TrendingUp,
  Tractor: Car,
  Activity: BarChart,
  PieChart: BarChart,
  DollarSign: TrendingUp,
  LineChart: TrendingUp,
};

export function IndustryDashboardWidgets() {
  const { dashboardWidgets, industryInfo, industryType } = useIndustryConfig();

  if (industryType === 'general' || industryType === 'other') {
    return null; // Use default dashboard for general
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">{industryInfo.name} Overview</h2>
        <Badge variant="outline" className="capitalize">{industryType}</Badge>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardWidgets.map((widget, index) => {
          const IconComponent = iconMap[widget.icon] || Car;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {widget.title}
                </CardTitle>
                <IconComponent className={`h-4 w-4 ${widget.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">—</div>
                <p className="text-xs text-muted-foreground">{widget.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
