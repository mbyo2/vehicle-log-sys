import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Car, Calendar, FileText, Bell } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';

export const VehicleStatusDashboard = () => {
  const { data: vehicles, isLoading: vehiclesLoading } = useQuery({
    queryKey: ['vehicles-status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          assigned_driver:drivers!vehicles_assigned_to_fkey(
            profile:profiles(full_name)
          )
        `);
      if (error) throw error;
      return data;
    },
  });

  const { notifications, isLoading: notificationsLoading, markAsRead } = useNotifications();

  if (vehiclesLoading || notificationsLoading) return <div>Loading...</div>;

  const getExpiryStatus = (date: string | null) => {
    if (!date) return { status: 'none', days: 0 };
    const days = differenceInDays(new Date(date), new Date());
    return {
      status: days < 0 ? 'expired' : days <= 30 ? 'warning' : 'ok',
      days,
    };
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Vehicles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Car className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{vehicles?.length || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Assigned Vehicles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">
                {vehicles?.filter(v => v.assigned_to).length || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">
                {notifications?.filter(n => n.status === 'unread').length || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Expiring Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">
                {vehicles?.filter(v => {
                  const fitnessStatus = getExpiryStatus(v.fitness_cert_expiry);
                  const insuranceStatus = getExpiryStatus(v.insurance_expiry);
                  const taxStatus = getExpiryStatus(v.road_tax_expiry);
                  return fitnessStatus.status === 'warning' || 
                         insuranceStatus.status === 'warning' || 
                         taxStatus.status === 'warning';
                }).length || 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Recent Alerts</h3>
        {notifications?.filter(n => n.status === 'unread')
          .map((notification) => (
            <Alert key={notification.id} variant={
              notification.priority === 'high' ? 'destructive' : 
              notification.priority === 'medium' ? 'default' : 'default'
            }>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="flex justify-between items-center">
                <span>{notification.type.replace('_', ' ').toUpperCase()}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAsRead.mutate(notification.id)}
                >
                  Mark as Read
                </Button>
              </AlertTitle>
              <AlertDescription>{notification.message}</AlertDescription>
            </Alert>
          ))}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Document Expiry Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles?.map((vehicle) => {
            const fitnessStatus = getExpiryStatus(vehicle.fitness_cert_expiry);
            const insuranceStatus = getExpiryStatus(vehicle.insurance_expiry);
            const taxStatus = getExpiryStatus(vehicle.road_tax_expiry);

            if (fitnessStatus.status === 'ok' && insuranceStatus.status === 'ok' && taxStatus.status === 'ok') {
              return null;
            }

            return (
              <Card key={vehicle.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{vehicle.plate_number}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {fitnessStatus.status !== 'ok' && (
                    <div className="flex items-center justify-between">
                      <span>Fitness Certificate</span>
                      <span className={
                        fitnessStatus.status === 'expired' ? 'text-red-500' : 'text-yellow-500'
                      }>
                        {fitnessStatus.status === 'expired' ? 'Expired' : `${fitnessStatus.days} days left`}
                      </span>
                    </div>
                  )}
                  {insuranceStatus.status !== 'ok' && (
                    <div className="flex items-center justify-between">
                      <span>Insurance</span>
                      <span className={
                        insuranceStatus.status === 'expired' ? 'text-red-500' : 'text-yellow-500'
                      }>
                        {insuranceStatus.status === 'expired' ? 'Expired' : `${insuranceStatus.days} days left`}
                      </span>
                    </div>
                  )}
                  {taxStatus.status !== 'ok' && (
                    <div className="flex items-center justify-between">
                      <span>Road Tax</span>
                      <span className={
                        taxStatus.status === 'expired' ? 'text-red-500' : 'text-yellow-500'
                      }>
                        {taxStatus.status === 'expired' ? 'Expired' : `${taxStatus.days} days left`}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};