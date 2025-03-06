
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TripLog } from "@/types/vehicle";
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
import { format } from "date-fns";

export function TripManagement() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("my-trips");
  const { tripLog, updateTripLog, saveTripLog } = useTripLog();
  
  const handleSave = async () => {
    await saveTripLog();
    setIsOpen(false);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Trip Management</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Log New Trip
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
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

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="my-trips">My Trips</TabsTrigger>
          <TabsTrigger value="approvals">Approval Queue</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="my-trips">
          <Card>
            <CardHeader>
              <CardTitle>Recent Trips</CardTitle>
            </CardHeader>
            <CardContent>
              <TripList filterType="my-trips" />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="approvals">
          <Card>
            <CardHeader>
              <CardTitle>Trips Pending Approval</CardTitle>
            </CardHeader>
            <CardContent>
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
