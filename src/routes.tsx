
import { createBrowserRouter, Outlet } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import { Fleet } from "./pages/Fleet";
import { Drivers } from "./pages/Drivers";
import { Companies } from "./pages/Companies";
import Documents from "./pages/Documents";
import { Maintenance } from "./pages/Maintenance";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
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
import { Users } from "./pages/Users";
import { Integrations } from "./pages/Integrations";
import App from "./App";
import Index from "./pages/Index";
import { AuthProvider } from "./contexts/AuthContext";
import { ModalProvider } from "./contexts/ModalContext";
import { AuthenticatedLayout } from "./components/layouts/AuthenticatedLayout";
import VehicleDetails from "./pages/VehicleDetails";
import NewTrip from "./pages/NewTrip";

// Create a layout route with the providers
const RootLayout = () => {
  return (
    <AuthProvider>
      <ModalProvider>
        <Outlet />
      </ModalProvider>
    </AuthProvider>
  );
};

// Create a layout route with the ProtectedRoute component and authenticated features
const ProtectedLayout = () => {
  return (
    <ProtectedRoute>
      <AuthenticatedLayout>
        <Outlet />
      </AuthenticatedLayout>
    </ProtectedRoute>
  );
};

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        path: "/",
        element: <App />,
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
            path: "/",
            element: <ProtectedLayout />,
            children: [
              {
                path: "dashboard",
                element: <Dashboard />,
              },
              {
                path: "fleet",
                element: <Fleet />,
              },
              {
                path: "fleet/:id",
                element: <VehicleDetails />,
              },
              {
                path: "drivers",
                element: <Drivers />,
              },
              {
                path: "companies",
                element: <Companies />,
              },
              {
                path: "documents",
                element: <Documents />,
              },
              {
                path: "maintenance",
                element: <Maintenance />,
              },
              {
                path: "settings",
                element: <Settings />,
              },
              {
                path: "service-bookings",
                element: <ServiceBookings />,
              },
              {
                path: "trips",
                element: <Trips />,
              },
              {
                path: "new-trip",
                element: <NewTrip />,
              },
              {
                path: "new-trip/:vehicleId",
                element: <NewTrip />,
              },
              {
                path: "profile",
                element: <Profile />,
              },
              {
                path: "trip-approvals",
                element: <TripApprovals />,
              },
              {
                path: "vehicle-status",
                element: <VehicleStatus />,
              },
              {
                path: "driver-portal",
                element: <DriverPortal />,
              },
              {
                path: "advertisements",
                element: <Advertisements />,
              },
              {
                path: "analytics",
                element: <Analytics />,
              },
              {
                path: "reports",
                element: <Reports />,
              },
              {
                path: "trip-management",
                element: <TripManagement />,
              },
              {
                path: "users",
                element: <Users />,
              },
              {
                path: "integrations",
                element: <Integrations />,
              },
            ],
          },
        ],
      },
    ],
  },
]);
