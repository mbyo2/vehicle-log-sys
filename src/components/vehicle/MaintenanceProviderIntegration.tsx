
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, Calendar, AlarmClock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface MaintenanceProvider {
  id: string;
  name: string;
  type: string;
}

interface ScheduledMaintenance {
  id: string;
  provider: string;
  scheduledDate: string;
  serviceType: string;
  status: string;
}

export const MaintenanceProviderIntegration = ({ vehicleId }: { vehicleId?: string }) => {
  const [providers, setProviders] = useState<MaintenanceProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [scheduledServices, setScheduledServices] = useState<ScheduledMaintenance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Fetch available maintenance providers
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setIsLoading(true);
        
        // Simulate API call to get maintenance providers
        // In a real implementation, this would come from the database or an external API
        setTimeout(() => {
          setProviders([
            { id: 'provider1', name: 'AutoCare Services', type: 'general' },
            { id: 'provider2', name: 'TireWorks', type: 'tires' },
            { id: 'provider3', name: 'ElectricalExperts', type: 'electrical' },
            { id: 'provider4', name: 'FastLube', type: 'oil_change' }
          ]);
          setIsLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error fetching providers:', error);
        setIsLoading(false);
      }
    };

    fetchProviders();
  }, []);

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
    if (!selectedProvider || !accountNumber || !vehicleId) return;

    try {
      setIsConnecting(true);
      
      const result = await supabase.functions.invoke('handle-integration', {
        body: {
          type: 'maintenance',
          action: 'connect_provider',
          payload: {
            vehicleId,
            providerId: selectedProvider,
            accountNumber
          }
        }
      });
      
      if (result.error) throw new Error(result.error.message);
      
      toast({
        title: "Provider connected",
        description: "Maintenance provider has been successfully connected"
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
        description: error.message || "Could not connect to the maintenance provider"
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
              <Label htmlFor="provider">Select Maintenance Provider</Label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger id="provider">
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map(provider => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name} - {provider.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              disabled={isConnecting || !selectedProvider || !accountNumber}
            >
              {isConnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Connect Provider
            </Button>
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
                          service.status === 'completed' ? 'bg-green-100 text-green-800' :
                          service.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
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
                No scheduled maintenance found. Connect with a provider to view scheduled services.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
