
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
        return <Truck className="h-5 w-5 text-blue-500" />;
      case 'trips':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'alerts':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'maintenance':
        return <BadgeAlert className="h-5 w-5 text-red-500" />;
      case 'efficiency':
        return <BarChart4 className="h-5 w-5 text-indigo-500" />;
      case 'idle':
        return <CircleOff className="h-5 w-5 text-slate-500" />;
      default:
        return <Truck className="h-5 w-5 text-blue-500" />;
    }
  };
  
  const getTrendColor = () => {
    if (!trend) return 'text-gray-500';
    return trend === 'up' 
      ? 'text-green-600 dark:text-green-400'
      : trend === 'down' 
        ? 'text-red-600 dark:text-red-400'
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
