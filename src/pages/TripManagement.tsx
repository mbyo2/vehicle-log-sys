
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TripLogForm } from "@/components/vehicle/TripLogForm";
import { TripAnalytics } from "@/components/vehicle/TripAnalytics";
import { TripList } from "@/components/vehicle/TripList";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Plus, WifiOff, AlertTriangle, CloudOff } from "lucide-react";
import { useTripLog } from "@/hooks/useTripLog";
import { useIsMobile, useOfflineSync } from "@/hooks/use-mobile";
import { useToast } from "@/components/ui/use-toast";

export function TripManagement() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("my-trips");
  const { tripLog, updateTripLog, saveTripLog, isOfflineSaved, syncOfflineTripLogs } = useTripLog();
  const isMobile = useIsMobile();
  const { pendingRecords, isOnline, isSyncing } = useOfflineSync();
  const { toast } = useToast();
  
  // Auto-sync when coming back online
  useEffect(() => {
    const handleOnline = () => {
      if (pendingRecords > 0) {
        toast({
          title: "Back Online",
          description: `You're back online. ${pendingRecords} trip logs ready to sync.`,
        });
        // Auto-sync after a short delay
        const timer = setTimeout(() => {
          syncOfflineTripLogs();
        }, 2000);
        return () => clearTimeout(timer);
      }
    };
    
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [pendingRecords, syncOfflineTripLogs, toast]);
  
  const handleSave = async () => {
    await saveTripLog();
    setIsOpen(false);
    
    if (!isOnline && isOfflineSaved) {
      toast({
        title: "Saved Offline",
        description: "Trip log saved locally and will sync when you're back online.",
      });
    }
  };
  
  // Handle network status
  useEffect(() => {
    if (!isOnline && selectedTab === "analytics") {
      // Auto-switch to my-trips tab when offline and on analytics
      setSelectedTab("my-trips");
    }
  }, [isOnline, selectedTab]);
  
  return (
    <div className="space-y-6">
      <div className={`flex ${isMobile ? 'flex-col space-y-4' : 'justify-between'} items-center mb-6`}>
        <h1 className="text-2xl md:text-3xl font-bold">Trip Management</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className={isMobile ? 'w-full' : ''}>
              <Plus className="mr-2 h-4 w-4" />
              Log New Trip
            </Button>
          </DialogTrigger>
          <DialogContent className={isMobile ? 'w-[95vw] max-w-lg' : 'max-w-2xl'}>
            <DialogHeader>
              <DialogTitle>Log New Trip</DialogTitle>
            </DialogHeader>
            <TripLogForm
              tripLog={tripLog}
              onTripLogChange={updateTripLog}
            />
            <div className="flex justify-end gap-4 mt-4">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSyncing}>
                {isSyncing ? 'Syncing...' : 'Save Trip'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!isOnline && (
        <Alert className="mb-4 bg-yellow-50 border-yellow-200">
          <CloudOff className="h-4 w-4 text-yellow-600" />
          <AlertTitle>Offline Mode</AlertTitle>
          <AlertDescription>
            You're currently offline. Limited functionality is available, and changes will be saved locally.
          </AlertDescription>
        </Alert>
      )}

      {pendingRecords > 0 && (
        <Alert className="mb-4 bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle>Offline data pending sync</AlertTitle>
          <AlertDescription>
            You have {pendingRecords} trip{pendingRecords > 1 ? 's' : ''} stored offline. 
            They will automatically sync when you're back online or you can 
            <Button 
              variant="link" 
              className="px-1 text-yellow-700 h-auto" 
              onClick={syncOfflineTripLogs}
              disabled={!isOnline || isSyncing}
            >
              sync now
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className={`${isMobile ? 'grid grid-cols-3 w-full' : 'w-full max-w-md'}`}>
          <TabsTrigger value="my-trips">My Trips</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="analytics" disabled={!isOnline}>
            {!isOnline && <WifiOff className="mr-1 h-3 w-3" />}
            Analytics
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="my-trips">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Recent Trips</CardTitle>
            </CardHeader>
            <CardContent className={isMobile ? 'px-2' : ''}>
              <TripList filterType="my-trips" />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="approvals">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Trips Pending Approval</CardTitle>
            </CardHeader>
            <CardContent className={isMobile ? 'px-2' : ''}>
              <TripList filterType="pending-approval" />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics">
          {!isOnline ? (
            <Card>
              <CardContent className="p-8 text-center">
                <WifiOff className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Analytics unavailable offline</h3>
                <p className="text-muted-foreground">
                  Trip analytics require an internet connection to process data.
                  Please reconnect to view this section.
                </p>
              </CardContent>
            </Card>
          ) : (
            <TripAnalytics />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
