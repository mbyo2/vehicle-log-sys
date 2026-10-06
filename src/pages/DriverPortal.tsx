import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DriverDashboard } from "@/components/driver/DriverDashboard";
import { MessageList } from "@/components/driver/MessageList";
import { TrainingList } from "@/components/driver/TrainingList";
import { MyTrips } from "@/components/driver/MyTrips";
import { MyFuelLogs } from "@/components/driver/MyFuelLogs";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, MessageSquare, GraduationCap, Route, Fuel } from "lucide-react";

const TABS = ["dashboard", "trips", "fuel", "messages", "trainings"] as const;

export default function DriverPortal() {
  const location = useLocation();
  const navigate = useNavigate();

  const getTabFromPath = () => {
    const seg = location.pathname.split("/driver/")[1];
    return seg && (TABS as readonly string[]).includes(seg) ? seg : "dashboard";
  };

  const [activeTab, setActiveTab] = useState(getTabFromPath());

  useEffect(() => {
    document.title = "Driver Portal | Fleet Management";
  }, []);

  useEffect(() => {
    setActiveTab(getTabFromPath());
  }, [location.pathname]);

  const changeTab = (tab: string) => {
    setActiveTab(tab);
    navigate(tab === "dashboard" ? "/driver" : `/driver/${tab}`);
  };

  return (
    <Tabs value={activeTab} onValueChange={changeTab} className="w-full">
      <TabsList className="mb-6 w-full sm:w-auto grid grid-cols-5 sm:inline-flex">
        <TabsTrigger value="dashboard" className="flex items-center gap-2"><LayoutDashboard className="h-4 w-4" /><span className="hidden sm:inline">Dashboard</span></TabsTrigger>
        <TabsTrigger value="trips" className="flex items-center gap-2"><Route className="h-4 w-4" /><span className="hidden sm:inline">My Trips</span></TabsTrigger>
        <TabsTrigger value="fuel" className="flex items-center gap-2"><Fuel className="h-4 w-4" /><span className="hidden sm:inline">My Fuel</span></TabsTrigger>
        <TabsTrigger value="messages" className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /><span className="hidden sm:inline">Messages</span></TabsTrigger>
        <TabsTrigger value="trainings" className="flex items-center gap-2"><GraduationCap className="h-4 w-4" /><span className="hidden sm:inline">Certifications</span></TabsTrigger>
      </TabsList>
      <TabsContent value="dashboard"><DriverDashboard /></TabsContent>
      <TabsContent value="trips"><MyTrips /></TabsContent>
      <TabsContent value="fuel"><MyFuelLogs /></TabsContent>
      <TabsContent value="messages"><MessageList /></TabsContent>
      <TabsContent value="trainings"><TrainingList /></TabsContent>
    </Tabs>
  );
}
