
import { Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OnboardingTutorial } from "@/components/onboarding/OnboardingTutorial";
import { HelpCenter } from "@/components/onboarding/HelpCenter";
import "./App.css";

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <TooltipProvider>
        <Outlet />
        <OnboardingTutorial />
        <HelpCenter />
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}
