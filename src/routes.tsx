
import { createBrowserRouter, Outlet } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import { Fleet } from "./pages/Fleet";
import { Drivers } from "./pages/Drivers";
import { Companies } from "./pages/Companies";
import Documents from "./pages/Documents";
import { Maintenance } from "./pages/Maintenance";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import AcceptInvitation from "./pages/AcceptInvitation";
import ResetPassword from "./pages/ResetPassword";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { Settings } from "./pages/Settings";
import { ServiceBookings } from "./pages/ServiceBookings";
import { Trips } from "./pages/Trips";
import Profile from "./pages/Profile";
import { TripApprovals } from "./pages/TripApprovals";
import { VehicleStatus } from "./pages/VehicleStatus";
import DriverPortal from "./pages/DriverPortal";
import { Advertisements } from "./pages/Advertisements";
import { Analytics } from "./pages/Analytics";
import { Reports } from "./pages/Reports";
import TripManagement from "./pages/TripManagement";
import Users from "./pages/Users";
import { UserManagement } from "./pages/UserManagement";
import { Integrations } from "./pages/Integrations";
import App from "./App";
import Index from "./pages/Index";
import { AuthProvider } from "./contexts/AuthContext";
import { ModalProvider } from "./contexts/ModalContext";
import { AuthenticatedLayout } from "./components/layouts/AuthenticatedLayout";
import VehicleDetails from "./pages/VehicleDetails";
import NewTrip from "./pages/NewTrip";
import Setup from "./pages/Setup";
import Security from "./pages/Security";
import { SecurityAuditDashboard } from "./components/security/SecurityAuditDashboard";
import { ResponsiveDashboardLayout } from "./components/layouts/ResponsiveDashboardLayout";
import { ErrorMonitoringBoundary } from "./components/security/ErrorMonitoringBoundary";

// Create a layout route with the providers
const RootLayout = () => {
  return (
    <ErrorMonitoringBoundary>
      <AuthProvider>
        <ModalProvider>
          <App />
        </ModalProvider>
      </AuthProvider>
    </ErrorMonitoringBoundary>
  );
};

// Create a layout route with the ProtectedRoute component and authenticated features
const ProtectedLayout = () => {
  return (
    <ProtectedRoute>
      <ResponsiveDashboardLayout>
        <Outlet />
      </ResponsiveDashboardLayout>
    </ProtectedRoute>
  );
};

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <Index />,
      },
      {
        path: "signin",
        element: <SignIn />,
      },
      {
        path: "signup",
        element: <SignUp />,
      },
      {
        path: "accept-invitation",
        element: <AcceptInvitation />,
      },
      {
        path: "reset-password",
        element: <ResetPassword />,
      },
      {
        path: "/",
        element: <ProtectedLayout />,
        children: [
          {
            path: "dashboard",
            element: <Dashboard />,
          },
          {
            path: "companies",
            element: (
              <ProtectedRoute allowedRoles={['super_admin']}>
                <Companies />
              </ProtectedRoute>
            ),
          },
          {
            path: "security",
            element: (
              <ProtectedRoute allowedRoles={['super_admin', 'company_admin']}>
                <Security />
              </ProtectedRoute>
            ),
          },
          {
            path: "fleet",
            element: (
              <ProtectedRoute allowedRoles={['super_admin', 'company_admin', 'supervisor']}>
                <Fleet />
              </ProtectedRoute>
            ),
          },
          {
            path: "fleet/:id",
            element: <VehicleDetails />,
          },
          {
            path: "drivers",
            element: (
              <ProtectedRoute allowedRoles={['super_admin', 'company_admin', 'supervisor']}>
                <Drivers />
              </ProtectedRoute>
            ),
          },
          {
            path: "users",
            element: (
              <ProtectedRoute allowedRoles={['super_admin', 'company_admin']}>
                <Users />
              </ProtectedRoute>
            ),
          },
          {
            path: "user-management",
            element: (
               <ProtectedRoute allowedRoles={['super_admin', 'company_admin', 'supervisor']}>
                <UserManagement />
              </ProtectedRoute>
            ),
          },
          {
            path: "documents",
            element: <Documents />,
          },
          {
            path: "trip-management",
            element: (
              <ProtectedRoute allowedRoles={['super_admin', 'company_admin', 'supervisor']}>
                <TripManagement />
              </ProtectedRoute>
            ),
          },
          {
            path: "trip-approvals",
            element: (
              <ProtectedRoute allowedRoles={['super_admin', 'company_admin', 'supervisor']}>
                <TripApprovals />
              </ProtectedRoute>
            ),
          },
          {
            path: "trips",
            element: (
              <ProtectedRoute allowedRoles={['driver']}>
                <Trips />
              </ProtectedRoute>
            ),
          },
          {
            path: "vehicle-status",
            element: (
              <ProtectedRoute allowedRoles={['driver']}>
                <VehicleStatus />
              </ProtectedRoute>
            ),
          },
          {
            path: "maintenance",
            element: (
              <ProtectedRoute allowedRoles={['super_admin', 'company_admin', 'supervisor']}>
                <Maintenance />
              </ProtectedRoute>
            ),
          },
          {
            path: "reports",
            element: (
              <ProtectedRoute allowedRoles={['super_admin', 'company_admin', 'supervisor']}>
                <Reports />
              </ProtectedRoute>
            ),
          },
          {
            path: "settings",
            element: (
              <ProtectedRoute allowedRoles={['company_admin', 'super_admin']}>
                <Settings />
              </ProtectedRoute>
            ),
          },
          {
            path: "service-bookings",
            element: <ServiceBookings />,
          },
          {
            path: "new-trip",
            element: (
              <ProtectedRoute allowedRoles={['driver']}>
                <NewTrip />
              </ProtectedRoute>
            ),
          },
          {
            path: "new-trip/:vehicleId",
            element: (
              <ProtectedRoute allowedRoles={['driver']}>
                <NewTrip />
              </ProtectedRoute>
            ),
          },
          {
            path: "profile",
            element: <Profile />,
          },
          {
            path: "driver-portal",
            element: (
              <ProtectedRoute allowedRoles={['driver']}>
                <DriverPortal />
              </ProtectedRoute>
            ),
          },
          {
            path: "driver",
            element: (
              <ProtectedRoute allowedRoles={['driver']}>
                <DriverPortal />
              </ProtectedRoute>
            ),
          },
          {
            path: "driver/messages",
            element: (
              <ProtectedRoute allowedRoles={['driver']}>
                <DriverPortal />
              </ProtectedRoute>
            ),
          },
          {
            path: "driver/trainings",
            element: (
              <ProtectedRoute allowedRoles={['driver']}>
                <DriverPortal />
              </ProtectedRoute>
            ),
          },
          {
            path: "advertisements",
            element: (
              <ProtectedRoute allowedRoles={['super_admin']}>
                <Advertisements />
              </ProtectedRoute>
            ),
          },
          {
            path: "analytics",
            element: (
              <ProtectedRoute allowedRoles={['super_admin', 'company_admin', 'supervisor']}>
                <Analytics />
              </ProtectedRoute>
            ),
          },
          {
            path: "integrations",
            element: (
              <ProtectedRoute allowedRoles={['company_admin', 'super_admin']}>
                <Integrations />
              </ProtectedRoute>
            ),
          },
          {
            path: "setup",
            element: (
              <ProtectedRoute allowedRoles={['super_admin']}>
                <Setup />
              </ProtectedRoute>
            ),
          },
        ],
      },
    ],
  },
]);
