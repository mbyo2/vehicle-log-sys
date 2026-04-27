import { createBrowserRouter, Outlet } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import { ModalProvider } from "./contexts/ModalContext";
import { AuthenticatedLayout } from "./components/layouts/AuthenticatedLayout";
import { ResponsiveDashboardLayout } from "./components/layouts/ResponsiveDashboardLayout";
import { ErrorMonitoringBoundary } from "./components/security/ErrorMonitoringBoundary";
import { LoadingSpinner } from "./components/ui/loading-spinner";

// Eagerly loaded entry pages
import Index from "./pages/Index";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";

// Code-split everything else
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Fleet = lazy(() => import("./pages/Fleet").then(m => ({ default: m.Fleet })));
const Drivers = lazy(() => import("./pages/Drivers").then(m => ({ default: m.Drivers })));
const Companies = lazy(() => import("./pages/Companies").then(m => ({ default: m.Companies })));
const Documents = lazy(() => import("./pages/Documents"));
const Maintenance = lazy(() => import("./pages/Maintenance").then(m => ({ default: m.Maintenance })));
const AcceptInvitation = lazy(() => import("./pages/AcceptInvitation"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Settings = lazy(() => import("./pages/Settings").then(m => ({ default: m.Settings })));
const ServiceBookings = lazy(() => import("./pages/ServiceBookings").then(m => ({ default: m.ServiceBookings })));
const Trips = lazy(() => import("./pages/Trips").then(m => ({ default: m.Trips })));
const Profile = lazy(() => import("./pages/Profile"));
const TripApprovals = lazy(() => import("./pages/TripApprovals").then(m => ({ default: m.TripApprovals })));
const VehicleStatus = lazy(() => import("./pages/VehicleStatus").then(m => ({ default: m.VehicleStatus })));
const DriverPortal = lazy(() => import("./pages/DriverPortal"));
const Advertisements = lazy(() => import("./pages/Advertisements").then(m => ({ default: m.Advertisements })));
const Analytics = lazy(() => import("./pages/Analytics").then(m => ({ default: m.Analytics })));
const Reports = lazy(() => import("./pages/Reports").then(m => ({ default: m.Reports })));
const TripManagement = lazy(() => import("./pages/TripManagement"));
const FuelManagement = lazy(() => import("./pages/FuelManagement").then(m => ({ default: m.FuelManagement })));
const Exports = lazy(() => import("./pages/Exports").then(m => ({ default: m.Exports })));
const Users = lazy(() => import("./pages/Users"));
const UserManagement = lazy(() => import("./pages/UserManagement").then(m => ({ default: m.UserManagement })));
const Integrations = lazy(() => import("./pages/Integrations").then(m => ({ default: m.Integrations })));
const VehicleDetails = lazy(() => import("./pages/VehicleDetails"));
const NewTrip = lazy(() => import("./pages/NewTrip"));
const Setup = lazy(() => import("./pages/Setup"));
const Security = lazy(() => import("./pages/Security"));
const NotFound = lazy(() => import("./pages/NotFound"));

const PageFallback = () => (
  <div className="flex items-center justify-center min-h-[40vh]">
    <LoadingSpinner size={32} />
  </div>
);

const withSuspense = (node: React.ReactNode) => (
  <Suspense fallback={<PageFallback />}>{node}</Suspense>
);

const RootLayout = () => (
  <ErrorMonitoringBoundary>
    <AuthProvider>
      <ModalProvider>
        <App />
      </ModalProvider>
    </AuthProvider>
  </ErrorMonitoringBoundary>
);

const ProtectedLayout = () => (
  <ProtectedRoute>
    <ResponsiveDashboardLayout>
      <Suspense fallback={<PageFallback />}>
        <Outlet />
      </Suspense>
    </ResponsiveDashboardLayout>
  </ProtectedRoute>
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Index /> },
      { path: "signin", element: <SignIn /> },
      { path: "signup", element: <SignUp /> },
      { path: "accept-invitation", element: withSuspense(<AcceptInvitation />) },
      { path: "reset-password", element: withSuspense(<ResetPassword />) },
      {
        path: "/",
        element: <ProtectedLayout />,
        children: [
          { path: "dashboard", element: <Dashboard /> },
          { path: "companies", element: <ProtectedRoute allowedRoles={['super_admin']}><Companies /></ProtectedRoute> },
          { path: "security", element: <ProtectedRoute allowedRoles={['super_admin', 'company_admin']}><Security /></ProtectedRoute> },
          { path: "fleet", element: <ProtectedRoute allowedRoles={['super_admin', 'company_admin', 'supervisor']}><Fleet /></ProtectedRoute> },
          { path: "fleet/:id", element: <ProtectedRoute allowedRoles={['super_admin', 'company_admin', 'supervisor']}><VehicleDetails /></ProtectedRoute> },
          { path: "drivers", element: <ProtectedRoute allowedRoles={['super_admin', 'company_admin', 'supervisor']}><Drivers /></ProtectedRoute> },
          { path: "users", element: <ProtectedRoute allowedRoles={['super_admin', 'company_admin']}><Users /></ProtectedRoute> },
          { path: "user-management", element: <ProtectedRoute allowedRoles={['super_admin', 'company_admin', 'supervisor']}><UserManagement /></ProtectedRoute> },
          { path: "documents", element: <Documents /> },
          { path: "trip-management", element: <ProtectedRoute allowedRoles={['super_admin', 'company_admin', 'supervisor']}><TripManagement /></ProtectedRoute> },
          { path: "trip-approvals", element: <ProtectedRoute allowedRoles={['super_admin', 'company_admin', 'supervisor']}><TripApprovals /></ProtectedRoute> },
          { path: "trips", element: <ProtectedRoute allowedRoles={['driver']}><Trips /></ProtectedRoute> },
          { path: "vehicle-status", element: <ProtectedRoute allowedRoles={['driver']}><VehicleStatus /></ProtectedRoute> },
          { path: "maintenance", element: <ProtectedRoute allowedRoles={['super_admin', 'company_admin', 'supervisor']}><Maintenance /></ProtectedRoute> },
          { path: "reports", element: <ProtectedRoute allowedRoles={['super_admin', 'company_admin', 'supervisor']}><Reports /></ProtectedRoute> },
          { path: "fuel", element: <ProtectedRoute allowedRoles={['super_admin', 'company_admin', 'supervisor']}><FuelManagement /></ProtectedRoute> },
          { path: "exports", element: <ProtectedRoute allowedRoles={['super_admin', 'company_admin']}><Exports /></ProtectedRoute> },
          { path: "settings", element: <ProtectedRoute allowedRoles={['company_admin', 'super_admin']}><Settings /></ProtectedRoute> },
          { path: "service-bookings", element: <ServiceBookings /> },
          { path: "new-trip", element: <ProtectedRoute allowedRoles={['driver']}><NewTrip /></ProtectedRoute> },
          { path: "new-trip/:vehicleId", element: <ProtectedRoute allowedRoles={['driver']}><NewTrip /></ProtectedRoute> },
          { path: "profile", element: <Profile /> },
          { path: "driver-portal", element: <ProtectedRoute allowedRoles={['driver']}><DriverPortal /></ProtectedRoute> },
          { path: "driver", element: <ProtectedRoute allowedRoles={['driver']}><DriverPortal /></ProtectedRoute> },
          { path: "driver/messages", element: <ProtectedRoute allowedRoles={['driver']}><DriverPortal /></ProtectedRoute> },
          { path: "driver/trainings", element: <ProtectedRoute allowedRoles={['driver']}><DriverPortal /></ProtectedRoute> },
          { path: "advertisements", element: <ProtectedRoute allowedRoles={['super_admin']}><Advertisements /></ProtectedRoute> },
          { path: "analytics", element: <ProtectedRoute allowedRoles={['super_admin', 'company_admin', 'supervisor']}><Analytics /></ProtectedRoute> },
          { path: "integrations", element: <ProtectedRoute allowedRoles={['company_admin', 'super_admin']}><Integrations /></ProtectedRoute> },
          { path: "setup", element: <ProtectedRoute allowedRoles={['super_admin']}><Setup /></ProtectedRoute> },
        ],
      },
      { path: "*", element: withSuspense(<NotFound />) },
    ],
  },
]);
