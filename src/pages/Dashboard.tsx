
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useVehicles } from '@/hooks/useVehicles';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { VehicleStatusDashboard } from '@/components/vehicle/VehicleStatusDashboard';
import { DriverDashboard } from '@/components/driver/DriverDashboard';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { MaintenanceForecasting } from '@/components/analytics/MaintenanceForecasting';
import { useEffect, useState } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Dashboard() {
  const { profile } = useAuth();
  const { vehicles } = useVehicles();
  const { dashboardData, maintenanceForecasts } = useAnalytics();
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  const { data: recentTrips } = useQuery({
    queryKey: ['recent_trips_dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trip_logs')
        .select('*')
        .order('start_time', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (dashboardData && maintenanceForecasts && vehicles) {
      setLoading(false);
    }
  }, [dashboardData, maintenanceForecasts, vehicles]);

  const getRoleSpecificContent = () => {
    const userRole = profile.get()?.role;
    
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      );
    }
    
    switch (userRole) {
      case 'super_admin':
        return (
          <div className="space-y-6">
            <AnalyticsDashboard data={dashboardData} />
          </div>
        );
      
      case 'company_admin':
        return (
          <div className="space-y-6">
            <VehicleStatusDashboard />
            <MaintenanceForecasting data={maintenanceForecasts} />
          </div>
        );
      
      case 'supervisor':
        return (
          <div className="space-y-6">
            <VehicleStatusDashboard />
          </div>
        );
      
      case 'driver':
        return <DriverDashboard />;
      
      default:
        return (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Loading Dashboard</h3>
              <p>Please wait while we load your dashboard...</p>
            </Card>
          </div>
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className={`text-2xl md:text-3xl font-bold ${isMobile ? 'text-center mb-4' : ''}`}>
          Welcome, {profile.get()?.full_name || 'User'}
        </h1>
        {getRoleSpecificContent()}
      </div>
    </DashboardLayout>
  );
}
