
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Outlet } from "react-router-dom";
import { SecurityValidationWrapper } from "@/components/security/SecurityValidationWrapper";
import { CompanyBrandingProvider } from "@/components/branding/CompanyBrandingProvider";

const App = () => (
  <TooltipProvider>
    <SecurityValidationWrapper>
      <CompanyBrandingProvider>
        <div className="animate-fade-in">
          <Outlet />
          <Toaster />
          <Sonner />
        </div>
      </CompanyBrandingProvider>
    </SecurityValidationWrapper>
  </TooltipProvider>
);

export default App;
