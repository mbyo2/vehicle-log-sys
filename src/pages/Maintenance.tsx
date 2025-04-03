
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, Calendar, Package, DollarSign, Plus, AlertCircle } from "lucide-react";
import { useModal } from '@/contexts/ModalContext';
import { PartsInventory } from '@/components/maintenance/PartsInventory';
import { MaintenanceSchedules } from '@/components/maintenance/MaintenanceSchedules';
import { ServiceHistory } from '@/components/maintenance/ServiceHistory';
import { CostTracking } from '@/components/maintenance/CostTracking';
import { useIsMobile } from '@/hooks/useIsMobile';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MaintenanceScheduler } from '@/components/vehicle/MaintenanceScheduler';
import { ServiceBookingForm } from '@/components/maintenance/ServiceBookingForm';

export function Maintenance() {
  const { openModal } = useModal();
  const [activeTab, setActiveTab] = useState("scheduling");
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Vehicle Maintenance</h1>
        <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'space-x-2'}`}>
          <Button 
            variant="outline" 
            onClick={() => setIsBookingDialogOpen(true)}
            className={isMobile ? "w-full" : ""}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Book Service
          </Button>
          <Button
            onClick={() => setIsScheduleDialogOpen(true)}
            className={isMobile ? "w-full" : ""}
          >
            <Plus className="h-4 w-4 mr-2" />
            Schedule Maintenance
          </Button>
        </div>
      </div>

      <Tabs defaultValue="scheduling" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList className={`${isMobile ? 'grid grid-cols-4 w-full' : 'w-full max-w-md'}`}>
          <TabsTrigger value="scheduling">
            <Calendar className="h-4 w-4 mr-2" />
            <span className={isMobile ? "hidden" : ""}>Scheduling</span>
            <span className={isMobile ? "" : "hidden"}>Plan</span>
          </TabsTrigger>
          <TabsTrigger value="history">
            <Wrench className="h-4 w-4 mr-2" />
            <span className={isMobile ? "hidden" : ""}>Service History</span>
            <span className={isMobile ? "" : "hidden"}>History</span>
          </TabsTrigger>
          <TabsTrigger value="inventory">
            <Package className="h-4 w-4 mr-2" />
            <span className={isMobile ? "hidden" : ""}>Parts Inventory</span>
            <span className={isMobile ? "" : "hidden"}>Parts</span>
          </TabsTrigger>
          <TabsTrigger value="costs">
            <DollarSign className="h-4 w-4 mr-2" />
            <span className={isMobile ? "hidden" : ""}>Cost Tracking</span>
            <span className={isMobile ? "" : "hidden"}>Costs</span>
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
      
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className={isMobile ? "w-[95vw] max-w-lg" : "max-w-md"}>
          <DialogHeader>
            <DialogTitle>Schedule Maintenance</DialogTitle>
          </DialogHeader>
          <MaintenanceScheduler onScheduleComplete={() => setIsScheduleDialogOpen(false)} />
        </DialogContent>
      </Dialog>
      
      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
        <DialogContent className={isMobile ? "w-[95vw] max-w-lg" : "max-w-md"}>
          <DialogHeader>
            <DialogTitle>Book Service Center</DialogTitle>
          </DialogHeader>
          <ServiceBookingForm onSuccess={() => setIsBookingDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
