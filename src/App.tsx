import { AppRoutes } from './routes';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { ModalProvider } from "@/contexts/ModalContext";
import { QueryClient } from "@tanstack/react-query";
import './App.css';

const queryClient = new QueryClient();

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="ui-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ModalProvider>
            <div className="min-h-screen bg-background">
              <AppRoutes />
              <Toaster />
            </div>
          </ModalProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;