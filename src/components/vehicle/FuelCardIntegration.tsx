
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const FuelCardIntegration = ({ vehicleId }: { vehicleId?: string }) => {
  const [cardNumber, setCardNumber] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const connectFuelCard = async () => {
    if (!cardNumber || !vehicleId) return;

    try {
      setIsConnecting(true);
      setError(null);
      
      const result = await supabase.functions.invoke('handle-integration', {
        body: {
          type: 'fuel_card',
          action: 'connect',
          payload: {
            vehicleId,
            cardNumber
          }
        }
      });
      
      if (result.error) throw new Error(result.error.message);
      
      setIsConnected(true);
      toast({
        title: "Fuel card connected",
        description: "Fuel card has been successfully linked to this vehicle"
      });
    } catch (error: any) {
      console.error('Error connecting fuel card:', error);
      setError(error.message || 'Failed to connect fuel card');
      toast({
        variant: "destructive",
        title: "Connection failed",
        description: error.message || "Could not connect the fuel card"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const syncFuelTransactions = async () => {
    if (!vehicleId) return;

    try {
      setIsConnecting(true);
      
      const result = await supabase.functions.invoke('handle-integration', {
        body: {
          type: 'fuel_card',
          action: 'sync_transactions',
          payload: {
            vehicleId
          }
        }
      });
      
      if (result.error) throw new Error(result.error.message);
      
      toast({
        title: "Transactions synced",
        description: "Fuel card transactions have been successfully synced"
      });
    } catch (error: any) {
      console.error('Error syncing transactions:', error);
      toast({
        variant: "destructive",
        title: "Sync failed",
        description: error.message || "Could not sync fuel card transactions"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fuel Card Integration</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {isConnected ? (
          <div className="space-y-4">
            <Alert className="bg-primary/10 border-primary/20">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <AlertTitle>Connected</AlertTitle>
              <AlertDescription>
                Fuel card is connected to this vehicle
              </AlertDescription>
            </Alert>
            
            <Button onClick={syncFuelTransactions} disabled={isConnecting}>
              {isConnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sync Transactions
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cardNumber">Fuel Card Number</Label>
              <Input
                id="cardNumber"
                placeholder="Enter fuel card number"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
              />
            </div>
            
            <Button onClick={connectFuelCard} disabled={isConnecting || !cardNumber}>
              {isConnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Connect Fuel Card
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
