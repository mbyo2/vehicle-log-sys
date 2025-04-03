
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Button } from '@/components/ui/button';
import { AlertCircle, CarFront, ChevronRight, Route, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function Dashboard() {
  const { profile } = useAuth();
  const { vehicles } = useVehicles();
  const { dashboardData, maintenanceForecasts } = useAnalytics();
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

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

  const { data: pendingApprovals } = useQuery({
    queryKey: ['pending_approvals_dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_logs')
        .select('*')
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false })
        .limit(3);
      
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
            <ActionCards />
          </div>
        );
      
      case 'company_admin':
        return (
          <div className="space-y-6">
            <VehicleStatusDashboard />
            <MaintenanceForecasting data={maintenanceForecasts} />
            <ActionCards />
            {pendingApprovals && pendingApprovals.length > 0 && (
              <PendingApprovals data={pendingApprovals} />
            )}
          </div>
        );
      
      case 'supervisor':
        return (
          <div className="space-y-6">
            <VehicleStatusDashboard />
            {pendingApprovals && pendingApprovals.length > 0 && (
              <PendingApprovals data={pendingApprovals} />
            )}
            <ActionCards />
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

function ActionCards() {
  const navigate = useNavigate();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Route className="mr-2 h-5 w-5 text-primary" />
            Trip Management
          </CardTitle>
          <CardDescription>Log and manage vehicle trips</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Create, edit, and view trip logs for your fleet vehicles.
          </p>
          <Button 
            variant="secondary" 
            className="w-full flex justify-between items-center"
            onClick={() => navigate('/trips')}
          >
            Manage Trips
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
      
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <CarFront className="mr-2 h-5 w-5 text-primary" />
            Vehicle Assignment
          </CardTitle>
          <CardDescription>Assign vehicles to drivers</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            View and update vehicle assignments for your drivers.
          </p>
          <Button 
            variant="secondary" 
            className="w-full flex justify-between items-center"
            onClick={() => navigate('/fleet')}
          >
            Manage Vehicles
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
      
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Users className="mr-2 h-5 w-5 text-primary" />
            Driver Management
          </CardTitle>
          <CardDescription>Manage your team of drivers</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Add, edit, and view driver profiles and performance.
          </p>
          <Button 
            variant="secondary" 
            className="w-full flex justify-between items-center"
            onClick={() => navigate('/drivers')}
          >
            Manage Drivers
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function PendingApprovals({ data }: { data: any[] }) {
  const navigate = useNavigate();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-amber-600">
          <AlertCircle className="mr-2 h-5 w-5" />
          Pending Trip Approvals
        </CardTitle>
        <CardDescription>Trips waiting for your approval</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <>
            <div className="space-y-4">
              {data.map((trip) => (
                <Alert key={trip.id} variant="outline" className="border-amber-200 bg-amber-50">
                  <AlertTitle className="text-amber-800">
                    Trip by {trip.driver_id} on {new Date(trip.start_time).toLocaleDateString()}
                  </AlertTitle>
                  <AlertDescription className="text-amber-700">
                    {trip.purpose} - {trip.end_kilometers - trip.start_kilometers} km
                  </AlertDescription>
                </Alert>
              ))}
            </div>
            <div className="mt-4 text-center">
              <Button 
                variant="outline" 
                className="text-amber-600 border-amber-200 hover:text-amber-700 hover:border-amber-300 hover:bg-amber-50"
                onClick={() => navigate('/trip-approvals')}
              >
                View All Pending Approvals
              </Button>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground text-center py-4">No pending approvals at this time</p>
        )}
      </CardContent>
    </Card>
  );
}
