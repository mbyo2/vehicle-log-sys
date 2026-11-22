
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
        title: "Details saved",
        description: "Fuel card details saved for this vehicle. No live fuel card provider is connected yet."
      });
    } catch (error: any) {
      console.error('Error connecting fuel card:', error);
      setError(error.message || 'Failed to save fuel card details');
      toast({
        variant: "destructive",
        title: "Save failed",
        description: error.message || "Could not save fuel card details"
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

      const imported = result.data?.imported ?? 0;
      toast({
        title: imported > 0 ? "Transactions synced" : "Nothing imported",
        description: result.data?.message || "No live fuel card provider is connected yet, so no transactions were imported."
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
              <AlertTitle>Details saved</AlertTitle>
              <AlertDescription>
                Fuel card details are saved for this vehicle. No live fuel card provider is connected yet.
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
              Save Card Details
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
