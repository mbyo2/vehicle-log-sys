
import { useState } from "react";
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
import { Plus } from "lucide-react";
import { useTripLog } from "@/hooks/useTripLog";
import { useIsMobile } from "@/hooks/use-mobile";

export function TripManagement() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("my-trips");
  const { tripLog, updateTripLog, saveTripLog } = useTripLog();
  const isMobile = useIsMobile();
  
  const handleSave = async () => {
    await saveTripLog();
    setIsOpen(false);
  };
  
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
              <Button onClick={handleSave}>Save Trip</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className={`${isMobile ? 'grid grid-cols-3 w-full' : 'w-full max-w-md'}`}>
          <TabsTrigger value="my-trips">My Trips</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
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
          <TripAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}
