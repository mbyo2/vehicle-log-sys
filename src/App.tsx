
import { Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OnboardingTutorial } from "@/components/onboarding/OnboardingTutorial";
import { HelpCenter } from "@/components/onboarding/HelpCenter";
import { useAuth } from "@/contexts/AuthContext";
import { AppLoadingScreen } from "@/components/ui/AppLoadingScreen";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import "./App.css";

export default function App() {
  const { user } = useAuth();
  const isAuthenticated = !!user.get();
  
  return (
    <>
      <TooltipProvider>
        <AppLoadingScreen />
        <Outlet />
        {isAuthenticated && (
          <>
            <OnboardingTutorial />
            <HelpCenter />
          </>
        )}
        <OfflineBanner />
        <Toaster />
      </TooltipProvider>
    </>
  );
}
