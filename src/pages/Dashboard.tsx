
import { useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { CompanyMetrics } from '@/components/reports/CompanyMetrics';
import { FleetUtilization } from '@/components/reports/FleetUtilization';
import { useAuth } from '@/contexts/AuthContext';
import { AdPlacement } from '@/components/advertisements/AdPlacement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/useIsMobile';
import { WelcomeBanner } from '@/components/onboarding/WelcomeBanner';
import { QuickStatsGrid } from '@/components/analytics/QuickStatsCard';
import { QuickStatProps } from '@/components/analytics/QuickStatsCard';

export default function Dashboard() {
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const userData = profile.get();
  const userRole = userData?.role;
  
  useEffect(() => {
    document.title = 'Dashboard | Fleet Manager';
  }, []);
  
  // Example quick stats based on user role
  const getQuickStats = (): QuickStatProps[] => {
    if (userRole === 'driver') {
      return [
        { title: 'My Trips', value: '24', change: '4 this week', trend: 'up', icon: 'trips' },
        { title: 'Total Distance', value: '1,243 km', change: '12% from last month', trend: 'up', icon: 'efficiency' },
        { title: 'Vehicle Status', value: 'Ready', icon: 'vehicles' },
        { title: 'Maintenance', value: 'Up to date', icon: 'maintenance' },
      ];
    }
    
    return [
      { title: 'Active Vehicles', value: '42', change: '2 more than last month', trend: 'up', icon: 'vehicles' },
      { title: 'Trips This Week', value: '156', change: '23% increase', trend: 'up', icon: 'trips' },
      { title: 'Maintenance Alerts', value: '3', change: '2 less than last week', trend: 'down', icon: 'maintenance' },
      { title: 'Idle Vehicles', value: '5', change: '12% of fleet', icon: 'idle' },
    ];
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className={`text-3xl font-bold ${isMobile ? 'text-center' : ''}`}>
          Dashboard
        </h1>
        
        <WelcomeBanner />
        
        <QuickStatsGrid stats={getQuickStats()} />
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            {userRole !== 'driver' && (
              <TabsTrigger value="advertising">Advertising</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
              <CompanyMetrics />
              <FleetUtilization />
            </div>
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-4 mt-4">
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
              <FleetUtilization />
              <CompanyMetrics />
            </div>
          </TabsContent>
          
          {userRole !== 'driver' && (
            <TabsContent value="advertising" className="space-y-4 mt-4">
              <AdPlacement />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
