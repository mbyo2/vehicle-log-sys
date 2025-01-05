import { BrowserRouter as Router } from "react-router-dom";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ModalProvider } from "@/contexts/ModalContext";
import { AppRoutes } from "@/routes";

const queryClient = new QueryClient();

const VehicleLogApp = () => {
  return (
    <ThemeProvider defaultTheme="system" storageKey="ui-theme">
      <QueryClientProvider client={queryClient}>
        <Router>
          <AuthProvider>
            <ModalProvider>
              <AppRoutes />
              <Toaster />
            </ModalProvider>
          </AuthProvider>
        </Router>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default VehicleLogApp;