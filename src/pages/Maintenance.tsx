import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, Calendar, Package, DollarSign } from "lucide-react";
import { useModal } from '@/contexts/ModalContext';

export function Maintenance() {
  const { openModal } = useModal();
  const [activeTab, setActiveTab] = useState("scheduling");

  const handleScheduleMaintenance = () => {
    // Will implement in next iteration
    console.log("Schedule maintenance clicked");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Vehicle Maintenance</h1>
        <Button onClick={handleScheduleMaintenance}>
          <Calendar className="h-4 w-4 mr-2" />
          Schedule Maintenance
        </Button>
      </div>

      <Tabs defaultValue="scheduling" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="scheduling">
            <Calendar className="h-4 w-4 mr-2" />
            Scheduling
          </TabsTrigger>
          <TabsTrigger value="history">
            <Wrench className="h-4 w-4 mr-2" />
            Service History
          </TabsTrigger>
          <TabsTrigger value="inventory">
            <Package className="h-4 w-4 mr-2" />
            Parts Inventory
          </TabsTrigger>
          <TabsTrigger value="costs">
            <DollarSign className="h-4 w-4 mr-2" />
            Cost Tracking
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scheduling" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Maintenance scheduling interface coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service History</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Service history tracking interface coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Parts Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Parts inventory management interface coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Costs</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Maintenance cost tracking interface coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}