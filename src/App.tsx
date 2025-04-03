
import { Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OnboardingTutorial } from "@/components/onboarding/OnboardingTutorial";
import { HelpCenter } from "@/components/onboarding/HelpCenter";
import { useAuth } from "@/contexts/AuthContext";
import "./App.css";

export default function App() {
  const { user } = useAuth();
  const isAuthenticated = !!user.get();
  
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <TooltipProvider>
        <Outlet />
        {isAuthenticated && (
          <>
            <OnboardingTutorial />
            <HelpCenter />
          </>
        )}
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}
