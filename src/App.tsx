
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Outlet } from "react-router-dom";
import { PerformanceMonitor } from "@/components/ui/performance-monitor";
import { SecurityValidationWrapper } from "@/components/security/SecurityValidationWrapper";

const App = () => (
  <TooltipProvider>
    <SecurityValidationWrapper>
      <div className="animate-fade-in">
        <Outlet />
        <Toaster />
        <Sonner />
        <PerformanceMonitor />
      </div>
    </SecurityValidationWrapper>
  </TooltipProvider>
);

export default App;
