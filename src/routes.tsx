
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
import { TripManagement } from "./pages/TripManagement";
import { Users } from "./pages/Users";
import { Integrations } from "./pages/Integrations";
import App from "./App";

// Create a layout route with the ProtectedRoute component
const ProtectedLayout = () => {
  return (
    <ProtectedRoute>
      <Outlet />
    </ProtectedRoute>
  );
};

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
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
            path: "/",
            element: <Dashboard />,
          },
          {
            path: "dashboard",
            element: <Dashboard />,
          },
          {
            path: "fleet",
            element: <Fleet />,
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
]);
