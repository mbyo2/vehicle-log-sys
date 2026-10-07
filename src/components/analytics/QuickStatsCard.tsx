
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CircleOff, BadgeAlert, BarChart4, TrendingUp, AlertTriangle, Truck } from 'lucide-react';
import { useIsMobile } from '@/hooks/useIsMobile';

export interface QuickStatProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: 'vehicles' | 'trips' | 'alerts' | 'maintenance' | 'efficiency' | 'idle';
  loading?: boolean;
}

export function QuickStatsCard({ title, value, change, trend, icon = 'vehicles', loading = false }: QuickStatProps) {
  const isMobile = useIsMobile();
  
  const getIcon = () => {
    switch (icon) {
      case 'vehicles':
        return <Truck className="h-5 w-5 text-info" />;
      case 'trips':
        return <TrendingUp className="h-5 w-5 text-success" />;
      case 'alerts':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'maintenance':
        return <BadgeAlert className="h-5 w-5 text-destructive" />;
      case 'efficiency':
        return <BarChart4 className="h-5 w-5 text-indigo-500" />;
      case 'idle':
        return <CircleOff className="h-5 w-5 text-slate-500" />;
      default:
        return <Truck className="h-5 w-5 text-info" />;
    }
  };
  
  const getTrendColor = () => {
    if (!trend) return 'text-gray-500';
    return trend === 'up' 
      ? 'text-success'
      : trend === 'down' 
        ? 'text-destructive'
        : 'text-gray-500';
  };
  
  const getTrendSymbol = () => {
    if (!trend) return '';
    return trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
  };
  
  return (
    <Card className={`${loading ? 'opacity-70' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className={`text-sm font-medium ${isMobile ? 'text-xs' : ''}`}>{title}</CardTitle>
        {getIcon()}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-6 bg-muted animate-pulse rounded-md w-16" />
        ) : (
          <>
            <div className={`text-xl font-bold ${isMobile ? 'text-lg' : ''}`}>{value}</div>
            {change && (
              <p className={`text-xs ${getTrendColor()}`}>
                <span>{getTrendSymbol()}</span> {change}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function QuickStatsGrid({ stats }: { stats: QuickStatProps[] }) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {stats.map((stat, index) => (
        <QuickStatsCard key={index} {...stat} />
      ))}
    </div>
  );
}
