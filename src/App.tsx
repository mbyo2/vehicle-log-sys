
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ModalProvider } from "@/contexts/ModalContext";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ErrorMonitoringBoundary } from "@/components/security/ErrorMonitoringBoundary";
import { ResponsiveDashboardLayout } from "@/components/layouts/ResponsiveDashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Import pages
import Index from "@/pages/Index";
import SignIn from "@/pages/SignIn";
import SignUp from "@/pages/SignUp";
import Dashboard from "@/pages/Dashboard";
import Fleet from "@/pages/Fleet";
import Users from "@/pages/Users";
import Documents from "@/pages/Documents";
import TripManagement from "@/pages/TripManagement";
import TripApprovals from "@/pages/TripApprovals";
import Trips from "@/pages/Trips";
import VehicleStatus from "@/pages/VehicleStatus";
import Maintenance from "@/pages/Maintenance";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import Profile from "@/pages/Profile";
import Companies from "@/pages/Companies";
import ServiceBookings from "@/pages/ServiceBookings";
import Analytics from "@/pages/Analytics";
import Advertisements from "@/pages/Advertisements";
import Integrations from "@/pages/Integrations";
import Drivers from "@/pages/Drivers";
import DriverPortal from "@/pages/DriverPortal";
import NewTrip from "@/pages/NewTrip";
import VehicleDetails from "@/pages/VehicleDetails";
import { SecurityAuditDashboard } from "@/components/security/SecurityAuditDashboard";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const App = () => (
  <ErrorMonitoringBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="fleet-manager-theme">
        <TooltipProvider>
          <AuthProvider>
            <ModalProvider>
              <BrowserRouter>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/signin" element={<SignIn />} />
                  <Route path="/signup" element={<SignUp />} />
                  
                  {/* Protected routes */}
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <ResponsiveDashboardLayout>
                        <Dashboard />
                      </ResponsiveDashboardLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/companies" element={
                    <ProtectedRoute allowedRoles={['super_admin']}>
                      <ResponsiveDashboardLayout>
                        <Companies />
                      </ResponsiveDashboardLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/security" element={
                    <ProtectedRoute allowedRoles={['super_admin', 'company_admin']}>
                      <ResponsiveDashboardLayout>
                        <SecurityAuditDashboard />
                      </ResponsiveDashboardLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/fleet" element={
                    <ProtectedRoute allowedRoles={['company_admin', 'supervisor']}>
                      <ResponsiveDashboardLayout>
                        <Fleet />
                      </ResponsiveDashboardLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/users" element={
                    <ProtectedRoute allowedRoles={['company_admin', 'supervisor']}>
                      <ResponsiveDashboardLayout>
                        <Users />
                      </ResponsiveDashboardLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/documents" element={
                    <ProtectedRoute>
                      <ResponsiveDashboardLayout>
                        <Documents />
                      </ResponsiveDashboardLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/trip-management" element={
                    <ProtectedRoute allowedRoles={['company_admin', 'supervisor']}>
                      <ResponsiveDashboardLayout>
                        <TripManagement />
                      </ResponsiveDashboardLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/trip-approvals" element={
                    <ProtectedRoute allowedRoles={['supervisor']}>
                      <ResponsiveDashboardLayout>
                        <TripApprovals />
                      </ResponsiveDashboardLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/trips" element={
                    <ProtectedRoute allowedRoles={['driver']}>
                      <ResponsiveDashboardLayout>
                        <Trips />
                      </ResponsiveDashboardLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/vehicle-status" element={
                    <ProtectedRoute allowedRoles={['driver']}>
                      <ResponsiveDashboardLayout>
                        <VehicleStatus />
                      </ResponsiveDashboardLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/maintenance" element={
                    <ProtectedRoute allowedRoles={['company_admin', 'supervisor']}>
                      <ResponsiveDashboardLayout>
                        <Maintenance />
                      </ResponsiveDashboardLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/reports" element={
                    <ProtectedRoute allowedRoles={['company_admin', 'supervisor']}>
                      <ResponsiveDashboardLayout>
                        <Reports />
                      </ResponsiveDashboardLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/settings" element={
                    <ProtectedRoute allowedRoles={['company_admin', 'super_admin']}>
                      <ResponsiveDashboardLayout>
                        <Settings />
                      </ResponsiveDashboardLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <ResponsiveDashboardLayout>
                        <Profile />
                      </ResponsiveDashboardLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/service-bookings" element={
                    <ProtectedRoute>
                      <ResponsiveDashboardLayout>
                        <ServiceBookings />
                      </ResponsiveDashboardLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/analytics" element={
                    <ProtectedRoute allowedRoles={['company_admin', 'supervisor']}>
                      <ResponsiveDashboardLayout>
                        <Analytics />
                      </ResponsiveDashboardLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/advertisements" element={
                    <ProtectedRoute allowedRoles={['super_admin']}>
                      <ResponsiveDashboardLayout>
                        <Advertisements />
                      </ResponsiveDashboardLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/integrations" element={
                    <ProtectedRoute allowedRoles={['company_admin', 'super_admin']}>
                      <ResponsiveDashboardLayout>
                        <Integrations />
                      </ResponsiveDashboardLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/drivers" element={
                    <ProtectedRoute allowedRoles={['company_admin', 'supervisor']}>
                      <ResponsiveDashboardLayout>
                        <Drivers />
                      </ResponsiveDashboardLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/driver-portal" element={
                    <ProtectedRoute allowedRoles={['driver']}>
                      <ResponsiveDashboardLayout>
                        <DriverPortal />
                      </ResponsiveDashboardLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/new-trip" element={
                    <ProtectedRoute allowedRoles={['driver']}>
                      <ResponsiveDashboardLayout>
                        <NewTrip />
                      </ResponsiveDashboardLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/vehicle/:id" element={
                    <ProtectedRoute>
                      <ResponsiveDashboardLayout>
                        <VehicleDetails />
                      </ResponsiveDashboardLayout>
                    </ProtectedRoute>
                  } />
                  
                  {/* Catch all route */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
              <Toaster />
              <Sonner />
            </ModalProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorMonitoringBoundary>
);

export default App;
