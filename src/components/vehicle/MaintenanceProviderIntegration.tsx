
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Calendar, AlarmClock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Separator } from "@/components/ui/separator";

interface ScheduledMaintenance {
  id: string;
  provider: string;
  scheduledDate: string;
  serviceType: string;
  status: string;
}

export const MaintenanceProviderIntegration = ({ vehicleId }: { vehicleId?: string }) => {
  const [providerName, setProviderName] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [scheduledServices, setScheduledServices] = useState<ScheduledMaintenance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Fetch scheduled maintenance for the vehicle
  useEffect(() => {
    const fetchScheduledMaintenance = async () => {
      if (!vehicleId) return;

      try {
        setIsLoading(true);

        const result = await supabase.functions.invoke('handle-integration', {
          body: {
            type: 'maintenance',
            action: 'get_schedule',
            payload: {
              vehicleId
            }
          }
        });

        if (result.error) throw new Error(result.error.message);

        // Process the result data
        setScheduledServices(result.data || []);
      } catch (error) {
        console.error('Error fetching scheduled maintenance:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (vehicleId) {
      fetchScheduledMaintenance();
    }
  }, [vehicleId]);

  const connectProvider = async () => {
    if (!providerName.trim() || !accountNumber || !vehicleId) return;

    try {
      setIsConnecting(true);

      const result = await supabase.functions.invoke('handle-integration', {
        body: {
          type: 'maintenance',
          action: 'connect_provider',
          payload: {
            vehicleId,
            providerName: providerName.trim(),
            accountNumber
          }
        }
      });

      if (result.error) throw new Error(result.error.message);

      toast({
        title: "Provider saved",
        description: result.data?.message || `${providerName.trim()} saved for this vehicle`
      });

      // Refresh the scheduled maintenance data
      const scheduleResult = await supabase.functions.invoke('handle-integration', {
        body: {
          type: 'maintenance',
          action: 'get_schedule',
          payload: { vehicleId }
        }
      });

      if (!scheduleResult.error) {
        setScheduledServices(scheduleResult.data || []);
      }
    } catch (error: any) {
      console.error('Error connecting provider:', error);
      toast({
        variant: "destructive",
        title: "Connection failed",
        description: error.message || "Could not save the maintenance provider"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Maintenance Provider Integration</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="providerName">Maintenance Provider Name</Label>
              <Input
                id="providerName"
                placeholder="e.g. your workshop or servicing partner"
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account/Reference Number</Label>
              <Input
                id="accountNumber"
                placeholder="Enter your account number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>

            <Button
              onClick={connectProvider}
              disabled={isConnecting || !providerName.trim() || !accountNumber}
            >
              {isConnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Provider
            </Button>

            <p className="text-xs text-muted-foreground">
              Saving a provider records it against this vehicle. Service jobs are only
              listed here once they exist in your maintenance schedule — nothing is
              invented automatically.
            </p>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-medium mb-2">Scheduled Maintenance</h3>
            {isLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : scheduledServices.length > 0 ? (
              <div className="space-y-3">
                {scheduledServices.map(service => (
                  <div key={service.id} className="flex items-start p-3 border rounded-md">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{service.serviceType}</p>
                      <p className="text-sm text-muted-foreground">
                        Provider: {service.provider}
                      </p>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <AlarmClock className="h-4 w-4 mr-1" />
                        <span>
                          {new Date(service.scheduledDate).toLocaleDateString()}
                        </span>
                        <span className="mx-2">•</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          service.status === 'completed' ? 'bg-success/10 text-success' :
                          service.status === 'in_progress' ? 'bg-info/10 text-info' :
                          'bg-warning/10 text-warning'
                        }`}>
                          {service.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                No scheduled maintenance for this vehicle yet. Add one from the
                Maintenance page.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
