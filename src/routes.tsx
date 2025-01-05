import { createBrowserRouter } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Index } from "@/pages/Index";
import { Dashboard } from "@/pages/Dashboard";
import { Fleet } from "@/pages/Fleet";
import { Drivers } from "@/pages/Drivers";
import { Trips } from "@/pages/Trips";
import { TripApprovals } from "@/pages/TripApprovals";
import { VehicleStatus } from "@/pages/VehicleStatus";
import { Maintenance } from "@/pages/Maintenance";
import { Reports } from "@/pages/Reports";
import { Settings } from "@/pages/Settings";
import { Companies } from "@/pages/Companies";
import { Users } from "@/pages/Users";
import { Compliance } from "@/pages/Compliance";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <DashboardLayout />,
    children: [
      { index: true, element: <Index /> },
      { path: "dashboard", element: <Dashboard /> },
      { path: "fleet", element: <Fleet /> },
      { path: "drivers", element: <Drivers /> },
      { path: "trips", element: <Trips /> },
      { path: "trip-approvals", element: <TripApprovals /> },
      { path: "vehicle-status", element: <VehicleStatus /> },
      { path: "maintenance", element: <Maintenance /> },
      { path: "reports", element: <Reports /> },
      { path: "settings", element: <Settings /> },
      { path: "companies", element: <Companies /> },
      { path: "users", element: <Users /> },
      { path: "compliance", element: <Compliance /> },
    ],
  },
]);