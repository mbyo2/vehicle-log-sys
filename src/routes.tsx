import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Dashboard from "@/pages/Dashboard";
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
import { ERPIntegration } from "@/pages/ERPIntegration";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Dashboard />,
  },
  {
    path: "/fleet",
    element: (
      <ProtectedRoute allowedRoles={["company_admin", "supervisor"]}>
        <Fleet />
      </ProtectedRoute>
    ),
  },
  {
    path: "/drivers",
    element: (
      <ProtectedRoute allowedRoles={["company_admin", "supervisor"]}>
        <Drivers />
      </ProtectedRoute>
    ),
  },
  {
    path: "/trips",
    element: (
      <ProtectedRoute allowedRoles={["company_admin", "supervisor"]}>
        <Trips />
      </ProtectedRoute>
    ),
  },
  {
    path: "/trip-approvals",
    element: (
      <ProtectedRoute allowedRoles={["company_admin", "supervisor"]}>
        <TripApprovals />
      </ProtectedRoute>
    ),
  },
  {
    path: "/vehicle-status",
    element: (
      <ProtectedRoute allowedRoles={["company_admin", "supervisor"]}>
        <VehicleStatus />
      </ProtectedRoute>
    ),
  },
  {
    path: "/maintenance",
    element: (
      <ProtectedRoute allowedRoles={["company_admin", "supervisor"]}>
        <Maintenance />
      </ProtectedRoute>
    ),
  },
  {
    path: "/reports",
    element: (
      <ProtectedRoute allowedRoles={["company_admin", "supervisor"]}>
        <Reports />
      </ProtectedRoute>
    ),
  },
  {
    path: "/settings",
    element: (
      <ProtectedRoute allowedRoles={["company_admin"]}>
        <Settings />
      </ProtectedRoute>
    ),
  },
  {
    path: "/companies",
    element: (
      <ProtectedRoute allowedRoles={["company_admin"]}>
        <Companies />
      </ProtectedRoute>
    ),
  },
  {
    path: "/users",
    element: (
      <ProtectedRoute allowedRoles={["company_admin"]}>
        <Users />
      </ProtectedRoute>
    ),
  },
  {
    path: "/erp-integration",
    element: (
      <ProtectedRoute allowedRoles={["company_admin"]}>
        <ERPIntegration />
      </ProtectedRoute>
    ),
  },
]);

export function AppRoutes() {
  return <RouterProvider router={router} />;
}