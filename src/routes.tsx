import { createBrowserRouter } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import { Companies } from "@/pages/Companies";
import { Fleet } from "@/pages/Fleet";
import { Drivers } from "@/pages/Drivers";
import { Trips } from "@/pages/Trips";
import { TripApprovals } from "@/pages/TripApprovals";
import { Reports } from "@/pages/Reports";
import { Maintenance } from "@/pages/Maintenance";
import { VehicleStatus } from "@/pages/VehicleStatus";
import Settings from "@/pages/Settings";
import { Profile } from "@/pages/Profile";
import { Users } from "@/pages/Users";
import { Compliance } from "@/pages/Compliance";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <DashboardLayout><Index /></DashboardLayout>,
  },
  {
    path: "/dashboard",
    element: <DashboardLayout><Dashboard /></DashboardLayout>,
  },
  {
    path: "/companies",
    element: <DashboardLayout><Companies /></DashboardLayout>,
  },
  {
    path: "/fleet",
    element: <DashboardLayout><Fleet /></DashboardLayout>,
  },
  {
    path: "/drivers",
    element: <DashboardLayout><Drivers /></DashboardLayout>,
  },
  {
    path: "/trips",
    element: <DashboardLayout><Trips /></DashboardLayout>,
  },
  {
    path: "/trip-approvals",
    element: <DashboardLayout><TripApprovals /></DashboardLayout>,
  },
  {
    path: "/reports",
    element: <DashboardLayout><Reports /></DashboardLayout>,
  },
  {
    path: "/maintenance",
    element: <DashboardLayout><Maintenance /></DashboardLayout>,
  },
  {
    path: "/vehicle-status",
    element: <DashboardLayout><VehicleStatus /></DashboardLayout>,
  },
  {
    path: "/settings",
    element: <DashboardLayout><Settings /></DashboardLayout>,
  },
  {
    path: "/profile",
    element: <DashboardLayout><Profile /></DashboardLayout>,
  },
  {
    path: "/users",
    element: <DashboardLayout><Users /></DashboardLayout>,
  },
  {
    path: "/compliance",
    element: <DashboardLayout><Compliance /></DashboardLayout>,
  },
]);