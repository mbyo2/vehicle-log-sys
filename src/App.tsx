
import { Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLoadingScreen } from "@/components/ui/AppLoadingScreen";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import "./App.css";

export default function App() {
  return (
    <>
      <TooltipProvider>
        <AppLoadingScreen />
        <Outlet />
        <OfflineBanner />
        <Toaster />
      </TooltipProvider>
    </>
  );
}
