
import { createBrowserRouter } from "react-router-dom";
import { Dashboard } from "./pages/Dashboard";
import { Fleet } from "./pages/Fleet";
import { Drivers } from "./pages/Drivers";
import { Companies } from "./pages/Companies";
import { Documents } from "./pages/Documents";
import { Maintenance } from "./pages/Maintenance";
import { SignIn } from "./pages/SignIn";
import { SignUp } from "./pages/SignUp";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { Settings } from "./pages/Settings";
import { ServiceBookings } from "./pages/ServiceBookings";
import { Trips } from "./pages/Trips";
import { Profile } from "./pages/Profile";
import { TripApprovals } from "./pages/TripApprovals";
import { VehicleStatus } from "./pages/VehicleStatus";
import { DriverPortal } from "./pages/DriverPortal";
import { Advertisements } from "./pages/Advertisements";
import { Analytics } from "./pages/Analytics";
import { Reports } from "./pages/Reports";
import { TripManagement } from "./pages/TripManagement";
import { Users } from "./pages/Users";
import { Integrations } from "./pages/Integrations";

export const router = createBrowserRouter([
  {
    path: "/signin",
    element: <SignIn />,
  },
  {
    path: "/signup",
    element: <SignUp />,
  },
  {
    path: "/",
    element: <ProtectedRoute><Dashboard /></ProtectedRoute>,
  },
  {
    path: "/fleet",
    element: <ProtectedRoute><Fleet /></ProtectedRoute>,
  },
  {
    path: "/drivers",
    element: <ProtectedRoute><Drivers /></ProtectedRoute>,
  },
  {
    path: "/companies",
    element: <ProtectedRoute><Companies /></ProtectedRoute>,
  },
  {
    path: "/documents",
    element: <ProtectedRoute><Documents /></ProtectedRoute>,
  },
  {
    path: "/maintenance",
    element: <ProtectedRoute><Maintenance /></ProtectedRoute>,
  },
  {
    path: "/settings",
    element: <ProtectedRoute><Settings /></ProtectedRoute>,
  },
  {
    path: "/service-bookings",
    element: <ProtectedRoute><ServiceBookings /></ProtectedRoute>,
  },
  {
    path: "/trips",
    element: <ProtectedRoute><Trips /></ProtectedRoute>,
  },
  {
    path: "/profile",
    element: <ProtectedRoute><Profile /></ProtectedRoute>,
  },
  {
    path: "/trip-approvals",
    element: <ProtectedRoute><TripApprovals /></ProtectedRoute>,
  },
  {
    path: "/vehicle-status",
    element: <ProtectedRoute><VehicleStatus /></ProtectedRoute>,
  },
  {
    path: "/driver-portal",
    element: <ProtectedRoute><DriverPortal /></ProtectedRoute>,
  },
  {
    path: "/advertisements",
    element: <ProtectedRoute><Advertisements /></ProtectedRoute>,
  },
  {
    path: "/analytics",
    element: <ProtectedRoute><Analytics /></ProtectedRoute>,
  },
  {
    path: "/reports",
    element: <ProtectedRoute><Reports /></ProtectedRoute>,
  },
  {
    path: "/trip-management",
    element: <ProtectedRoute><TripManagement /></ProtectedRoute>,
  },
  {
    path: "/users",
    element: <ProtectedRoute><Users /></ProtectedRoute>,
  },
  {
    path: "/integrations",
    element: <ProtectedRoute><Integrations /></ProtectedRoute>,
  },
]);
