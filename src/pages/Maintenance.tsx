import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, Calendar, Package, DollarSign, Plus } from "lucide-react";
import { useModal } from '@/contexts/ModalContext';
import { PartsInventory } from '@/components/maintenance/PartsInventory';
import { MaintenanceSchedules } from '@/components/maintenance/MaintenanceSchedules';
import { ServiceHistory } from '@/components/maintenance/ServiceHistory';
import { CostTracking } from '@/components/maintenance/CostTracking';

export function Maintenance() {
  const { openModal } = useModal();
  const [activeTab, setActiveTab] = useState("scheduling");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Vehicle Maintenance</h1>
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

        <TabsContent value="scheduling">
          <MaintenanceSchedules />
        </TabsContent>

        <TabsContent value="history">
          <ServiceHistory />
        </TabsContent>

        <TabsContent value="inventory">
          <PartsInventory />
        </TabsContent>

        <TabsContent value="costs">
          <CostTracking />
        </TabsContent>
      </Tabs>
    </div>
  );
}