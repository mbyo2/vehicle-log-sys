
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DriverDashboard } from "@/components/driver/DriverDashboard";
import { MessageList } from "@/components/driver/MessageList";
import { TrainingList } from "@/components/driver/TrainingList";

import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { LayoutDashboard, MessageSquare, GraduationCap } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export default function DriverPortal() {
  const location = useLocation();
  const isMobile = useIsMobile();
  
  // Extract tab from URL path or default to dashboard
  const getTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('/driver/messages')) return 'messages';
    if (path.includes('/driver/trainings')) return 'trainings';
    return 'dashboard';
  };
  
  const [activeTab, setActiveTab] = useState(getTabFromPath());
  
  // Update active tab when location changes
  useEffect(() => {
    setActiveTab(getTabFromPath());
  }, [location.pathname]);
  
  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`${isMobile ? 'mb-4 w-full grid grid-cols-3' : 'mb-8'}`}>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span className={isMobile ? 'hidden sm:inline' : ''}>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className={isMobile ? 'hidden sm:inline' : ''}>Messages</span>
          </TabsTrigger>
          <TabsTrigger value="trainings" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            <span className={isMobile ? 'hidden sm:inline' : ''}>Certifications</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard">
          <DriverDashboard />
        </TabsContent>
        
        <TabsContent value="messages">
          <MessageList />
        </TabsContent>
        
        <TabsContent value="trainings">
          <TrainingList />
        </TabsContent>
      </Tabs>
    </>
  );
}
